"""
File Upload Routes
CSV file upload and processing endpoints
"""
from flask import Blueprint, request, current_app
from app.services.file_upload_service import FileUploadService
from app.utils.response import success_response, error_response
from app.utils.validators import validate_file_upload
from app.utils.errors import ValidationError, FileUploadError, DataProcessingError
from app.utils.logger import setup_logger

bp = Blueprint('uploads', __name__, url_prefix='/api/uploads')
logger = setup_logger(__name__)

@bp.route('', methods=['POST'])
@bp.route('/csv', methods=['POST'])
def upload():
    """Upload and process bank statement file"""
    user_id = request.form.get('user_id')
    if not user_id:
        raise ValidationError('User ID is required')
    
    if 'file' not in request.files:
        raise ValidationError('No file provided')
    
    file = request.files['file']
    filename = validate_file_upload(
        file,
        current_app.config['ALLOWED_EXTENSIONS'],
        current_app.config['MAX_FILE_SIZE']
    )
    
    filepath, saved_filename = FileUploadService.save_uploaded_file(
        file, user_id, current_app.config['UPLOAD_FOLDER']
    )
    
    result = FileUploadService.process_file(user_id, file, filename, filepath)
    
    return success_response(
        message='File uploaded and processed successfully',
        data=result,
        status_code=201
    )

@bp.route('/<upload_id>', methods=['GET'])
def get_upload_status(upload_id):
    """Get upload status and details"""
    upload = FileUploadService.get_upload_status(upload_id)
    return success_response(data=upload)
