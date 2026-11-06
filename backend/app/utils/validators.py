"""
Input Validators
Validates user input and file uploads
"""
import os
from werkzeug.utils import secure_filename
from .errors import ValidationError, FileUploadError

def validate_file_upload(file, allowed_extensions, max_size):
    """
    Validate uploaded file
    
    Args:
        file: Uploaded file object
        allowed_extensions: Set of allowed file extensions
        max_size: Maximum file size in bytes
    
    Raises:
        FileUploadError: If validation fails
    
    Returns:
        Secure filename
    """
    if not file:
        raise FileUploadError('No file provided')
    
    if file.filename == '':
        raise FileUploadError('No file selected')
    
    # Check file extension
    filename = secure_filename(file.filename)
    if not filename:
        raise FileUploadError('Invalid filename')
    
    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    if file_ext not in allowed_extensions:
        raise FileUploadError(
            f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'
        )
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > max_size:
        raise FileUploadError(
            f'File too large. Maximum size: {max_size / 1024 / 1024}MB'
        )
    
    return filename

def validate_email(email):
    """
    Validate email format
    
    Args:
        email: Email string
    
    Returns:
        Valid email or raises ValidationError
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not email or not re.match(pattern, email):
        raise ValidationError('Invalid email format')
    
    return email

def validate_pan(pan):
    """
    Validate Indian PAN (Permanent Account Number)
    
    Args:
        pan: PAN string
    
    Returns:
        Valid PAN or raises ValidationError
    """
    import re
    # PAN format: AAAAA9999A
    pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
    
    pan_upper = pan.upper() if pan else ''
    if not re.match(pattern, pan_upper):
        raise ValidationError('Invalid PAN format')
    
    return pan_upper

def validate_date_range(start_date, end_date):
    """
    Validate date range
    
    Args:
        start_date: Start date (datetime object or string)
        end_date: End date (datetime object or string)
    
    Raises:
        ValidationError: If dates are invalid
    """
    from datetime import datetime
    
    if start_date > end_date:
        raise ValidationError('Start date must be before end date')
    
    return True

def validate_financial_amount(amount):
    """
    Validate financial amount
    
    Args:
        amount: Amount as float or string
    
    Returns:
        Valid amount as float
    """
    try:
        amount_float = float(amount)
        if amount_float < 0:
            raise ValidationError('Amount cannot be negative')
        return amount_float
    except (ValueError, TypeError):
        raise ValidationError('Invalid amount format')
