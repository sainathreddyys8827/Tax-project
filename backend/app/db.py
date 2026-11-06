"""
Database connection management
Provides init_app to initialize MongoDB connection using `app.config`.
This module creates a Database instance (from app.models.database) and sets
Database._instance so existing code that references Database._instance continues
to work.
"""
from typing import Optional
from app.models.database import Database
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Module-level reference to Database instance
_database_instance: Optional[Database] = None

def init_app(app):
    """Initialize database connection using Flask app config

    Expects app.config to have 'MONGODB_URI' and 'DB_NAME'.
    """
    global _database_instance
    if _database_instance is not None:
        logger.info('Database already initialized')
        return _database_instance

    uri = app.config.get('MONGODB_URI')
    db_name = app.config.get('DB_NAME')

    if not uri or not db_name:
        logger.error('MONGODB_URI or DB_NAME missing in app config')
        raise RuntimeError('Database configuration missing')

    try:
        _database_instance = Database(uri, db_name)
        # Keep backward compatibility: set the class-level singleton
        Database._instance = _database_instance
        logger.info('Database initialized via app/db.py')
        # Save to app.extensions for reference
        if not hasattr(app, 'extensions'):
            app.extensions = {}
        app.extensions['database'] = _database_instance
        return _database_instance
    except Exception as e:
        logger.error(f'Failed to initialize database: {e}')
        raise

def get_database():
    """Return the Database instance (or raise if not initialized)"""
    if _database_instance is None:
        raise RuntimeError('Database not initialized. Call init_app(app) first.')
    return _database_instance

def close_database():
    """Close the database connection if initialized"""
    global _database_instance
    if _database_instance is not None:
        try:
            _database_instance.close()
            logger.info('Database connection closed via app/db.py')
        finally:
            _database_instance = None
