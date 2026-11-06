from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, *args):
        from bson import ObjectId
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

class UserDBModel(BaseModel):
    id: Any = Field(alias="_id")
    email: EmailStr
    pan: str
    name: str
    financial_year: str
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class TransactionDBModel(BaseModel):
    id: Any = Field(alias="_id")
    user_id: Any
    date: datetime
    description: str
    amount: float
    category: str = 'OTHER'
    transaction_type: str = 'DEBIT'
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class TaxAnalysisDBModel(BaseModel):
    id: Any = Field(alias="_id")
    user_id: Any
    financial_year: str
    total_income: float = 0.0
    deductible_amount: float = 0.0
    taxable_income: float = 0.0
    estimated_tax: float = 0.0
    section_80c_eligible: float = 0.0
    section_80d_eligible: float = 0.0
    hra_eligible: float = 0.0
    donation_eligible: float = 0.0
    transactions_analyzed: int = 0
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class FileUploadDBModel(BaseModel):
    id: Any = Field(alias="_id")
    user_id: Any
    filename: str
    file_path: str
    status: str = 'PROCESSING'
    error_message: Optional[str] = None
    transactions_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
