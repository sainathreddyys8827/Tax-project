"""
Transaction Categorization Service
Rule-based transaction categorization engine
"""
import re
from app.models import Transaction
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class TransactionCategorizationService:
    """Service for automatic transaction categorization"""
    
    # Categorization rules with keywords and patterns
    RULES = {
        'SALARY': {
            'keywords': ['salary', 'wages', 'payroll', 'salary credit', 'monthly salary', 'stipend', 'bonus'],
            'patterns': [r'SAL|SALARY|PAYROLL|BONUS|STIPEND'],
            'priority': 10
        },
        'INVESTMENT_80D': {
            'keywords': ['health insurance', 'medical insurance', 'star health', 'max bupa', 'care health', 'niva bupa',
                        'mediclaim', 'hdfc ergo', 'tata aig health', 'health premium', 'mediclaim premium', 'medical premium',
                        'preventive checkup', 'health checkup', 'tpa'],
            'patterns': [r'HEALTH\s*INSUR|HEALTH\s*PREM|MEDICAL\s*INSUR|MEDICLAIM|BUPA|STARHEALTH|CARE\s*HEALTH|NIVA\s*BUPA|MAX\s*BUPA|HDFC\s*ERGO'],
            'priority': 11
        },
        'INVESTMENT_80C': {
            'keywords': ['life insurance', 'ppf', 'nps', 'elss', 'mutual fund', 'zerodha', 'groww', 'upstox',
                        'life insurance premium', 'term insurance', 'pension', 'fund', 'nsc', 'post office', 'sukanya', 'life insurance corp'],
            'patterns': [r'LIC|PPF|NPS|ELSS|MUTUAL|ZERODHA|GROWW|UPSTOX|LIFE\s*INSUR'],
            'priority': 9
        },
        'HRA': {
            'keywords': ['rent', 'landlord', 'house rent', 'hra', 'monthly rent', 'pg rent', 'deposit'],
            'patterns': [r'RENT|LANDLORD|HOUSE RENT|HRA|DEPOSIT'],
            'priority': 7
        },
        'MEDICAL': {
            'keywords': ['hospital', 'doctor', 'pharmacy', 'medical', 'clinic', 'apollo', 'practo', '1mg', 'pharmEasy',
                        'health', 'medicine', 'dental'],
            'patterns': [r'HOSPITAL|DOCTOR|MEDICINE|PHARMACY|DENTAL|CLINIC|APOLLO|PRACTO|1MG|PHARMEASY'],
            'priority': 6
        },
        'EDUCATION': {
            'keywords': ['school', 'college', 'university', 'education', 'tuition', 'byjus', 'unacademy', 'coursera', 'udemy',
                        'fee', 'course', 'training'],
            'patterns': [r'SCHOOL|COLLEGE|UNIVERSITY|EDUCATION|TUITION|COURSE|BYJUS|UDEMY|COURSERA'],
            'priority': 5
        },
        'DONATE': {
            'keywords': ['charity', 'donation', 'ngo', 'foundation', 'donate', 'relief', 'pmcares', 'cry', 'smile foundation'],
            'patterns': [r'CHARITY|DONATION|NGO|DONATE|RELIEF|PMCARES'],
            'priority': 4
        },
        'INTEREST': {
            'keywords': ['interest', 'fixed deposit', 'fd interest', 'bank interest', 'savings interest', 'sweep'],
            'patterns': [r'INTEREST|FD|DEPOSIT'],
            'priority': 3
        },
        'DIVIDEND': {
            'keywords': ['dividend', 'stock', 'shares', 'investment income'],
            'patterns': [r'DIVIDEND|STOCK|SHARES'],
            'priority': 2
        },
        'DINING': {  # Added Discretionary Spending Tracker
            'keywords': ['zomato', 'swiggy', 'restaurant', 'cafe', 'starbucks', 'mcdonalds', 'kfc', 'dominos', 'food', 'dining'],
            'patterns': [r'ZOMATO|SWIGGY|REST|CAFE|STARBUCKS|MCDONALDS|KFC|DINING'],
            'priority': 1
        },
        'DEDUCTIBLE_EXPENSE': {
            'keywords': ['business', 'office', 'supplies', 'utilities', 'maintenance'],
            'patterns': [r'BUSINESS|OFFICE|SUPPLIES|UTILITIES'],
            'priority': 1
        }
    }
    
    @staticmethod
    def categorize_transaction(description, amount):
        """
        Categorize a single transaction based on description and amount
        
        Args:
            description: Transaction description string
            amount: Transaction amount (positive for credit, negative for debit)
        
        Returns:
            Category string
        """
        if not description:
            return 'OTHER'
        
        description_lower = description.lower()
        best_match = 'OTHER'
        best_priority = -1
        
        # Check each rule
        for category, rule in TransactionCategorizationService.RULES.items():
            # Check keywords
            for keyword in rule['keywords']:
                if keyword in description_lower:
                    if rule['priority'] > best_priority:
                        best_match = category
                        best_priority = rule['priority']
                    break
            
            # Check patterns (if not already matched)
            if best_priority < rule['priority']:
                for pattern in rule['patterns']:
                    if re.search(pattern, description_lower, re.IGNORECASE):
                        best_match = category
                        best_priority = rule['priority']
                        break
        
        logger.debug(f"Categorized '{description}' as {best_match}")
        return best_match
    
    @staticmethod
    def categorize_transactions_batch(df):
        """
        Categorize multiple transactions using vectorized Pandas operations
        
        Args:
            df: DataFrame with transactions
        
        Returns:
            DataFrame with added category column
        """
        import numpy as np
        
        try:
            # Initialize with default category
            df['category'] = 'OTHER'
            if df.empty or 'description' not in df.columns:
                return df
                
            # Convert descriptions to lowercase once for efficiency
            desc_lower = df['description'].str.lower().fillna('')
            
            # Create boolean masks for each priority level
            # We sort rules by priority descending
            sorted_rules = sorted(
                TransactionCategorizationService.RULES.items(),
                key=lambda x: x[1]['priority'],
                reverse=False # Start with lowest priority so higher priority overwrites
            )
            
            for category, rule in sorted_rules:
                # Build a single regex pattern for keywords (escaped) + regex patterns
                keywords = [re.escape(k) for k in rule['keywords']]
                patterns = rule['patterns']
                
                # Combine all into one regex that ignores case
                combined_pattern = '|'.join(keywords + patterns)
                
                if combined_pattern:
                    # vectorized regex search
                    match_mask = desc_lower.str.contains(combined_pattern, case=False, regex=True, na=False)
                    # where matched, overwrite the category
                    df.loc[match_mask, 'category'] = category
            
            logger.info(f"Categorized {len(df)} transactions using vectorized operations")
            
            # Log category distribution
            category_counts = df['category'].value_counts().to_dict()
            logger.info(f"Category distribution: {category_counts}")
            
            return df
        except Exception as e:
            logger.error(f"Error categorizing transactions: {str(e)}")
            raise
    
    @staticmethod
    def get_category_breakdown(df):
        """
        Get breakdown of transactions by category
        
        Args:
            df: DataFrame with categorized transactions
        
        Returns:
            Dictionary with category breakdown
        """
        breakdown = {}
        
        for category in Transaction.CATEGORIES.keys():
            cat_df = df[df['category'] == category]
            if len(cat_df) > 0:
                breakdown[category] = {
                    'count': len(cat_df),
                    'total_amount': float(cat_df['amount'].sum()),
                    'avg_amount': float(cat_df['amount'].mean()),
                    'transactions': cat_df[['date', 'description', 'amount']].to_dict('records')
                }
        
        return breakdown
