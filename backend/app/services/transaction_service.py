from bson.objectid import ObjectId
from datetime import datetime
from app.db import get_database
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class TransactionService:
    """Service for managing user transactions"""
    
    @staticmethod
    def get_user_transactions(user_id: str, category: str = None, limit: int = 50, skip: int = 0, sort_field: str = 'date', sort_order: int = -1):
        try:
            user_oid = ObjectId(user_id)
        except:
            raise ValidationError('Invalid user ID')

        query = {'user_id': user_oid}
        if category:
            query['category'] = category

        db = get_database()
        transactions = list(
            db.db.transactions.find(query)
            .sort(sort_field, sort_order)
            .limit(limit)
            .skip(skip)
        )

        for trans in transactions:
            trans['_id'] = str(trans['_id'])
            trans['user_id'] = str(trans['user_id'])

        total = db.db.transactions.count_documents(query)

        return {
            'total': total,
            'limit': limit,
            'skip': skip,
            'transactions': transactions
        }

    @staticmethod
    def get_transactions_by_category(user_id: str):
        try:
            user_oid = ObjectId(user_id)
        except:
            raise ValidationError('Invalid user ID')

        db = get_database()
        pipeline = [
            {'$match': {'user_id': user_oid}},
            {
                '$group': {
                    '_id': '$category',
                    'count': {'$sum': 1},
                    'total_amount': {'$sum': '$amount'},
                    'avg_amount': {'$avg': '$amount'},
                    'min_amount': {'$min': '$amount'},
                    'max_amount': {'$max': '$amount'}
                }
            },
            {'$sort': {'count': -1}}
        ]

        results = list(db.db.transactions.aggregate(pipeline))
        return {'categories': results}

    @staticmethod
    def get_transaction(transaction_id: str):
        try:
            trans_oid = ObjectId(transaction_id)
        except:
            raise ValidationError('Invalid transaction ID')

        db = get_database()
        transaction = db.db.transactions.find_one({'_id': trans_oid})
        
        if not transaction:
            raise NotFoundError('Transaction not found')

        transaction['_id'] = str(transaction['_id'])
        transaction['user_id'] = str(transaction['user_id'])
        return transaction

    @staticmethod
    def update_transaction(transaction_id: str, category: str = None, notes: str = None):
        try:
            trans_oid = ObjectId(transaction_id)
        except:
            raise ValidationError('Invalid transaction ID')

        update_data = {}
        if category is not None:
            update_data['category'] = category
        if notes is not None:
            update_data['notes'] = notes

        if not update_data:
            return True

        update_data['updated_at'] = datetime.utcnow()

        db = get_database()
        result = db.db.transactions.update_one(
            {'_id': trans_oid},
            {'$set': update_data}
        )

        if result.matched_count == 0:
            raise NotFoundError('Transaction not found')

        logger.info(f"Transaction updated: {transaction_id}")
        return True
