from bson.objectid import ObjectId
from datetime import datetime
from app.models import User
from app.db import get_database
from app.utils.errors import NotFoundError, ValidationError, TaxwiseError

class UserService:
    @staticmethod
    def create_user(email, pan, name, financial_year):
        db = get_database()
        
        # Check if user already exists
        existing_user = db.db.users.find_one({'email': email})
        if existing_user:
            raise ValidationError('User already exists')

        # Create user document
        user_doc = User.create_user_document(email, pan, name, financial_year)
        result = db.db.users.insert_one(user_doc)
        
        user_doc['_id'] = str(user_doc['_id'])
        return user_doc, str(result.inserted_id)

    @staticmethod
    def get_user(user_id):
        try:
            user_oid = ObjectId(user_id)
        except:
            raise ValidationError('Invalid user ID')

        db = get_database()
        user = db.db.users.find_one({'_id': user_oid})
        if not user:
            raise NotFoundError('User not found')

        user['_id'] = str(user['_id'])
        return user

    @staticmethod
    def update_user(user_id, update_data):
        try:
            user_oid = ObjectId(user_id)
        except:
            raise ValidationError('Invalid user ID')

        update_data['updated_at'] = datetime.utcnow()

        db = get_database()
        result = db.db.users.update_one({'_id': user_oid}, {'$set': update_data})

        if result.matched_count == 0:
            raise NotFoundError('User not found')

        return True
