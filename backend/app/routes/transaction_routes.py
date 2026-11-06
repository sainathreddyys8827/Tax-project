"""
Transaction Routes
Transaction data endpoints
"""
from flask import Blueprint, request
from app.services.transaction_service import TransactionService
from app.utils.response import success_response
from app.utils.logger import setup_logger

bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')
logger = setup_logger(__name__)

@bp.route('/user/<user_id>', methods=['GET'])
def get_user_transactions(user_id):
    """Get all transactions for a user"""
    category = request.args.get('category')
    limit = int(request.args.get('limit', 50))
    skip = int(request.args.get('skip', 0))
    sort_field = request.args.get('sort', 'date')
    sort_order = int(request.args.get('order', -1))
    
    result = TransactionService.get_user_transactions(
        user_id=user_id,
        category=category,
        limit=limit,
        skip=skip,
        sort_field=sort_field,
        sort_order=sort_order
    )
    return success_response(data=result)

@bp.route('/user/<user_id>/by-category', methods=['GET'])
def get_transactions_by_category(user_id):
    """Get transactions grouped by category"""
    result = TransactionService.get_transactions_by_category(user_id)
    return success_response(data=result)

@bp.route('/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get a specific transaction"""
    transaction = TransactionService.get_transaction(transaction_id)
    return success_response(data=transaction)

@bp.route('/<transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update transaction category or notes"""
    data = request.get_json() or {}
    category = data.get('category')
    notes = data.get('notes')
    
    TransactionService.update_transaction(
        transaction_id=transaction_id,
        category=category,
        notes=notes
    )
    
    return success_response(message='Transaction updated successfully')
