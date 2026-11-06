"""
MongoDB Database Connection Layer
Handles all database operations with connection pooling
"""
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from app.utils.errors import DatabaseError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class Database:
    """MongoDB database connection manager"""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls, uri, db_name):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    def __init__(self, uri, db_name):
        if self._client is None:
            try:
                self._client = MongoClient(
                    uri,
                    serverSelectionTimeoutMS=5000,
                    socketTimeoutMS=5000
                )
                # Verify connection
                self._client.admin.command('ping')
                self._db = self._client[db_name]
                logger.info(f"Connected to MongoDB database: {db_name}")
                self._create_indexes()
            except ServerSelectionTimeoutError as e:
                logger.error(f"Failed to connect to MongoDB: {str(e)}")
                raise DatabaseError(f"Database connection failed: {str(e)}")
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Users collection indexes
            self._db.users.create_index([('email', 1)], unique=True)
            self._db.users.create_index([('pan', 1)])
            
            # Transactions collection indexes
            self._db.transactions.create_index([('user_id', 1)])
            self._db.transactions.create_index([('date', 1)])
            self._db.transactions.create_index([('category', 1)])
            
            # Tax Analysis collection indexes
            self._db.tax_analysis.create_index([('user_id', 1)])
            self._db.tax_analysis.create_index([('financial_year', 1)])
            
            # File Uploads collection indexes
            self._db.file_uploads.create_index([('user_id', 1)])
            
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating indexes: {str(e)}")
    
    @property
    def db(self):
        """Get database instance"""
        return self._db
    
    @property
    def client(self):
        """Get MongoDB client"""
        return self._client
    
    def close(self):
        """Close database connection"""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
            logger.info("Database connection closed")
    
    def health_check(self):
        """Check database health"""
        try:
            self._client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False
