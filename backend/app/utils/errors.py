"""
Custom Exception Classes
Defines application-specific exceptions for better error handling
"""

class TaxwiseError(Exception):
    """Base exception for Taxwise application"""
    def __init__(self, message, status_code=500, error_code=None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or 'INTERNAL_ERROR'
        super().__init__(self.message)

class ValidationError(TaxwiseError):
    """Raised when input validation fails"""
    def __init__(self, message, error_code='VALIDATION_ERROR'):
        super().__init__(message, status_code=400, error_code=error_code)

class FileUploadError(TaxwiseError):
    """Raised when file upload fails"""
    def __init__(self, message, error_code='FILE_UPLOAD_ERROR'):
        super().__init__(message, status_code=400, error_code=error_code)

class DataProcessingError(TaxwiseError):
    """Raised when data processing fails"""
    def __init__(self, message, error_code='DATA_PROCESSING_ERROR'):
        super().__init__(message, status_code=422, error_code=error_code)

class TaxCalculationError(TaxwiseError):
    """Raised when tax calculation fails"""
    def __init__(self, message, error_code='TAX_CALCULATION_ERROR'):
        super().__init__(message, status_code=422, error_code=error_code)

class DatabaseError(TaxwiseError):
    """Raised when database operations fail"""
    def __init__(self, message, error_code='DATABASE_ERROR'):
        super().__init__(message, status_code=500, error_code=error_code)

class OpenAIError(TaxwiseError):
    """Raised when OpenAI API fails"""
    def __init__(self, message, error_code='OPENAI_ERROR'):
        super().__init__(message, status_code=502, error_code=error_code)

class NotFoundError(TaxwiseError):
    """Raised when resource not found"""
    def __init__(self, message, error_code='NOT_FOUND'):
        super().__init__(message, status_code=404, error_code=error_code)
