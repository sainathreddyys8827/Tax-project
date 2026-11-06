"""Utilities module"""
from .logger import setup_logger
from .errors import (
    TaxwiseError,
    ValidationError,
    FileUploadError,
    DataProcessingError,
    TaxCalculationError,
    DatabaseError,
    OpenAIError,
    NotFoundError
)
from .validators import (
    validate_file_upload,
    validate_email,
    validate_pan,
    validate_date_range,
    validate_financial_amount
)

__all__ = [
    'setup_logger',
    'TaxwiseError',
    'ValidationError',
    'FileUploadError',
    'DataProcessingError',
    'TaxCalculationError',
    'DatabaseError',
    'OpenAIError',
    'NotFoundError',
    'validate_file_upload',
    'validate_email',
    'validate_pan',
    'validate_date_range',
    'validate_financial_amount'
]
