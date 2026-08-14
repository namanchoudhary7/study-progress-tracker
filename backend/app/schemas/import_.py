from pydantic import BaseModel


class ImportCsvRequest(BaseModel):
    csv_text: str


class ImportResult(BaseModel):
    rows_processed: int
    subjects_created: int
    topics_created: int
    topics_skipped: int
