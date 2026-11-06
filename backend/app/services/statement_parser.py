"""
Statement Parser Service
Parses and standardizes bank statement CSV files
"""
import pandas as pd
import numpy as np
from io import StringIO
from datetime import datetime
from app.utils.errors import DataProcessingError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class StatementParser:
    """Service for parsing and standardizing bank statement files"""
    
    # Common column name variations
    COLUMN_MAPPINGS = {
        'date': [
            'date', 'transaction_date', 'trans_date', 'txn_date',
            'posted_date', 'posting_date', 'entry_date', 'value_date',
            'settlement_date', 'dated', 'booking_date'
        ],
        'description': [
            'description', 'narration', 'remarks', 'transaction_details',
            'detail', 'transaction_description', 'desc', 'particulars',
            'memo', 'reference', 'details', 'trans_details'
        ],
        'amount': [
            'amount', 'transaction_amount', 'txn_amount', 'trans_amt',
            'value', 'debit_credit', 'balance', 'credit', 'debit',
            'amt', 'transaction_value'
        ],
        'credit': [
            'credit', 'credit_amount', 'cr_amount', 'inflow',
            'deposit', 'cr', 'cr_amt'
        ],
        'debit': [
            'debit', 'debit_amount', 'db_amount', 'outflow',
            'withdrawal', 'db', 'db_amt'
        ]
    }
    
    # Common date formats to try
    DATE_FORMATS = [
        '%Y-%m-%d',           # 2023-12-31
        '%d-%m-%Y',           # 31-12-2023
        '%m-%d-%Y',           # 12-31-2023
        '%d/%m/%Y',           # 31/12/2023
        '%m/%d/%Y',           # 12/31/2023
        '%Y/%m/%d',           # 2023/12/31
        '%d.%m.%Y',           # 31.12.2023
        '%Y.%m.%d',           # 2023.12.31
        '%d-%b-%Y',           # 31-Dec-2023
        '%d-%b-%y',           # 31-Dec-23
        '%B %d, %Y',          # December 31, 2023
        '%b %d, %Y',          # Dec 31, 2023
        '%d %B %Y',           # 31 December 2023
        '%d %b %Y',           # 31 Dec 2023
        '%Y%m%d',             # 20231231
        '%d%m%Y',             # 31122023
    ]
    
    @staticmethod
    def read_csv(file_stream, encoding='utf-8', skip_rows=0):
        """
        Read CSV file from stream
        
        Args:
            file_stream: File stream object or file path
            encoding: File encoding (default: utf-8)
            skip_rows: Number of rows to skip from top (default: 0)
        
        Returns:
            Raw pandas DataFrame
        
        Raises:
            DataProcessingError: If file cannot be read
        """
        try:
            if isinstance(file_stream, str):
                # File path provided
                df = pd.read_csv(file_stream, encoding=encoding, skiprows=skip_rows)
            else:
                # File stream provided
                content = file_stream.read()
                if isinstance(content, bytes):
                    content = content.decode(encoding)
                df = pd.read_csv(StringIO(content), skiprows=skip_rows)
            
            logger.info(f"CSV file read successfully. Shape: {df.shape}")
            return df
        
        except UnicodeDecodeError:
            logger.error("Unicode decode error - trying alternative encoding")
            raise DataProcessingError(
                f"Cannot read file with encoding '{encoding}'. Try 'utf-8', 'iso-8859-1', or 'cp1252'"
            )
        except pd.errors.EmptyDataError:
            logger.error("CSV file is empty")
            raise DataProcessingError("CSV file is empty")
        except pd.errors.ParserError as e:
            logger.error(f"CSV parsing error: {str(e)}")
            raise DataProcessingError(f"Invalid CSV format: {str(e)}")
        except Exception as e:
            logger.error(f"Error reading CSV: {str(e)}")
            raise DataProcessingError(f"Failed to read CSV file: {str(e)}")
    
    @staticmethod
    def standardize_columns(df):
        """
        Standardize column names to standard format
        
        Args:
            df: Raw DataFrame with unknown column names
        
        Returns:
            DataFrame with standardized columns (date, description, amount)
        
        Raises:
            DataProcessingError: If required columns cannot be identified
        """
        try:
            # Create lowercase column mapping for matching
            df_columns_lower = {col.lower().strip(): col for col in df.columns}
            
            # Find matching columns
            identified_columns = {}
            
            for standard_col, variations in StatementParser.COLUMN_MAPPINGS.items():
                for variation in variations:
                    if variation in df_columns_lower:
                        identified_columns[standard_col] = df_columns_lower[variation]
                        break
            
            logger.info(f"Identified columns: {identified_columns}")
            
            # Check required columns
            required = ['date', 'amount']
            missing = [col for col in required if col not in identified_columns]
            
            if missing:
                raise DataProcessingError(
                    f"Cannot identify required columns: {', '.join(missing)}. "
                    f"Available columns: {', '.join(df.columns)}"
                )
            
            # Build new dataframe with standardized columns
            rename_dict = {v: k for k, v in identified_columns.items()}
            df_standardized = df[list(identified_columns.values())].rename(columns=rename_dict)
            
            # Ensure description column exists (use empty string if not found)
            if 'description' not in df_standardized.columns:
                df_standardized['description'] = ''
            
            # Reorder columns: date, description, amount
            df_standardized = df_standardized[['date', 'description', 'amount']]
            
            logger.info(f"Columns standardized: {list(df_standardized.columns)}")
            return df_standardized
        
        except DataProcessingError:
            raise
        except Exception as e:
            logger.error(f"Error standardizing columns: {str(e)}")
            raise DataProcessingError(f"Failed to standardize columns: {str(e)}")
    
    @staticmethod
    def parse_dates(df, date_column='date'):
        """
        Parse dates in multiple formats
        
        Args:
            df: DataFrame with date column
            date_column: Name of date column (default: 'date')
        
        Returns:
            DataFrame with parsed datetime column
        
        Raises:
            DataProcessingError: If dates cannot be parsed
        """
        try:
            if date_column not in df.columns:
                raise DataProcessingError(f"Column '{date_column}' not found")
            
            # Convert to string to handle various types
            date_series = df[date_column].astype(str).str.strip()
            
            parsed_dates = None
            
            # Try each date format
            for date_format in StatementParser.DATE_FORMATS:
                try:
                    parsed_dates = pd.to_datetime(date_series, format=date_format, errors='coerce')
                    
                    # Check if most dates were parsed successfully
                    success_rate = (parsed_dates.notna().sum() / len(parsed_dates)) * 100
                    
                    if success_rate >= 80:  # At least 80% success rate
                        logger.info(f"Successfully parsed dates with format: {date_format} ({success_rate:.1f}% success)")
                        df[date_column] = parsed_dates
                        return df
                
                except Exception:
                    continue
            
            # If no format worked well, try pandas inference
            logger.warning("No date format matched, using pandas inference")
            df[date_column] = pd.to_datetime(date_series, infer_datetime_format=True, errors='coerce')
            
            # Check if any dates were parsed
            if df[date_column].isna().all():
                raise DataProcessingError(
                    f"Could not parse dates in column '{date_column}'. "
                    f"Sample values: {date_series.head().tolist()}"
                )
            
            logger.info(f"Parsed dates using inference")
            return df
        
        except DataProcessingError:
            raise
        except Exception as e:
            logger.error(f"Error parsing dates: {str(e)}")
            raise DataProcessingError(f"Failed to parse dates: {str(e)}")
    
    @staticmethod
    def convert_amounts(df, amount_column='amount'):
        """
        Convert amount column to float
        
        Args:
            df: DataFrame with amount column
            amount_column: Name of amount column (default: 'amount')
        
        Returns:
            DataFrame with numeric amount column
        
        Raises:
            DataProcessingError: If amounts cannot be converted
        """
        try:
            if amount_column not in df.columns:
                raise DataProcessingError(f"Column '{amount_column}' not found")
            
            # Remove currency symbols and whitespace
            amount_series = df[amount_column].astype(str)
            
            # Remove common currency symbols and separators
            amount_series = amount_series.str.replace(r'[₹$€£¥]', '', regex=True)
            amount_series = amount_series.str.replace(',', '')
            amount_series = amount_series.str.strip()
            
            # Convert to numeric, coercing errors to NaN
            df[amount_column] = pd.to_numeric(amount_series, errors='coerce')
            
            # Check for conversion errors
            invalid_count = df[amount_column].isna().sum()
            if invalid_count > 0:
                logger.warning(f"Could not convert {invalid_count} amount values to numeric")
            
            logger.info(f"Converted {len(df) - invalid_count} amounts to numeric")
            return df
        
        except DataProcessingError:
            raise
        except Exception as e:
            logger.error(f"Error converting amounts: {str(e)}")
            raise DataProcessingError(f"Failed to convert amounts: {str(e)}")
    
    @staticmethod
    def remove_null_rows(df, columns=None):
        """
        Remove rows with null/missing values
        
        Args:
            df: DataFrame to clean
            columns: List of columns to check (default: all required columns)
        
        Returns:
            DataFrame with null rows removed
        """
        try:
            if columns is None:
                columns = ['date', 'amount']
            
            initial_count = len(df)
            
            # Remove rows where any required column is null
            for col in columns:
                if col in df.columns:
                    df = df[df[col].notna()]
            
            removed_count = initial_count - len(df)
            if removed_count > 0:
                logger.info(f"Removed {removed_count} null rows")
            
            return df.reset_index(drop=True)
        
        except Exception as e:
            logger.error(f"Error removing null rows: {str(e)}")
            raise DataProcessingError(f"Failed to remove null rows: {str(e)}")
    
    @staticmethod
    def remove_duplicates(df, subset=None, keep='first'):
        """
        Remove duplicate rows
        
        Args:
            df: DataFrame to clean
            subset: Column names to consider for duplicates (default: all)
            keep: Which duplicates to keep - 'first', 'last', or False (default: 'first')
        
        Returns:
            DataFrame with duplicates removed
        """
        try:
            initial_count = len(df)
            df = df.drop_duplicates(subset=subset, keep=keep)
            removed_count = initial_count - len(df)
            
            if removed_count > 0:
                logger.info(f"Removed {removed_count} duplicate rows")
            
            return df.reset_index(drop=True)
        
        except Exception as e:
            logger.error(f"Error removing duplicates: {str(e)}")
            raise DataProcessingError(f"Failed to remove duplicates: {str(e)}")
    
    @staticmethod
    def clean_description(df, description_column='description'):
        """
        Clean and standardize description/narration column
        
        Args:
            df: DataFrame with description column
            description_column: Name of description column
        
        Returns:
            DataFrame with cleaned descriptions
        """
        try:
            if description_column in df.columns:
                # Strip whitespace
                df[description_column] = df[description_column].astype(str).str.strip()
                
                # Replace multiple spaces with single space
                df[description_column] = df[description_column].str.replace(r'\s+', ' ', regex=True)
                
                # Replace 'nan' strings with empty string
                df[description_column] = df[description_column].replace('nan', '')
                
                logger.info("Description column cleaned")
            
            return df
        
        except Exception as e:
            logger.error(f"Error cleaning descriptions: {str(e)}")
            raise DataProcessingError(f"Failed to clean descriptions: {str(e)}")
    
    @staticmethod
    def validate_data(df):
        """
        Validate parsed data
        
        Args:
            df: DataFrame to validate
        
        Returns:
            True if valid
        
        Raises:
            DataProcessingError: If validation fails
        """
        try:
            if df.empty:
                raise DataProcessingError("DataFrame is empty after parsing")
            
            # Check required columns
            required_columns = ['date', 'amount']
            missing = [col for col in required_columns if col not in df.columns]
            if missing:
                raise DataProcessingError(f"Missing required columns: {', '.join(missing)}")
            
            # Check data types
            if not pd.api.types.is_datetime64_any_dtype(df['date']):
                raise DataProcessingError("Date column is not datetime type")
            
            if not pd.api.types.is_numeric_dtype(df['amount']):
                raise DataProcessingError("Amount column is not numeric type")
            
            # Check for all null critical columns
            if df['date'].isna().all():
                raise DataProcessingError("All dates are null")
            
            if df['amount'].isna().all():
                raise DataProcessingError("All amounts are null")
            
            logger.info("Data validation passed")
            return True
        
        except DataProcessingError:
            raise
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            raise DataProcessingError(f"Data validation failed: {str(e)}")
    
    @staticmethod
    def get_data_quality_report(df):
        """
        Generate data quality report
        
        Args:
            df: DataFrame to analyze
        
        Returns:
            Dictionary with quality metrics
        """
        try:
            report = {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'columns': list(df.columns),
                'date_stats': {
                    'non_null': int(df['date'].notna().sum()) if 'date' in df.columns else 0,
                    'null': int(df['date'].isna().sum()) if 'date' in df.columns else 0,
                    'min_date': df['date'].min().isoformat() if 'date' in df.columns and df['date'].notna().any() else None,
                    'max_date': df['date'].max().isoformat() if 'date' in df.columns and df['date'].notna().any() else None
                },
                'amount_stats': {
                    'non_null': int(df['amount'].notna().sum()) if 'amount' in df.columns else 0,
                    'null': int(df['amount'].isna().sum()) if 'amount' in df.columns else 0,
                    'total': float(df['amount'].sum()) if 'amount' in df.columns else 0.0,
                    'mean': float(df['amount'].mean()) if 'amount' in df.columns and df['amount'].notna().any() else 0.0,
                    'min': float(df['amount'].min()) if 'amount' in df.columns and df['amount'].notna().any() else 0.0,
                    'max': float(df['amount'].max()) if 'amount' in df.columns and df['amount'].notna().any() else 0.0
                },
                'description_stats': {
                    'non_null': int(df['description'].notna().sum()) if 'description' in df.columns else 0,
                    'null': int(df['description'].isna().sum()) if 'description' in df.columns else 0,
                    'unique': int(df['description'].nunique()) if 'description' in df.columns else 0
                } if 'description' in df.columns else {}
            }
            
            return report
        
        except Exception as e:
            logger.error(f"Error generating quality report: {str(e)}")
            return {}
    
    @staticmethod
    def parse(file_stream, encoding='utf-8', skip_rows=0, remove_dup=True):
        """
        Complete parsing pipeline: read -> standardize -> convert -> clean -> validate
        
        Args:
            file_stream: File stream or file path
            encoding: File encoding
            skip_rows: Rows to skip from top
            remove_dup: Whether to remove duplicates (default: True)
        
        Returns:
            Tuple of (cleaned_DataFrame, quality_report)
        
        Raises:
            DataProcessingError: If any step fails
        """
        try:
            logger.info("Starting statement parsing pipeline")
            
            # Step 1: Read CSV
            df = StatementParser.read_csv(file_stream, encoding, skip_rows)
            logger.info("Step 1: CSV read complete")
            
            # Step 2: Standardize columns
            df = StatementParser.standardize_columns(df)
            logger.info("Step 2: Columns standardized")
            
            # Step 3: Parse dates
            df = StatementParser.parse_dates(df)
            logger.info("Step 3: Dates parsed")
            
            # Step 4: Convert amounts
            df = StatementParser.convert_amounts(df)
            logger.info("Step 4: Amounts converted")
            
            # Step 5: Clean descriptions
            df = StatementParser.clean_description(df)
            logger.info("Step 5: Descriptions cleaned")
            
            # Step 6: Remove null rows
            df = StatementParser.remove_null_rows(df)
            logger.info("Step 6: Null rows removed")
            
            # Step 7: Remove duplicates (optional)
            if remove_dup:
                df = StatementParser.remove_duplicates(df)
                logger.info("Step 7: Duplicates removed")
            
            # Step 8: Validate data
            StatementParser.validate_data(df)
            logger.info("Step 8: Data validated")
            
            # Generate quality report
            report = StatementParser.get_data_quality_report(df)
            
            logger.info("Statement parsing pipeline completed successfully")
            return df, report
        
        except DataProcessingError:
            raise
        except Exception as e:
            logger.error(f"Parsing pipeline failed: {str(e)}")
            raise DataProcessingError(f"Failed to parse statement: {str(e)}")
