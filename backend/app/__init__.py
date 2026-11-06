"""
Main Flask Application Factory
Creates and configures the Flask application
"""
from flask import Flask
from flask_cors import CORS
from app.config import get_config
from app.models.database import Database
from app.db import init_app as init_db, close_database
from app.utils.logger import setup_logger
from app.error_handlers import register_error_handlers
from app.routes import (
    health_bp,
    user_bp,
    upload_bp,
    tax_bp,
    recommendations_bp,
    transaction_bp,
    admin_bp,
    chat_bp
)

logger = setup_logger(__name__)

def create_app(config_env=None):
    """
    Create and configure Flask application
    
    Args:
        config_env: Configuration environment (development, production, testing)
    
    Returns:
        Configured Flask application instance
    """
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    config = get_config(config_env)
    app.config.from_object(config)
    
    # Initialize database using centralized app/db.py
    try:
        init_db(app)
        logger.info("Database initialized successfully via app/db")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise
    
    # Enable CORS - allow all origins for local development
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    logger.info("CORS enabled for all origins")
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(tax_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(chat_bp)
    
    logger.info("All route blueprints registered")
    
    # Database connection should be persistent, do not tear it down after every single request.
    
    logger.info("Flask application created successfully")
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
