from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

IvfStatus = Literal["New", "DONE B"]
KindOfInsurance = Literal["PPO", "Medicaid", "No info"]
AgeType = Literal["CHILD", "TEENAGER", "Adult", ""]
DentrixSyncRunStatus = Literal[
    "pending",
    "awaiting_login",
    "running",
    "completed",
    "failed",
    "cancelled",
]
LogLevel = Literal["info", "warn", "error"]


class SheetRow(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    id: str
    row_index: int | None = Field(default=None, serialization_alias="rowIndex")
    date: str
    patient_name: str = Field(serialization_alias="patientName")
    kind_of_insurance: KindOfInsurance = Field(serialization_alias="kindOfInsurance")
    ivf_status: IvfStatus = Field(serialization_alias="ivfStatus")
    age_type: AgeType = Field(serialization_alias="ageType")
    insurance: str
    notes: str
    appointment_time: str | None = Field(default=None, serialization_alias="appointmentTime")


class SheetRowsMeta(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    date_from: str | None = Field(default=None, serialization_alias="dateFrom")
    date_to: str | None = Field(default=None, serialization_alias="dateTo")
    count: int


class SheetRowsResponse(BaseModel):
    rows: list[SheetRow]
    meta: SheetRowsMeta | None = None


class SheetRowPatch(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    row_index: int = Field(alias="rowIndex")
    ivf_status: IvfStatus | None = Field(default=None, alias="ivfStatus")
    notes: str | None = None


class SheetRowPatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    ok: bool
    row: SheetRow
    message: str | None = None


class DentrixSyncRunRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    start_date: str = Field(alias="startDate")
    days: int = Field(ge=1, le=31)
    patient_limit: int | None = Field(default=None, alias="patientLimit")


class DentrixSyncLogEntry(BaseModel):
    at: str
    level: LogLevel
    message: str


class DentrixSyncRunSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    run_id: str = Field(serialization_alias="runId")
    status: DentrixSyncRunStatus
    start_date: str = Field(serialization_alias="startDate")
    days: int
    started_at: str | None = Field(default=None, serialization_alias="startedAt")
    completed_at: str | None = Field(default=None, serialization_alias="completedAt")
    processed: int | None = None
    skipped_medicaid: int | None = Field(default=None, serialization_alias="skippedMedicaid")
    errors: int | None = None
    message: str | None = None


class DentrixSyncRunDetail(DentrixSyncRunSummary):
    logs: list[DentrixSyncLogEntry] | None = None
