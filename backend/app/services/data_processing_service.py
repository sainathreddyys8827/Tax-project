"""
Data Processing Service
Handles CSV file reading, cleaning, and data preprocessing
"""
import pandas as pd
from io import StringIO
from datetime import datetime
from app.utils.errors import DataProcessingError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class DataProcessingService:
    """Service for processing and cleaning financial data"""
    
    REQUIRED_COLUMNS = ['date', 'description', 'amount']
    
    @staticmethod
    def read_csv_file(file_stream):
        """
        Read and parse CSV file
        
        Args:
            file_stream: File stream object
        
        Returns:
            DataFrame with parsed data
        """
        try:
            # Read file content
            content = file_stream.read().decode('utf-8')
            df = pd.read_csv(StringIO(content))
            
            if df.empty:
                logger.error("Parsed CSV file is empty.")
                raise DataProcessingError("The uploaded CSV file contains no data.")
                
            logger.info(f"CSV file read successfully. Rows: {len(df)}")
            return df
        except pd.errors.EmptyDataError:
            logger.error("CSV file is completely empty.")
            raise DataProcessingError("File is empty or invalid format.")
        except pd.errors.ParserError as e:
            logger.error(f"CSV Parser Error: {str(e)}")
            raise DataProcessingError(f"Failed to parse CSV file formatting: {str(e)}")
        except DataProcessingError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error reading CSV file: {str(e)}")
            raise DataProcessingError(f"Failed to read CSV file: {str(e)}")
    
    @staticmethod
    def clean_data(df):
        """
        Clean and standardize data
        
        Args:
            df: Input DataFrame
        
        Returns:
            Cleaned DataFrame
        """
        try:
            logger.info(f"Starting data cleaning. Initial rows: {len(df)}")
            # Make column names lowercase
            df.columns = df.columns.str.lower()
            
            # Check required columns
            # Ensure 'date', 'amount', and 'description' or variations exist
            required_cols = ['date', 'amount']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                logger.error(f"Missing required columns in CSV: {missing_cols}")
                raise DataProcessingError(
                    f"Invalid file format: Missing required columns: {', '.join(missing_cols)}. Please ensure your CSV has 'date' and 'amount' columns."
                )
            
            # Handle description column (set to empty if missing)
            if 'description' not in df.columns:
                logger.warning("Description column missing, filling with empty strings.")
                df['description'] = ''
            
            # Remove rows with missing critical data
            df = df.dropna(subset=['date', 'amount'])
            
            # Convert date to datetime
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            
            # Remove invalid dates
            df = df[df['date'].notna()]
            
            # Convert amount to float
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            
            # Remove zero or NaN amounts
            df = df[df['amount'].notna()]
            df = df[df['amount'] != 0]
            
            # Clean description
            df['description'] = df['description'].str.strip().fillna('')
            
            # Remove duplicates
            df = df.drop_duplicates(subset=['date', 'description', 'amount'])
            
            # Sort by date
            df = df.sort_values('date')
            
            logger.info(f"Data cleaned successfully. Rows after cleaning: {len(df)}")
            return df
        
        except DataProcessingError:
            raise
        except Exception as e:
            logger.error(f"Error cleaning data: {str(e)}")
            raise DataProcessingError(f"Data cleaning failed: {str(e)}")
    
    @staticmethod
    def validate_data(df):
        """
        Validate cleaned data
        
        Args:
            df: DataFrame to validate
        
        Returns:
            True if valid, raises exception otherwise
        """
        if df.empty:
            raise DataProcessingError("No valid transactions found in the file")
        
        # Check date range
        min_date = df['date'].min()
        max_date = df['date'].max()
        days_diff = (max_date - min_date).days
        
        if days_diff < 0:
            raise DataProcessingError("Invalid date range in data")
        
        logger.info(f"Data validation passed. Date range: {min_date} to {max_date}")
        return True
    
    @staticmethod
    def get_summary_statistics(df):
        """
        Get summary statistics of transactions
        
        Args:
            df: DataFrame
        
        Returns:
            Dictionary with summary stats
        """
        try:
            credits = df[df['amount'] > 0]['amount'].sum()
            debits = df[df['amount'] < 0]['amount'].sum()
            
            return {
                'total_records': len(df),
                'total_credits': float(credits),
                'total_debits': float(abs(debits)),
                'net_amount': float(credits + debits),
                'date_range': {
                    'start': df['date'].min().isoformat(),
                    'end': df['date'].max().isoformat()
                },
                'unique_descriptions': df['description'].nunique()
            }
        except Exception as e:
            logger.error(f"Error calculating statistics: {str(e)}")
            return {}
