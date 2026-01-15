from pydantic import BaseModel, Field
from datetime import datetime


class AdmissionEnquiryBase(BaseModel):
    parent_name: str = Field(..., min_length=2)
    child_name: str = Field(..., min_length=2)
    seeking_class: str = Field(..., min_length=1)
    contact_number: str = Field(
        ...,
        pattern=r"^[6-9]\d{9}$",
        description="Indian 10-digit mobile number",
    )


class AdmissionEnquiryCreate(AdmissionEnquiryBase):
    pass


class AdmissionEnquiryResponse(AdmissionEnquiryBase):
    id: int
    created_at: datetime
    status: str

    model_config = {
        "from_attributes": True
    }
