"""
File Upload Service
Handles file upload processing workflow
"""
import os
from datetime import datetime
from bson.objectid import ObjectId
from app.models import FileUpload, Transaction
from app.db import get_database
from app.utils.errors import FileUploadError, DataProcessingError, ValidationError, NotFoundError
from app.utils.logger import setup_logger
from app.services.data_processing_service import DataProcessingService
from app.services.transaction_categorization_service import TransactionCategorizationService

logger = setup_logger(__name__)

class FileUploadService:
    """Service for managing file uploads"""
    
    @staticmethod
    def save_uploaded_file(file, user_id, upload_folder):
        """Save uploaded file to disk"""
        try:
            user_folder = os.path.join(upload_folder, str(user_id))
            os.makedirs(user_folder, exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            original_name = file.filename.rsplit('.', 1)[0]
            file_ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{original_name}_{timestamp}.{file_ext}"
            
            filepath = os.path.join(user_folder, filename)
            file.save(filepath)
            
            logger.info(f"File saved successfully: {filepath}")
            return filepath, filename
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise FileUploadError(f"Failed to save file: {str(e)}")
    
    @staticmethod
    def delete_uploaded_file(filepath):
        """Delete uploaded file"""
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"File deleted: {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False

    @staticmethod
    def process_file(user_id: str, file, filename: str, filepath: str):
        """Parse file, categorize transactions, and insert them into the database in bulk."""
        try:
            user_oid = ObjectId(user_id)
        except:
            raise ValidationError('Invalid user ID')

        db = get_database()
        
        # Create initial upload record
        upload_doc = FileUpload.create_upload_document(user_oid, filename, filepath)
        upload_result = db.db.file_uploads.insert_one(upload_doc)
        upload_id = str(upload_result.inserted_id)

        try:
            file.seek(0)
            df = DataProcessingService.read_csv_file(file)
            df = DataProcessingService.clean_data(df)
            DataProcessingService.validate_data(df)
            
            summary = DataProcessingService.get_summary_statistics(df)
            
            df = TransactionCategorizationService.categorize_transactions_batch(df)
            category_breakdown = TransactionCategorizationService.get_category_breakdown(df)

            transactions = []
            for _, row in df.iterrows():
                trans_doc = Transaction.create_transaction_document(
                    user_id=user_oid,
                    date=row['date'].to_pydatetime(),
                    description=row['description'],
                    amount=float(row['amount']),
                    category=row.get('category', 'OTHER'),
                    transaction_type='CREDIT' if row['amount'] > 0 else 'DEBIT'
                )
                transactions.append(trans_doc)

            if transactions:
                # Bulk write optimization
                db.db.transactions.insert_many(transactions)

            db.db.file_uploads.update_one(
                {'_id': ObjectId(upload_id)},
                {
                    '$set': {
                        'status': 'COMPLETED',
                        'transactions_count': len(transactions),
                        'updated_at': datetime.utcnow()
                    }
                }
            )

            logger.info(f"File processed successfully: {filename}")
            return {
                'upload_id': upload_id,
                'transactions_count': len(transactions),
                'summary': summary,
                'categories': category_breakdown
            }

        except DataProcessingError as e:
            db.db.file_uploads.update_one(
                {'_id': ObjectId(upload_id)},
                {'$set': {'status': 'FAILED', 'error_message': str(e), 'updated_at': datetime.utcnow()}}
            )
            # Re-raise to trigger appropriate response handler (422 equivalent)
            e.status_code = 422 
            raise e
        except Exception as e:
            logger.error(f"Error processing document {upload_id}: {str(e)}")
            db.db.file_uploads.update_one(
                {'_id': ObjectId(upload_id)},
                {'$set': {'status': 'FAILED', 'error_message': 'Error processing transactions', 'updated_at': datetime.utcnow()}}
            )
            raise e

    @staticmethod
    def get_upload_status(upload_id: str):
        """Retrieve the status of an uploaded file"""
        try:
            upload_oid = ObjectId(upload_id)
        except:
            raise ValidationError('Invalid upload ID')
        
        db = get_database()
        upload = db.db.file_uploads.find_one({'_id': upload_oid})
        if not upload:
            raise NotFoundError('Upload not found')
        
        upload['_id'] = str(upload['_id'])
        upload['user_id'] = str(upload['user_id'])
        return upload
