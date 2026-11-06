"""
Error Handler Middleware
Global error handling for the Flask application
"""
from app.utils.errors import TaxwiseError
from app.utils.logger import setup_logger
from app.utils.response import error_response
from pydantic import ValidationError as PydanticValidationError

logger = setup_logger(__name__)

def register_error_handlers(app):
    """
    Register error handlers with Flask app
    
    Args:
        app: Flask application instance
    """
    
    @app.errorhandler(TaxwiseError)
    def handle_taxwise_error(error):
        """Handle custom application errors"""
        logger.warning(f"Application error: {error.error_code} - {error.message}")
        return error_response(error_message=error.message, status_code=error.status_code, error_code=error.error_code)

    @app.errorhandler(PydanticValidationError)
    def handle_pydantic_validation_error(error):
        """Handle Pydantic validation errors"""
        logger.warning(f"Validation error: {str(error)}")
        return error_response(error_message="Data validation failed", status_code=400, error_code="VALIDATION_ERROR", details=error.errors())
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 errors"""
        return error_response(error_message='Resource not found', status_code=404, error_code="NOT_FOUND")
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 errors"""
        return error_response(error_message='Method not allowed', status_code=405, error_code="METHOD_NOT_ALLOWED")
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 errors"""
        logger.error(f"Internal server error: {str(error)}")
        return error_response(error_message='Internal server error', status_code=500)
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle unexpected errors"""
        logger.error(f"Unexpected error: {str(error)}")
        return error_response(
            error_message="An unexpected error occurred",
            status_code=500,
            message=str(error) if app.debug else 'Internal server error'
        )
