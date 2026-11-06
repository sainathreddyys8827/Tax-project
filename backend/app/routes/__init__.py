"""Routes module"""
from .health_routes import bp as health_bp
from .user_routes import bp as user_bp
from .upload_routes import bp as upload_bp
from .tax_routes import bp as tax_bp
from .recommendations_routes import bp as recommendations_bp
from .transaction_routes import bp as transaction_bp
from .admin_routes import bp as admin_bp

from .chat_routes import bp as chat_bp

__all__ = [
    'health_bp',
    'user_bp',
    'upload_bp',
    'tax_bp',
    'recommendations_bp',
    'transaction_bp',
    'admin_bp',
    'chat_bp'
]
