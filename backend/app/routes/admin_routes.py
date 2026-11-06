from flask import Blueprint, jsonify, request
from bson.objectid import ObjectId
from app.db import get_database
from app.utils.logger import setup_logger

bp = Blueprint('admin', __name__, url_prefix='/api/admin')
logger = setup_logger(__name__)


@bp.route('/uploads', methods=['GET'])
def list_uploads():
    """Return a list of file uploads with optional filtering/pagination."""
    try:
        db = get_database()
        query = {}

        user_id = request.args.get('user_id')
        if user_id:
            try:
                query['user_id'] = ObjectId(user_id)
            except Exception:
                return jsonify({'error': 'Invalid user_id'}), 400

        limit = int(request.args.get('limit', 50))
        skip = int(request.args.get('skip', 0))

        uploads = list(db.db.uploads.find(query).skip(skip).limit(limit))
        for u in uploads:
            u['_id'] = str(u['_id'])
            u['user_id'] = str(u['user_id'])
        total = db.db.uploads.count_documents(query)
        return jsonify({'total': total, 'limit': limit, 'skip': skip, 'uploads': uploads}), 200
    except Exception as e:
        logger.error(f"Error listing uploads: {str(e)}")
        return jsonify({'error': 'Failed to list uploads'}), 500


@bp.route('/analyses', methods=['GET'])
def list_analyses():
    """Return list of tax analysis results or other processed documents."""
    try:
        db = get_database()
        query = {}

        user_id = request.args.get('user_id')
        if user_id:
            try:
                query['user_id'] = ObjectId(user_id)
            except Exception:
                return jsonify({'error': 'Invalid user_id'}), 400

        limit = int(request.args.get('limit', 50))
        skip = int(request.args.get('skip', 0))

        analyses = list(db.db.analyses.find(query).skip(skip).limit(limit))
        for a in analyses:
            a['_id'] = str(a['_id'])
            a['user_id'] = str(a['user_id'])
        total = db.db.analyses.count_documents(query)
        return jsonify({'total': total, 'limit': limit, 'skip': skip, 'analyses': analyses}), 200
    except Exception as e:
        logger.error(f"Error listing analyses: {str(e)}")
        return jsonify({'error': 'Failed to list analyses'}), 500
