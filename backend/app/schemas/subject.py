from pydantic import BaseModel


class SubjectResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
