"""
Database Models using MongoDB with PyMongo
Defines all data structures for the Taxwise application mapped via Pydantic schema validation.
"""
from datetime import datetime
from bson.objectid import ObjectId
from app.schemas.db_schemas import UserDBModel, TransactionDBModel, TaxAnalysisDBModel, FileUploadDBModel

class User:
    """User model"""
    
    @staticmethod
    def create_user_document(email, pan, name, financial_year):
        """Create a new user document"""
        model = UserDBModel(
            _id=ObjectId(),
            email=email,
            pan=pan,
            name=name,
            financial_year=financial_year or "2023-24",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            is_active=True
        )
        return model.model_dump(by_alias=True)

class Transaction:
    """Transaction model for bank statements"""
    
    CATEGORIES = {
        'SALARY': 'Salary & Income',
        'INVESTMENT_80C': 'Investment 80C (Life Insurance, PPF, etc)',
        'INVESTMENT_80D': 'Investment 80D (Medical Insurance)',
        'HRA': 'House Rent Allowance',
        'MEDICAL': 'Medical Expenses',
        'EDUCATION': 'Education & Tuition',
        'DONATE': 'Donation/Charity',
        'INTEREST': 'Interest Income',
        'DIVIDEND': 'Dividend Income',
        'DEDUCTIBLE_EXPENSE': 'Deductible Expenses',
        'NON_DEDUCTIBLE': 'Non-Deductible Expense',
        'OTHER': 'Other'
    }

    @staticmethod
    def create_transaction_document(
        user_id, date, description, amount,
        category='OTHER', transaction_type='DEBIT'
    ):
        """Create a new transaction document"""
        model = TransactionDBModel(
            _id=ObjectId(),
            user_id=user_id,
            date=date,
            description=description,
            amount=amount,
            category=category,
            transaction_type=transaction_type,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return model.model_dump(by_alias=True)

class TaxAnalysis:
    """Tax Analysis model"""
    
    TAX_SECTIONS = {
        '80C': {
            'name': 'Section 80C - Life Insurance, PPF, ELSS',
            'limit': 150000,
            'description': 'Deduction up to Rs. 1,50,000 for specified investments'
        },
        '80D': {
            'name': 'Section 80D - Medical Insurance',
            'limit': 100000,
            'description': 'Deduction for health insurance premiums'
        },
        'HRA': {
            'name': 'House Rent Allowance',
            'limit': None,
            'description': 'Deduction for house rent paid'
        },
        'DONATION': {
            'name': 'Section 80G - Donations',
            'limit': None,
            'description': 'Deduction for donations to eligible organizations'
        }
    }

    @staticmethod
    def create_analysis_document(
        user_id, financial_year, transactions, recommendations
    ):
        """Create a new tax analysis document"""
        model = TaxAnalysisDBModel(
            _id=ObjectId(),
            user_id=user_id,
            financial_year=financial_year,
            transactions_analyzed=len(transactions),
            recommendations=recommendations,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return model.model_dump(by_alias=True)

class FileUpload:
    """File Upload tracking model"""
    
    @staticmethod
    def create_upload_document(user_id, filename, file_path, status='PROCESSING'):
        """Create a new file upload document"""
        model = FileUploadDBModel(
            _id=ObjectId(),
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            status=status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return model.model_dump(by_alias=True)
