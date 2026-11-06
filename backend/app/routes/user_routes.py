"""
User Routes
User management endpoints
"""
from flask import Blueprint, request
from app.schemas.user_schema import CreateUserSchema, UpdateUserSchema
from app.services.user_service import UserService
from app.utils import validate_email, validate_pan, ValidationError
from app.utils.logger import setup_logger
from app.utils.response import success_response

bp = Blueprint('users', __name__, url_prefix='/api/users')
logger = setup_logger(__name__)

@bp.route('', methods=['POST'])
def create_user():
    """
    Create a new user
    """
    data = request.get_json() or {}

    # Validate input with Pydantic schema
    validated = CreateUserSchema(**data)
    
    name = validated.name.strip()
    if not name:
        raise ValidationError('Name is required')

    user_doc, user_id = UserService.create_user(
        email=validated.email,
        pan=validated.pan,
        name=name,
        financial_year=validated.financial_year or ''
    )

    logger.info(f"User created: {validated.email}")

    return success_response(
        message='User created successfully',
        data={'user': user_doc, 'user_id': user_id},
        status_code=201
    )

@bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """
    Get user details
    """
    user = UserService.get_user(user_id)
    return success_response(data=user)

@bp.route('/<user_id>', methods=['PUT'])
def update_user(user_id):
    """
    Update user details
    """
    data = request.get_json() or {}

    # Validate with Pydantic
    validated = UpdateUserSchema(**data)

    # Validate email or PAN if provided
    if validated.email:
        validate_email(str(validated.email))
    if validated.pan:
        validate_pan(str(validated.pan))

    # Update user properties
    update_data = {k: v for k, v in validated.dict(exclude_unset=True).items() if k not in ['_id', 'created_at']}
    
    UserService.update_user(user_id, update_data)
    
    logger.info(f"User updated: {user_id}")
    return success_response(message='User updated successfully')
