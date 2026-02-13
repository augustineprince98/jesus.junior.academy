---
description: How to add a new API endpoint to the backend
---

# Add a New API Endpoint

## Architecture Overview

The backend follows a layered architecture:
```
Router (API layer) → Service (business logic) → Model (database) → Schema (validation)
```

## 1. Create / Update the Model

Edit or create a file in `backend/app/models/`:

```python
# backend/app/models/your_model.py
from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base

class YourModel(Base):
    __tablename__ = "your_table"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
```

Register the model in `backend/app/models/__init__.py`.

## 2. Create the Schema

Create `backend/app/schemas/your_schema.py`:

```python
from pydantic import BaseModel

class YourCreate(BaseModel):
    name: str

class YourResponse(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True
```

## 3. Create the Service (optional, for complex logic)

Create `backend/app/services/your_service.py`:

```python
from sqlalchemy.orm import Session
from app.models.your_model import YourModel

class YourService:
    @staticmethod
    def create(db: Session, data):
        obj = YourModel(**data.dict())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
```

## 4. Create the Router

Create `backend/app/routers/your_router.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user

router = APIRouter(prefix="/your-endpoint", tags=["Your Feature"])

@router.get("/")
async def list_items(db: Session = Depends(get_db), user = Depends(get_current_user)):
    ...

@router.post("/")
async def create_item(data: YourCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    ...
```

## 5. Register the Router

Add to `backend/app/routers/__init__.py` and include in `backend/app/main.py`:

```python
from app.routers.your_router import router as your_router
app.include_router(your_router)
```

## 6. Generate and Apply Migration

```bash
cd c:\projects\school-website\backend
alembic revision --autogenerate -m "add your_table"
alembic upgrade head
```

## 7. Test the Endpoint

- Visit `http://localhost:8000/docs` to test via Swagger UI
- Write tests in `backend/tests/test_your_feature.py`
