"""
Dentrix Ascend → Google Sheet robot (Laura's operational logic).

Invoked by the FastAPI app (in-process thread) or via `python -m app.robots.cli`.
"""

from __future__ import annotations

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from datetime import datetime, timedelta, timezone
import re
import time
from pathlib import Path
import gspread
from google.oauth2.service_account import Credentials

from ..models import LogLevel
from ..config import (
    dentrix_schedule_url,
    google_credentials_path,
    google_sheet_name,
    google_worksheet_name,
    playwright_user_data_dir,
    robot_test_patient_limit,
)
from .run_state import append_log, load, save

# =========================
# CONFIGURACION (env via app.config)
# =========================

SCHEDULE_URL = dentrix_schedule_url()

# Para probar seguro: ROBOT_TEST_PATIENT_LIMIT=3 en entorno
TEST_LIMIT_PATIENTS = robot_test_patient_limit()

# Columnas del Google Sheet
COL_DATE = 1          # A
COL_PATIENT = 3       # C
COL_KIND_INS = 4      # D
COL_STATUS = 5        # E
COL_AGE_TYPE = 6      # F
# G = NO TOCAR
# H = NO TOCAR
COL_INSURANCE = 9     # I
COL_NOTES = 10        # J

# El robot NO escribe G ni H por seguridad.

PPO_KEYWORDS = [
    "bcbs", "bcbsil", "bcbs fep", "blue cross", "blue shield",
    "aetna", "cigna", "metlife", "guardian", "anthem",
    "ameritas", "principal", "united", "uhc",
    "delta", "humana", "sunlife", "geha", "teamcare",
    "concordia", "mutual", "careington", "unum", "ushealth",
    "ddwa", "ddoh", "ddva", "ddil", "ddga",
    "ddnj", "ddpa", "ddnc", "ddwi", "ddar", "ddca",
    "ddtoolkit", "allied", "principal", "ddma", "umr","metlife",
    "delta dental",
    "humana",
    "guardian",
    "aetna",
    "amerihealth",
    "unitedhealthcare",
    "uhc",
    "ameritas",
    "principal",
    "cigna",
    "blue cross",
    "blue shield",
    "bcbs",
    "anthem",
    "equitable",
    "geha",
    "sun life",
    "sunlife",
    "renaissance",
    "lincoln financial",
    "united concordia",
    "connection dental",
    "careington",
    "beam dental",
    "dentemax",
    "assurant",
    "unum",
    "reliance standard",
    "standard insurance",
    "teamcare",
    "ushealth",
    "mutual of omaha",
    "individual ppo"
]

MEDICAID_KEYWORDS = [
    "medicaid", "dentaquest", "denta quest", "state", "chip", "avesis",    "medicaid",
    "meridian",
    "molina",
    "dentaquest",
    "avesis",
    "envolve",
    "illinicare",
    "liberty dental",
    "mcna",
    "skygen",
    "scion",
    "countycare",
    "anthem medicaid",
    "state plan",
]

NON_PPO_KEYWORDS = [
    "medicare", "ddmo", "dmo", "hmo"
]

INSURANCE_NORMALIZATION = {
    "blue cross": "BCBSIL",
    "blue shield": "BCBSIL",
    "bcbsil": "BCBSIL",
    "bcbs fep": "BCBS FEP",
    "bcbs": "BCBSIL",
    "aetna": "AETNA",
    "metlife": "METLIFE",
    "guardian": "GUARDIAN",
    "anthem": "ANTHEM",
    "ameritas": "AMERITAS",
    "principal": "PRINCIPAL",
    "united healthcare": "UHC",
    "unitedhealthcare": "UHC",
    "united": "UHC",
    "uhc": "UHC",
    "delta dental of illinois": "DDIL",
    "delta dental of georgia": "DDGA",
    "delta dental of north carolina": "DDNC",
    "delta dental of new jersey": "DDNJ",
    "delta dental of wisconsin": "DDWI",
    "delta dental of washington": "DDWA",
    "delta dental of arizona": "DDAR",
    "delta": "DDTOOLKIT",
    "humana medicare": "HUMANA MEDICARE",
    "humana": "HUMANA",
    "sunlife": "SUNLIFE",
    "sun life": "SUNLIFE",
    "geha": "GEHA",
    "teamcare": "TEAMCARE",
    "concordia": "CONCORDIA",
    "careington": "CAREINGTON",
    "ushealth": "USHEALTH",
    "unum": "UNUM",
    "ddtoolkit": "DDTOOLKIT",
    "ddil": "DDIL",
    "ddga": "DDGA",
    "ddpa": "DDPA",
    "ddnc": "DDNC",
    "ddnj": "DDNJ",
    "ddca": "DDCA",
    "ddwa": "DDWA",
    "ddwi": "DDWI",
    "ddar": "DDAR",
    "ddmo": "DDMO",
    "umr": "UMR",
    "bcbs other": "BCBS OTHER",
    "local": "LOCAL",
    "denta quest": "DENTAQUEST",
"dentaquest": "DENTAQUEST",
"meridian": "MERIDIAN",
"molina": "MOLINA",
"avesis": "AVESIS",
"countycare": "COUNTYCARE",
"liberty dental": "LIBERTY DENTAL","delta dental of michigan": "DDMI",
"ford motor": "DDMI",
"denta quest": "DENTAQUEST",
"dentaquest": "DENTAQUEST",
"meridian": "MERIDIAN","delta dental of michigan": "DDMI",
"ford motor company": "DDMI",
    
    
    
}


# =========================
# HELPERS
# =========================

def clean_text(value):
    if not value:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def clean_name(value):
    return clean_text(value).replace("\n", " ").strip()


def extract_time_from_card_text(text):
    if not text:
        return ""
    match = re.search(r"\b\d{1,2}:\d{2}\s?(AM|PM)\b", text, re.IGNORECASE)
    return match.group(0).upper().replace(" ", "") if match else ""


def classify_kind_of_ins(insurance_text):
    text = (insurance_text or "").lower()

    medicaid_words = [
        "medicaid", "meridian", "molina", "dentaquest", "denta quest",
        "avesis", "envolve", "illinicare", "liberty dental", "mcna",
        "skygen", "scion", "countycare", "anthem medicaid", "state plan"
    ]

    ppo_words = [
        "metlife", "delta dental", "humana", "guardian", "aetna",
        "amerihealth", "unitedhealthcare", "uhc", "ameritas",
        "principal", "cigna", "blue cross", "blue shield", "bcbs",
        "anthem", "equitable", "geha", "sun life", "sunlife",
        "renaissance", "lincoln financial", "united concordia",
        "connection dental", "careington", "beam dental", "dentemax",
        "assurant", "unum", "reliance standard", "standard insurance",
        "teamcare", "ushealth", "mutual of omaha", "individual ppo",
        "umr"
    ]

    if any(word in text for word in medicaid_words):
        return "Medicaid"

    if any(word in text for word in ppo_words):
        return "PPO"

    return "No info"


def normalize_insurance_name(value):
    text = (value or "").lower()

    # Primero los nombres largos
    for key in sorted(INSURANCE_NORMALIZATION.keys(), key=len, reverse=True):
        if key in text:
            return INSURANCE_NORMALIZATION[key]

    return clean_text(value).upper() if value else ""


def age_type_from_dob(dob_text):
    """
    Devuelve CHILD / TEENAGER / Adult.
    Si no puede calcular, devuelve vacío.
    """
    if not dob_text:
        return ""

    # Busca fecha MM/DD/YYYY
    m = re.search(r"(\d{1,2}/\d{1,2}/\d{4})", dob_text)
    if not m:
        return ""

    try:
        dob = datetime.strptime(m.group(1), "%m/%d/%Y").date()
        today = datetime.today().date()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        if age <= 12:
            return "CHILD"
        if age <= 17:
            return "TEENAGER"
        return "Adult"
    except Exception:
        return ""


def extract_patient_id_from_url(url):
    # Ejemplo: /patient/document/19000011174867
    m = re.search(r"/patient/(?:document|overview|information|insurance)/(\d+)", url)
    if m:
        return m.group(1)

    # Fallback: ultimo numero largo en URL
    m = re.search(r"(\d{10,})", url)
    return m.group(1) if m else ""


def extract_subscriber_id(text):
    """
    Intenta sacar subscriber/member ID de un texto.
    Si no encuentra etiqueta, devuelve vacío.
    """
    if not text:
        return ""

    patterns = [
        r"subscriber\s*id[:\s#-]*([A-Z0-9.\-]+)",
        r"subscriber\s*#[:\s#-]*([A-Z0-9.\-]+)",
        r"member\s*id[:\s#-]*([A-Z0-9.\-]+)",
        r"member\s*#[:\s#-]*([A-Z0-9.\-]+)",
        r"policy\s*id[:\s#-]*([A-Z0-9.\-]+)",
        r"id[:\s#-]*([A-Z0-9.\-]{5,})",
    ]

    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return clean_text(m.group(1))

    return ""


def google_connect():
   
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
   
    creds = Credentials.from_service_account_file(
        str(google_credentials_path()),
        scopes=scopes,
    )
    client = gspread.authorize(creds)
    return client.open(google_sheet_name()).worksheet(google_worksheet_name())


def close_popups(page):
    try:
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
    except Exception:
        pass

    selectors = [
        "button:has-text('Done')",
        "button:has-text('Close')",
        "button:has-text('Cancel')",
        "[aria-label='Close']",
        "[title='Close']",
        ".close",
        ".ui-dialog-titlebar-close",
    ]

    for sel in selectors:
        try:
            loc = page.locator(sel)
            if loc.count() > 0 and loc.first.is_visible():
                loc.first.click(timeout=800)
                page.wait_for_timeout(300)
        except Exception:
            pass


# =========================
# GOOGLE SHEET WRITE
# =========================

def get_all_sheet_rows(ws):
    return ws.get_all_values()

def find_existing_row(ws, patient):
    rows = get_all_sheet_rows(ws)

    name = clean_name(patient.get("name", "")).lower()
    date = clean_text(patient.get("date", ""))

    for idx, row in enumerate(rows, start=1):
        sheet_date = row[COL_DATE - 1] if len(row) >= COL_DATE else ""
        sheet_name = row[COL_PATIENT - 1] if len(row) >= COL_PATIENT else ""

        if clean_text(sheet_date) == date and clean_name(sheet_name).lower() == name:
            return idx

    return None


def find_day_block(ws, clinic_date):
    target_date = datetime.strptime(clinic_date, "%Y-%m-%d")
    target_day = str(target_date.day)
    target_full = clinic_date

    col_a = ws.get(
        "A:A",
        value_render_option="FORMATTED_VALUE"
    )

    for idx, row in enumerate(col_a, start=1):
        value = row[0] if row else ""
        cleaned = clean_text(str(value)).replace(".0", "")

        if cleaned == target_day:
            return idx

        if cleaned == target_full:
            return idx

    return None


def find_next_empty_row_in_day_block(ws, clinic_date):
    day_row = find_day_block(ws, clinic_date)

    if not day_row:
        raise Exception(f"No encontre el bloque del dia {clinic_date} en columna A.")

    all_values = ws.get_all_values()
    total_rows = len(all_values)

    next_day_row = None

    for r in range(day_row + 1, total_rows + 1):
        row = all_values[r - 1]
        value_a = row[COL_DATE - 1] if len(row) >= COL_DATE else ""
        cleaned = clean_text(str(value_a)).replace(".0", "")

        # Detecta solo bloques de día: 1 al 31
        if cleaned.isdigit():
            num = int(cleaned)
            if 1 <= num <= 31:
                next_day_row = r
                break

    if next_day_row is None:
        next_day_row = total_rows + 1

    for r in range(day_row + 1, next_day_row):
        row = all_values[r - 1] if r - 1 < total_rows else []
        patient_value = row[COL_PATIENT - 1] if len(row) >= COL_PATIENT else ""

        if not clean_text(patient_value):
            return r

    # Si no hay espacio, insertar fila antes del próximo día
    ws.insert_row([""], index=next_day_row)

    return next_day_row


def write_patient_to_sheet(ws, patient):
    """
    Escribe SOLO:
    A Date
    C Patient
    D PPO / Medicaid / No info
    E New / DONE B
    F CHILD / TEENAGER / Adult
    I Insurance
    J Notes

    NO TOCA G NI H.
    """
    row_num = find_existing_row(ws, patient)

    if row_num:
        action = "UPDATE"
    else:
        row_num = find_next_empty_row_in_day_block(ws, patient.get("date", ""))
        action = "NEW"

    updates = [
        {"range": f"A{row_num}", "values": [[patient.get("date", "")]]},
        {"range": f"C{row_num}", "values": [[patient.get("name", "")]]},
        {"range": f"D{row_num}", "values": [[patient.get("kind_of_ins", "")]]},
        {"range": f"E{row_num}", "values": [[patient.get("status", "")]]},
        {"range": f"F{row_num}", "values": [[patient.get("age_type", "")]]},
        {"range": f"I{row_num}", "values": [[patient.get("insurance", "")]]},
        {"range": f"J{row_num}", "values": [[patient.get("notes", "")]]},
    ]

    ws.batch_update(updates)
    print(f"{action} sheet row {row_num}: {patient.get('name')} | {patient.get('status')}")


# =========================
# DENTRIX SCRAPER
# =========================

def wait_schedule_visible(page):
    try:
        page.wait_for_selector('[name="displayFullNameWrapper"]', timeout=25000)
        page.wait_for_timeout(1500)
        return True
    except PlaywrightTimeoutError:
        return False


def collect_appointments(page):
    appointments = []
    seen = set()

    wrappers = page.locator('[name="displayFullNameWrapper"]:visible')    
    count = min(wrappers.count(), 40)

    print(f"\nCitas visibles encontradas: {count}\n")

    for i in range(count):
        try:
            wrapper = wrappers.nth(i)
            patient_name = clean_name(wrapper.locator(".displayFullName").inner_text(timeout=3000))

            if not patient_name:
                continue

            # Intenta leer el texto de la tarjeta completa
            try:
                card = wrapper.locator("xpath=ancestor::div[contains(@class, 'appointment')][1]")
                card_text = clean_text(card.inner_text(timeout=2000)) if card.count() > 0 else clean_text(wrapper.inner_text(timeout=2000))
            except Exception:
                card_text = clean_text(wrapper.inner_text(timeout=2000))

            appt_time = extract_time_from_card_text(card_text)
            key = (patient_name.lower(), appt_time)

            if key in seen:
                continue

            seen.add(key)

            appointments.append({
                "index": i,
                "patient_name": patient_name,
                "appointment_time": appt_time,
            })

        except Exception as e:
            print("Error leyendo cita:", e)

    return appointments


def open_patient_by_index(page, index):
    try:
        wrappers = page.locator('[name="displayFullNameWrapper"]:visible')
        target = wrappers.nth(index)

        patient_name = clean_name(target.inner_text(timeout=3000))

        target.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        target.click(timeout=7000, force=True)

        # Esperar que el header de paciente arriba cambie
        page.wait_for_timeout(3500)

        try:
            page.wait_for_selector("[data-name='chartNumber']", timeout=8000)
        except:
            pass

        print("Paciente abierto:", patient_name)
        return True

    except Exception as e:
        print("No pude abrir paciente por index:", index, e)
        return False

def read_patient_header(page):
    data = {
        "name": "",
        "chart_number": "",
        "dob": "",
        "patient_id": "",
    }

    # PID desde URL
    data["patient_id"] = extract_patient_id_from_url(page.url)

    # Nombre
    name_selectors = [
        ".patientName",
        "[data-name='displayName']",
        "ul#constant .patientName",
        "a.patient-name",
    ]

    for sel in name_selectors:
        try:
            loc = page.locator(sel)
            if loc.count() > 0:
                txt = clean_name(loc.first.inner_text(timeout=2500))
                if txt:
                    data["name"] = txt
                    break
        except Exception:
            pass

    # Chart
    chart_selectors = [
        "[data-name='chartNumber']",
        "li.chartNumber [data-name='chartNumber']",
    ]

    for sel in chart_selectors:
        try:
            loc = page.locator(sel)
            if loc.count() > 0:
                txt = clean_text(loc.first.inner_text(timeout=2500))
                if txt:
                    data["chart_number"] = txt
                    break
        except Exception:
            pass

    # DOB / Edad
    dob_selectors = [
        "[data-name='dateOfBirth']",
        "li [data-name='dateOfBirth']",
    ]

    for sel in dob_selectors:
        try:
            loc = page.locator(sel)
            if loc.count() > 0:
                txt = clean_text(loc.first.inner_text(timeout=2500))
                if txt:
                    data["dob"] = txt
                    break
        except Exception:
            pass

    # Fallback desde body para DOB
    if not data["dob"]:
        try:
            body = page.locator("body").inner_text(timeout=3000)
            m = re.search(r"\b\d{1,2}/\d{1,2}/\d{4}\b", body)
            if m:
                data["dob"] = m.group(0)
        except Exception:
            pass

    return data


def open_insurance_popup(page):
    selectors = [
        "a.patientInsuranceInfo",
        "text=/Insurance/i",
        "[title*='Insurance']",
        "[aria-label*='Insurance']",
    ]

    for sel in selectors:
        try:
            loc = page.locator(sel)
            if loc.count() > 0 and loc.first.is_visible():
                loc.first.click(timeout=4000)
                page.wait_for_timeout(1800)
                return True
        except Exception:
            pass

    return False


#read insuranece tiene problemas aqui 
def read_insurance_info(page):
    data = {
        "insurance": "",
        "subscriber_id": "",
        "subscriber_dob": "",
        "raw_text": "",
        "plans": [],
    }

    try:
        close_popups(page)

        shield_selectors = [
            ".patientInsuranceInfo",
            "a.patientInsuranceInfo",
            "i.patientInsuranceInfo",
            "[data-original-title*='Insurance']",
            "[title*='Insurance']",
        ]

        clicked = False

        for sel in shield_selectors:
            try:
                loc = page.locator(sel)

                if loc.count() > 0 and loc.first.is_visible():
                    loc.first.click(timeout=5000, force=True)
                    clicked = True
                    break
            except:
                pass

        if not clicked:
            print("No encontré escudito verde.")
            return data

        page.wait_for_timeout(2000)

        plans_text = []
        insurance_rows = []

        rows = page.locator("table tr")
        count = rows.count()

        for i in range(count):
            try:
                txt = clean_text(rows.nth(i).inner_text(timeout=3000))
                lower = txt.lower()

                if "primary" in lower or "secondary" in lower:
                    plan_type = "PRIMARY" if "primary" in lower else "SECONDARY"
                    insurance_name = normalize_insurance_name(txt)

                    plans_text.append(txt)

                    insurance_rows.append({
                        "row_text": txt,
                        "type": plan_type,
                        "insurance": insurance_name,
                    })

            except:
                pass

        full_text = "\n".join(plans_text)

        data["raw_text"] = full_text
        data["plans"] = insurance_rows

        if insurance_rows:
            data["insurance"] = insurance_rows[0]["insurance"]

        dob_match = re.search(r"\b\d{1,2}/\d{1,2}/\d{4}\b", full_text)
        if dob_match:
            data["subscriber_dob"] = dob_match.group(0)

        sub_match = re.search(r"\b\d{6,12}\b", full_text)
        if sub_match:
            data["subscriber_id"] = sub_match.group(0)

        print("========== INSURANCE TABLE ==========")
        print(full_text)
        print("=====================================")
        print("INSURANCE FOUND:", data["insurance"])
        print("PLANS FOUND:", insurance_rows)

        close_popups(page)
        return data

    except Exception as e:
        print("NO PUDE LEER INSURANCE:", e)
        close_popups(page)
        return data
#aqui termia read insuranece tiene problemas aqui 

def go_to_document_manager(page, patient_id):
    if patient_id:
        page.goto(f"https://live19.dentrixascend.com/pm#/patient/document/{patient_id}")
        page.wait_for_timeout(3000)
        return True

    # fallback: click icono documentos
    selectors = [
        "[title*='Document']",
        "[aria-label*='Document']",
        "a[href*='document']",
    ]

    for sel in selectors:
        try:
            loc = page.locator(sel)
            if loc.count() > 0 and loc.first.is_visible():
                loc.first.click(timeout=4000)
                page.wait_for_timeout(2500)
                return True
        except Exception:
            pass

    return False

#este esta fallando tambien 
def check_ivf_2026(page):
    try:
        page.wait_for_timeout(2000)

        cards = page.locator("div:has-text('Tags:')")
        count = cards.count()

        for i in range(count):
            try:
                card_text = cards.nth(i).inner_text(timeout=2000).lower()

                has_ivf = "ivf" in card_text
                has_2026 = "2026" in card_text
                has_patient_insurance = "patient insurance" in card_text

                if has_ivf and has_2026 and has_patient_insurance:
                    return "DONE B", "IVF 2026 FOUND"
            except:
                pass

        body = page.locator("body").inner_text(timeout=5000).lower()

        if "ivf" in body and "2026" in body and "patient insurance" in body:
            return "DONE B", "IVF 2026 FOUND"

        return "New", "NO IVF 2026"

    except Exception as e:
        print("Error revisando IVF:", e)
        return "New", "NO IVF 2026"




# funcion read_one_patient

def read_one_patient(page, appt, clinic_date):
    print(f"Abriendo: {appt['patient_name']}")

    opened = open_patient_by_index(page, appt["index"])
    if not opened:
        return None

    page.wait_for_timeout(1200)

    header = read_patient_header(page)
    insurance = read_insurance_info(page)

    # Siempre usar el nombre de la agenda para no mezclar pacientes
    header["name"] = appt["patient_name"]

    # Recalcular PID por si cambió URL
    if not header["patient_id"]:
        header["patient_id"] = extract_patient_id_from_url(page.url)

    plans = insurance.get("plans", [])

    if plans:
        insurance_name = plans[0]["insurance"]
    else:
        insurance_name = insurance.get("insurance", "")

    kind_of_ins = classify_kind_of_ins(
        insurance.get("raw_text", "") + " " + insurance_name
    )

    # SKIP MEDICAID ANTES DE DOCUMENTOS
    if kind_of_ins == "Medicaid":
        print("SKIP MEDICAID:", header["name"], insurance_name)
        return None

    # Entrar a documentos y revisar IVF SOLO SI NO ES MEDICAID
    doc_opened = go_to_document_manager(page, header["patient_id"])
    if doc_opened:
        status, ivf_note = check_ivf_2026(page)
    else:
        status, ivf_note = "New", "NO IVF 2026"

    age_type = age_type_from_dob(header.get("dob", ""))

    notes_lines = [
        f"CHART: {header.get('chart_number', '')}",
        f"PID: {header.get('patient_id', '')}",
        f"SUB ID: {insurance.get('subscriber_id', '')}",
        f"DOB: {header.get('dob', '')}",
        ivf_note,
    ]

    patient = {
        "date": clinic_date,
        "name": header["name"],
        "chart_number": header.get("chart_number", ""),
        "patient_id": header.get("patient_id", ""),
        "appointment_time": appt.get("appointment_time", ""),
        "kind_of_ins": kind_of_ins,
        "status": status,
        "age_type": age_type,
        "insurance": insurance_name,
        "subscriber_id": insurance.get("subscriber_id", ""),
        "notes": "\n".join(notes_lines),
    }

    return patient


def click_next_day(page):
    close_popups(page)

    selectors = [
        "button[title='Next']",
        "button[aria-label='Next']",
        "[title='Next']",
        "[aria-label='Next']",
        "button:has-text('›')",
        "button:has-text('>')",
        ".k-nav-next",
        ".calendar-next",
    ]

    for sel in selectors:
        try:
            loc = page.locator(sel)
            if loc.count() > 0 and loc.first.is_visible():
                loc.first.click(timeout=4000)
                page.wait_for_timeout(3500)
                close_popups(page)
                return True
        except Exception:
            pass

    print("No pude avanzar al siguiente día.")
    return False

# funcion run_visible_day 


def _status_path(status_path: str | Path | None) -> Path | None:
    if not status_path:
        return None
    return Path(status_path)


def _status_log(status_path: str | Path | None, level: LogLevel, message: str) -> None:
    path = _status_path(status_path)
    if path is None:
        return
    data = load(path)
    append_log(data, level, message)
    save(path, data)


def _status_update(status_path: str | Path | None, **fields: object) -> None:
    path = _status_path(status_path)
    if path is None:
        return
    data = load(path)
    data.update(fields)
    save(path, data)


def _wait_for_resume(status_path: str | Path | None) -> None:
    path = _status_path(status_path)
    if path is None:
        input("Presiona ENTER cuando ya veas la agenda correcta...")
        return
    print("Esperando confirmación desde la app (POST /api/robot/runs/.../resume)...")
    while True:
        data = load(path)
        if data.get("resume_requested"):
            return
        time.sleep(1)


def mark_run_failed(status_path: str | Path, exc: BaseException) -> None:
    path = Path(status_path)
    data = load(path) if path.is_file() else {}
    data["status"] = "failed"
    data["message"] = str(exc)
    data["completedAt"] = datetime.now(timezone.utc).isoformat()
    append_log(data, "error", str(exc))
    save(path, data)


def run_visible_day(page, ws, clinic_date, stats=None, status_path=None):
    print("\n==============================")
    print("DIA:", clinic_date)
    print("==============================")
    if status_path:
        _status_log(status_path, "info", f"Processing clinic day {clinic_date}")

    if not wait_schedule_visible(page):
        print("No veo la agenda.")
        if status_path:
            _status_log(status_path, "warn", f"Schedule not visible for {clinic_date}")
        return

    appointments = collect_appointments(page)
    limit = TEST_LIMIT_PATIENTS
    if stats is not None and stats.get("patient_limit") is not None:
        limit = stats["patient_limit"]

    if limit is not None:
        appointments = appointments[:limit]
        print(f"Modo prueba: solo {len(appointments)} pacientes.")

    for pos, appt in enumerate(appointments, start=1):
        print(f"\n{pos}/{len(appointments)}")

        try:

            # =========================
            # SKIP MEDICAID
            # =========================
            appt_text = (
                str(appt.get("raw_text", "")) + " " +
                str(appt.get("name", "")) + " " +
                str(appt.get("patient_name", ""))
            ).lower()

            medicaid_words = [
                "medicaid",
                "dentaquest",
                "denta quest",
                "illinicare",
                "meridian",
                "molina",
                "state",
                "government",
                "public aid",
                "medical card",
                "meridan",
                "envolve",
                "countycare",
                "mcna",
                "liberty dental",
                "skygen",
                "scion"
            ]

            if any(word in appt_text for word in medicaid_words):
                print("SKIP MEDICAID:", appt.get("patient_name"))
                if stats is not None:
                    stats["skipped_medicaid"] = stats.get("skipped_medicaid", 0) + 1
                    if status_path:
                        _status_update(
                            status_path,
                            skippedMedicaid=stats["skipped_medicaid"],
                        )
                continue

            # =========================
            # LEER PACIENTE
            # =========================
            patient = read_one_patient(page, appt, clinic_date)

            if patient:
                write_patient_to_sheet(ws, patient)
                if stats is not None:
                    stats["processed"] = stats.get("processed", 0) + 1
                    if status_path:
                        _status_update(
                            status_path,
                            processed=stats["processed"],
                            message=f"Processed {stats['processed']} patient(s)…",
                        )

            # =========================
            # REGRESAR AL SCHEDULE
            # =========================
            page.goto(SCHEDULE_URL)

            page.wait_for_timeout(2500)

            wait_schedule_visible(page)

        except Exception as e:

            print(
                "Error procesando paciente:",
                appt.get("patient_name"),
                e
            )
            if stats is not None:
                stats["errors"] = stats.get("errors", 0) + 1
                if status_path:
                    _status_update(status_path, errors=stats["errors"])
                    _status_log(
                        status_path,
                        "error",
                        f"Error on patient {appt.get('patient_name', '?')}",
                    )

            try:
                page.goto(SCHEDULE_URL)
                page.wait_for_timeout(2500)

            except Exception:
                pass


def run_sync(start_date_text, days_count, status_path=None, patient_limit=None):
    ws = google_connect()
    print("Conectado a Google Sheet.")
    if status_path:
        _status_log(
            status_path,
            "info",
            f"Connected to sheet {google_sheet_name()} / {google_worksheet_name()}",
        )

    stats = {
        "processed": 0,
        "skipped_medicaid": 0,
        "errors": 0,
        "patient_limit": patient_limit,
    }

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            str(playwright_user_data_dir()),
            headless=False,
            slow_mo=100,
        )

        page = context.pages[0] if context.pages else context.new_page()
        page.goto(SCHEDULE_URL)
        page.wait_for_timeout(3000)

        print("\nHaz login si es necesario.")
        print("Pon Dentrix en el PRIMER DIA que quieres revisar.")
        if status_path:
            _status_update(
                status_path,
                status="awaiting_login",
                message="Waiting for operator to confirm Dentrix is ready.",
            )
        _wait_for_resume(status_path)

        if status_path:
            _status_update(
                status_path,
                status="running",
                message="Processing schedule…",
                processed=0,
                skippedMedicaid=0,
                errors=0,
            )
            _status_log(status_path, "info", f"Run started for {start_date_text}, {days_count} day(s).")

        start_date = datetime.strptime(start_date_text, "%Y-%m-%d").date()

        for day_number in range(days_count):
            clinic_date = str(start_date + timedelta(days=day_number))
            run_visible_day(page, ws, clinic_date, stats=stats, status_path=status_path)

            if day_number < days_count - 1:
                ok = click_next_day(page)
                if not ok:
                    print("No pude avanzar. Paro aquí.")
                    if status_path:
                        _status_log(status_path, "warn", "Could not advance to next day.")
                    break

        print("\nLISTO.")
        if status_path:
            _status_update(
                status_path,
                status="completed",
                message="Sync finished. Refresh the IVF dashboard to review rows.",
                processed=stats["processed"],
                skippedMedicaid=stats["skipped_medicaid"],
                errors=stats["errors"],
                completedAt=datetime.now(timezone.utc).isoformat(),
            )
            _status_log(status_path, "info", "Run completed successfully.")
        else:
            input("ENTER para cerrar...")
        context.close()
