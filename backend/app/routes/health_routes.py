"""
Health Check Routes
Server health and status endpoints
"""
from flask import Blueprint, jsonify
from app.models.database import Database
from app.utils.logger import setup_logger

bp = Blueprint('health', __name__, url_prefix='/api/health')
logger = setup_logger(__name__)

@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
def health_check():
    """
    Health check endpoint
    
    Returns:
        JSON with server and database status
    """
    try:
        db = Database._instance
        db_status = db.health_check() if db else False
        
        return jsonify({
            'status': 'healthy',
            'service': 'Taxwise AI Backend',
            'database': 'connected' if db_status else 'disconnected',
            'version': '1.0.0'
        }), 200
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@bp.route('/ready', methods=['GET'])
def readiness_check():
    """
    Readiness probe for container orchestration
    
    Returns:
        JSON indicating if service is ready to handle requests
    """
    try:
        db = Database._instance
        if not db or not db.health_check():
            return jsonify({'ready': False, 'reason': 'Database not connected'}), 503
        
        return jsonify({'ready': True}), 200
    
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return jsonify({'ready': False, 'reason': str(e)}), 503
