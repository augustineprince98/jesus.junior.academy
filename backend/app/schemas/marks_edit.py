from pydantic import BaseModel, Field


class EditRequestCreate(BaseModel):
    student_mark_id: int
    reason: str = Field(max_length=255)


class EditRequestResponse(BaseModel):
    id: int
    student_mark_id: int
    requested_by_id: int
    approved_by_id: int | None
    reason: str
    status: str

    class Config:
        from_attributes = True
