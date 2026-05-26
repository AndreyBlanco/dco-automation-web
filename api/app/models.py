from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

InsuranceStatus = Literal["verified", "pending", "denied"]
VerificationSource = Literal["manual", "excel", "portal", "simulated"]
VerificationStepId = Literal["excel_lookup", "portal_scrape", "excel_write", "complete"]
VerificationStepStatus = Literal["pending", "running", "ok", "skipped", "error"]
JobStatus = Literal["completed", "failed"]


class VerifyInsuranceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    patient_id: str = Field(alias="patientId")
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    dob: str
    insurance_carrier: str = Field(alias="insuranceCarrier")
    insurance_plan: str = Field(alias="insurancePlan")
    group_number: str = Field(alias="groupNumber")
    member_id: str = Field(alias="memberId")


class VerificationStepLog(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    step: VerificationStepId
    status: VerificationStepStatus
    message: str
    duration_ms: int | None = Field(default=None, serialization_alias="durationMs")


class VerifyInsuranceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    job_id: str = Field(serialization_alias="jobId")
    status: JobStatus
    insurance_status: InsuranceStatus = Field(serialization_alias="insuranceStatus")
    verification_source: VerificationSource = Field(serialization_alias="verificationSource")
    plan_in_excel_catalog: bool = Field(serialization_alias="planInExcelCatalog")
    catalog_row_added: bool = Field(serialization_alias="catalogRowAdded")
    message: str
    steps: list[VerificationStepLog]
    completed_at: str = Field(serialization_alias="completedAt")


class CatalogLookupResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    found: bool
    carrier: str
    plan_name: str = Field(serialization_alias="planName")
    portal_url: str | None = Field(default=None, serialization_alias="portalUrl")
