

from playwright.sync_api import sync_playwright
import pandas as pd
import re


SCHEDULE_URL = "https://live19.dentrixascend.com/pm#/schedule/calendar"

PPO_KEYWORDS = [
    "bcbs", "bcbsil", "blue cross",
    "aetna", "cigna", "metlife", "guardian",
    "anthem", "ameritas", "principal",
    "uhc", "united", "delta",
    "sunlife", "geha", "teamcare",
    "concordia", "mutual", "ddwa", "ddoh",
    "ddva", "ddil", "ddga", "ddnj", "ddpa",
    "ddnc", "ddwi", "ddar", "ddtoolkit",
    "ushealth", "unum", "careington", "bcbs fep"
]

NON_PPO_KEYWORDS = [
    "medicaid", "medicare",
    "humana medicare",
    "ddmo", "dmo", "hmo",
    "state", "chip"
]


def clean_text(value: str) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def extract_time_from_card_text(text: str) -> str:
    if not text:
        return ""
    match = re.search(r"\b\d{1,2}:\d{2}\s?(AM|PM)\b", text, re.IGNORECASE)
    return match.group(0) if match else ""


def close_popups(page):
    selectors = [
        "button:has-text('Done')",
        "button:has-text('Close')",
        "button:has-text('OK')",
        "button:has-text('Cancel')",
        ".close",
        "[aria-label='Close']",
        "[title='Close']"
    ]

    for _ in range(5):
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
        except:
            pass

        for sel in selectors:
            try:
                loc = page.locator(sel)
                if loc.count() > 0 and loc.first.is_visible():
                    loc.first.click(timeout=500)
                    page.wait_for_timeout(300)
            except:
                pass


def classify_insurance(primary, secondary):
    text = f"{primary} {secondary}".lower()

    if any(x in text for x in NON_PPO_KEYWORDS):
        return "Government"

    if any(x in text for x in PPO_KEYWORDS):
        return "PPO"

    return "Unknown"


def read_insurance(page):
    primary = "No info"
    secondary = "No info"

    try:
        page.wait_for_timeout(2000)

        carriers = page.locator('[data-name="carrier"]')
        plans = page.locator('[data-name="plan"]')

        for i in range(carriers.count()):
            carrier = clean_text(carriers.nth(i).inner_text())

            plan = ""
            if plans.count() > i:
                plan = clean_text(plans.nth(i).inner_text())

            full_name = clean_text(f"{carrier} {plan}")

            parent = carriers.nth(i).locator("xpath=ancestor::td[1]")
            coverage = parent.locator('[data-name="coverageType"]')
            coverage_text = clean_text(coverage.inner_text()) if coverage.count() > 0 else ""

            if "Primary" in coverage_text and primary == "No info":
                primary = full_name

            elif "Secondary" in coverage_text and secondary == "No info":
                secondary = full_name

    except Exception as e:
        print("Error leyendo insurance:", e)

    return primary, secondary


def collect_appointments(page):
    appointments_data = []
    seen = set()

    appointment_name_locator = page.locator('[name="displayFullNameWrapper"]')
    count = appointment_name_locator.count()

    print(f"\nSe encontraron {count} bloques con nombre de cita.\n")

    for i in range(count):
        try:
            name_block = appointment_name_locator.nth(i)
            patient_name = clean_text(name_block.locator(".displayFullName").inner_text())

            if not patient_name:
                continue

            card = name_block.locator("xpath=ancestor::div[contains(@class, 'appointment')][1]")
            card_text = clean_text(card.inner_text()) if card.count() > 0 else clean_text(name_block.inner_text())
            appt_time = extract_time_from_card_text(card_text)

            key = (patient_name, appt_time)
            if key in seen:
                continue
            seen.add(key)

            appointments_data.append({
                "patient_name": patient_name,
                "appointment_time": appt_time
            })

        except Exception as e:
            print(f"Error leyendo cita #{i}: {e}")

    return appointments_data

def open_patient_from_schedule(page, patient_name):
    try:
        locator = page.locator(".displayFullName", has_text=patient_name).first
        locator.click(timeout=5000)
        page.wait_for_timeout(1500)
        return True
    except Exception as e:
        print(f"No pude abrir a {patient_name}: {e}")
        return False


def main():
    results = []

    with sync_playwright() as p:
       
        context = p.chromium.launch_persistent_context("user_data", headless=False)
        page = context.pages[0] if context.pages else context.new_page()

        page.goto(SCHEDULE_URL, wait_until="load")

        print("\nHaz login manual en Dentrix.")
        input("Cuando ya estés dentro y veas la agenda del día, presiona ENTER aquí...")

        page.wait_for_timeout(3000)

        # PASO 1: recolectar TODO primero, sin abrir seguros todavía
        appointments_data = collect_appointments(page)
        print(f"\nTotal de citas guardadas en lista fija: {len(appointments_data)}\n")

        # PASO 2: recorrer esa lista fija
        for idx, appt in enumerate(appointments_data, start=1):
            patient_name = appt["patient_name"]
            appt_time = appt["appointment_time"]

            print(f"[{idx}/{len(appointments_data)}] Procesando: {patient_name}")

            primary = "No info"
            secondary = "No info"

            try:
                page.goto(SCHEDULE_URL, wait_until="load")
                page.wait_for_timeout(2500)

                opened = open_patient_from_schedule(page, patient_name)
                if not opened:
                    results.append({
                        "Patient Name": patient_name,
                        "Appointment Time": appt_time,
                        "Primary Insurance": primary,
                        "Secondary Insurance": secondary,
                        "Category": "Unknown"
                    })
                    continue

                close_popups(page)

                try:
                    page.locator("a.patientInsuranceInfo").first.click(timeout=3000)
                    page.wait_for_timeout(2000)
                    close_popups(page)
                    primary, secondary = read_insurance(page)
                except Exception as e:
                    print(f"No pude abrir insurance para {patient_name}: {e}")

                category = classify_insurance(primary, secondary)

                results.append({
                    "Patient Name": patient_name,
                    "Appointment Time": appt_time,
                    "Primary Insurance": primary,
                    "Secondary Insurance": secondary,
                    "Category": category
                })

            except Exception as e:
                print(f"Error procesando {patient_name}: {e}")
                results.append({
                    "Patient Name": patient_name,
                    "Appointment Time": appt_time,
                    "Primary Insurance": primary,
                    "Secondary Insurance": secondary,
                    "Category": "Unknown"
                })

        df = pd.DataFrame(results)
        output_file = "dentrix_schedule_with_insurance.xlsx"
        df.to_excel(output_file, index=False)

        print("\nListo.")
        print(df)
        print(f"\nArchivo guardado: {output_file}")

        input("\nPresiona ENTER para cerrar el navegador...")
        browser.close()


if __name__ == "__main__":
    main()