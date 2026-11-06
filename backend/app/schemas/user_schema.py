"""Pydantic schemas for user input validation"""
from pydantic import BaseModel, EmailStr, constr
from typing import Optional


class CreateUserSchema(BaseModel):
    email: EmailStr
    pan: constr(min_length=10, max_length=10)
    name: constr(min_length=1)
    financial_year: Optional[str] = None


class UpdateUserSchema(BaseModel):
    email: Optional[EmailStr] = None
    pan: Optional[constr(min_length=10, max_length=10)] = None
    name: Optional[constr(min_length=1)] = None
    financial_year: Optional[str] = None
