"""
Tax Analyzer Service
Analyzes transactions for Indian income tax deductions (80C, 80D, HRA, etc.)
"""
import re
from datetime import datetime
from app.utils.errors import TaxCalculationError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class TaxAnalyzer:
    """Analyzer for Indian income tax deductions"""
    
    # Section 80C - Life Insurance, PPF, ELSS, EPF
    # Limit: Rs. 1,50,000
    SECTION_80C = {
        'limit': 150000,
        'name': 'Section 80C - Life Insurance, PPF, ELSS, EPF NPS',
        'description': 'Deduction for investments in life insurance, PPF, ELSS, and EPF',
        'sub_categories': {
            'life_insurance': {
                'keywords': ['lic', 'life insurance', 'insurance premium', 'lpg', 'endowment', 'policy'],
                'limit': None,  # No separate limit
                'min_annual_amount': 0
            },
            'ppf': {
                'keywords': ['ppf', 'public provident fund', 'post office savings'],
                'limit': None,
                'min_annual_amount': 500
            },
            'elss': {
                'keywords': ['elss', 'equity linked savings', 'mutual fund', 'mf'],
                'limit': None,
                'min_annual_amount': 500
            },
            'epf': {
                'keywords': ['epf', 'employee provident fund', 'provident fund', 'pf', 'nps'],
                'limit': None,
                'min_annual_amount': 500
            },
            'nps': {
                'keywords': ['nps', 'national pension scheme', 'pension scheme'],
                'limit': None,
                'min_annual_amount': 500
            },
            'sukanya_samriddhi': {
                'keywords': ['sukanya', 'girl child', 'daughter'],
                'limit': 150000,
                'min_annual_amount': 250
            },
            'ugp': {
                'keywords': ['unit growth plan', 'ugp'],
                'limit': None,
                'min_annual_amount': 0
            },
            'principal_repayment': {
                'keywords': ['principal repayment', 'home loan principal', 'mortgage'],
                'limit': None,
                'min_annual_amount': 0
            }
        }
    }
    
    # Section 80D - Medical Insurance
    # Limit: Rs. 1,00,000
    SECTION_80D = {
        'limit': 100000,
        'name': 'Section 80D - Medical Insurance Premium',
        'description': 'Deduction for health insurance premiums for self, spouse, children, parents',
        'sub_categories': {
            'self_family': {
                'keywords': ['health insurance', 'medical insurance', 'mediclaim', 'self', 'family'],
                'limit': 75000,
                'min_annual_amount': 0
            },
            'parents': {
                'keywords': ['parent health insurance', 'elderly', 'parents', 'senior citizen'],
                'limit': 100000,  # Increased for elderly parents
                'min_annual_amount': 0
            },
            'preventive': {
                'keywords': ['preventive health', 'check up', 'annual checkup'],
                'limit': 5000,
                'min_annual_amount': 0
            }
        }
    }
    
    # HRA - House Rent Allowance
    # No fixed limit, but calculated based on salary
    HRA = {
        'limit': None,
        'name': 'HRA (House Rent Allowance)',
        'description': 'Deduction for house rent paid (up to rent paid - 10% of basic salary)',
        'conditions': [
            'Rent paid should be documented with rent agreement',
            'Landlord details should be provided',
            'Applicable only if living in rented accommodation',
            'In metro cities: 50% of basic salary limit',
            'In non-metro cities: 40% of basic salary limit'
        ],
        'min_annual_amount': 0
    }
    
    # Section 80G - Charitable Donations
    # 50% or 100% deduction based on organization
    SECTION_80G = {
        'limit': None,
        'name': 'Section 80G - Donations to Eligible Organizations',
        'description': 'Deduction for charitable donations (50% or 100% depending on type)',
        'eligible_organizations': [
            'NGOs with 80G certification',
            'Educational institutions',
            'Medical research organizations',
            'National funds (PM Relief Fund, etc.)'
        ],
        'deduction_rates': {
            '100': {
                'name': 'Full deduction (100%)',
                'keywords': ['national relief fund', 'pm relief', 'armed forces'],
                'percentage': 100
            },
            '50': {
                'name': 'Half deduction (50%)',
                'keywords': ['charity', 'donation', 'ngo', 'relief'],
                'percentage': 50
            }
        }
    }
    
    # Education - 80E for interest on education loans
    EDUCATION_80E = {
        'limit': None,
        'name': 'Section 80E - Education Loan Interest',
        'description': 'Deduction for interest paid on education loans',
        'min_annual_amount': 0
    }
    
    @staticmethod
    def detect_80c_investments(transactions_df):
        """
        Detect Section 80C investments (PPF, LIC, ELSS, EPF, NPS)
        
        Args:
            transactions_df: DataFrame with transaction description and amount
        
        Returns:
            Dictionary with 80C analysis
        """
        try:
            if transactions_df.empty:
                return {
                    'total_amount': 0.0,
                    'limit': TaxAnalyzer.SECTION_80C['limit'],
                    'eligible_amount': 0.0,
                    'remaining': TaxAnalyzer.SECTION_80C['limit'],
                    'utilization_percentage': 0.0,
                    'investments': {},
                    'transactions': []
                }
            
            result = {
                'total_amount': 0.0,
                'limit': TaxAnalyzer.SECTION_80C['limit'],
                'eligible_amount': 0.0,
                'remaining': TaxAnalyzer.SECTION_80C['limit'],
                'utilization_percentage': 0.0,
                'investments': {},
                'transactions': []
            }
            
            # Initialize sub-categories
            for sub_cat in TaxAnalyzer.SECTION_80C['sub_categories']:
                result['investments'][sub_cat] = {
                    'amount': 0.0,
                    'count': 0,
                    'transactions': []
                }
            
            # Search for 80C investments
            for idx, row in transactions_df.iterrows():
                description = str(row.get('description', '')).lower()
                amount = float(row.get('amount', 0))
                
                if amount <= 0:  # Only debit transactions
                    amount = abs(amount)
                else:
                    continue
                
                matched_sub_cat = None
                
                # Check each sub-category
                for sub_cat, details in TaxAnalyzer.SECTION_80C['sub_categories'].items():
                    for keyword in details['keywords']:
                        if keyword.lower() in description:
                            result['investments'][sub_cat]['amount'] += amount
                            result['investments'][sub_cat]['count'] += 1
                            result['investments'][sub_cat]['transactions'].append({
                                'date': str(row.get('date', '')),
                                'description': row.get('description', ''),
                                'amount': amount
                            })
                            result['total_amount'] += amount
                            matched_sub_cat = sub_cat
                            break
                    
                    if matched_sub_cat:
                        break
            
            # Calculate eligible amount (capped at limit)
            result['eligible_amount'] = min(result['total_amount'], result['limit'])
            result['remaining'] = max(0, result['limit'] - result['eligible_amount'])
            result['utilization_percentage'] = (result['eligible_amount'] / result['limit'] * 100) if result['limit'] else 0
            
            # Remove empty sub-categories
            result['investments'] = {k: v for k, v in result['investments'].items() if v['count'] > 0}
            
            logger.info(f"Section 80C Analysis: Total={result['total_amount']}, Eligible={result['eligible_amount']}")
            return result
        
        except Exception as e:
            logger.error(f"Error detecting 80C investments: {str(e)}")
            raise TaxCalculationError(f"Failed to analyze 80C deductions: {str(e)}")
    
    @staticmethod
    def detect_80d_insurance(transactions_df):
        """
        Detect Section 80D medical insurance payments
        
        Args:
            transactions_df: DataFrame with transaction description and amount
        
        Returns:
            Dictionary with 80D analysis
        """
        try:
            if transactions_df.empty:
                return {
                    'total_amount': 0.0,
                    'limit': TaxAnalyzer.SECTION_80D['limit'],
                    'eligible_amount': 0.0,
                    'remaining': TaxAnalyzer.SECTION_80D['limit'],
                    'utilization_percentage': 0.0,
                    'insurance_types': {},
                    'transactions': []
                }
            
            result = {
                'total_amount': 0.0,
                'limit': TaxAnalyzer.SECTION_80D['limit'],
                'eligible_amount': 0.0,
                'remaining': TaxAnalyzer.SECTION_80D['limit'],
                'utilization_percentage': 0.0,
                'insurance_types': {},
                'transactions': []
            }
            
            # Initialize insurance types
            for ins_type in TaxAnalyzer.SECTION_80D['sub_categories']:
                result['insurance_types'][ins_type] = {
                    'amount': 0.0,
                    'count': 0,
                    'transactions': []
                }
            
            # Search for insurance premiums
            for idx, row in transactions_df.iterrows():
                description = str(row.get('description', '')).lower()
                amount = float(row.get('amount', 0))
                
                if amount <= 0:  # Only debit transactions
                    amount = abs(amount)
                else:
                    continue
                
                matched_type = None
                
                # Check each insurance type
                for ins_type, details in TaxAnalyzer.SECTION_80D['sub_categories'].items():
                    for keyword in details['keywords']:
                        if keyword.lower() in description:
                            result['insurance_types'][ins_type]['amount'] += amount
                            result['insurance_types'][ins_type]['count'] += 1
                            result['insurance_types'][ins_type]['transactions'].append({
                                'date': str(row.get('date', '')),
                                'description': row.get('description', ''),
                                'amount': amount
                            })
                            result['total_amount'] += amount
                            matched_type = ins_type
                            break
                    
                    if matched_type:
                        break
            
            # Calculate eligible amount (capped at limit)
            result['eligible_amount'] = min(result['total_amount'], result['limit'])
            result['remaining'] = max(0, result['limit'] - result['eligible_amount'])
            result['utilization_percentage'] = (result['eligible_amount'] / result['limit'] * 100) if result['limit'] else 0
            
            # Remove empty insurance types
            result['insurance_types'] = {k: v for k, v in result['insurance_types'].items() if v['count'] > 0}
            
            logger.info(f"Section 80D Analysis: Total={result['total_amount']}, Eligible={result['eligible_amount']}")
            return result
        
        except Exception as e:
            logger.error(f"Error detecting 80D insurance: {str(e)}")
            raise TaxCalculationError(f"Failed to analyze 80D deductions: {str(e)}")
    
    @staticmethod
    def detect_hra_rent(transactions_df, basic_salary=None):
        """
        Detect HRA (House Rent Allowance) payments
        
        Args:
            transactions_df: DataFrame with transaction description and amount
            basic_salary: Monthly basic salary (optional, for calculation)
        
        Returns:
            Dictionary with HRA analysis
        """
        try:
            if transactions_df.empty:
                return {
                    'total_rent_paid': 0.0,
                    'eligible_amount': 0.0,
                    'remaining': 0.0,
                    'transactions': [],
                    'monthly_avg': 0.0,
                    'conditions': TaxAnalyzer.HRA['conditions']
                }
            
            result = {
                'total_rent_paid': 0.0,
                'eligible_amount': 0.0,
                'remaining': 0.0,
                'transactions': [],
                'monthly_avg': 0.0,
                'conditions': TaxAnalyzer.HRA['conditions']
            }
            
            hra_keywords = ['rent', 'landlord', 'house rent', 'hra', 'monthly rent', 'accommodation']
            
            # Search for rent payments
            for idx, row in transactions_df.iterrows():
                description = str(row.get('description', '')).lower()
                amount = float(row.get('amount', 0))
                date = row.get('date')
                
                # Check for rent keywords
                if any(keyword in description for keyword in hra_keywords):
                    if amount <= 0:  # Only debit transactions
                        amount = abs(amount)
                    else:
                        continue
                    
                    result['total_rent_paid'] += amount
                    result['transactions'].append({
                        'date': str(date),
                        'description': row.get('description', ''),
                        'amount': amount
                    })
            
            # Calculate monthly average
            if result['transactions']:
                result['monthly_avg'] = result['total_rent_paid'] / len(result['transactions'])
            
            # HRA eligibility calculation
            if basic_salary:
                annual_salary = basic_salary * 12
                # Assume metro city (50% limit) - can be customized
                salary_limit = annual_salary * 0.5
                rent_minus_10pct = result['total_rent_paid'] - (annual_salary * 0.1)
                
                # HRA eligible = min of (rent paid - 10% salary, 50% salary)
                result['eligible_amount'] = min(max(0, rent_minus_10pct), salary_limit)
            else:
                # Without salary info, full rent is tentatively eligible
                result['eligible_amount'] = result['total_rent_paid']
            
            logger.info(f"HRA Analysis: TotalRent={result['total_rent_paid']}, Eligible={result['eligible_amount']}")
            return result
        
        except Exception as e:
            logger.error(f"Error detecting HRA rent: {str(e)}")
            raise TaxCalculationError(f"Failed to analyze HRA deductions: {str(e)}")
    
    @staticmethod
    def detect_80g_donations(transactions_df):
        """
        Detect Section 80G charitable donations
        
        Args:
            transactions_df: DataFrame with transaction description and amount
        
        Returns:
            Dictionary with 80G analysis
        """
        try:
            if transactions_df.empty:
                return {
                    'total_donated': 0.0,
                    'eligible_deduction': 0.0,
                    'full_deduction_amount': 0.0,
                    'half_deduction_amount': 0.0,
                    'transactions': [],
                    'note': 'Verify organizations have valid 80G certification'
                }
            
            result = {
                'total_donated': 0.0,
                'eligible_deduction': 0.0,
                'full_deduction_amount': 0.0,
                'half_deduction_amount': 0.0,
                'transactions': [],
                'note': 'Verify organizations have valid 80G certification'
            }
            
            donation_keywords = ['charity', 'donation', 'ngo', 'relief', 'foundation', 'donate']
            
            # Search for donations
            for idx, row in transactions_df.iterrows():
                description = str(row.get('description', '')).lower()
                amount = float(row.get('amount', 0))
                
                if any(keyword in description for keyword in donation_keywords):
                    if amount <= 0:  # Only debit transactions
                        amount = abs(amount)
                    else:
                        continue
                    
                    result['total_donated'] += amount
                    
                    # Determine deduction type (100% or 50%)
                    deduction_type = '50'  # Default to 50%
                    if any(keyword in description for keyword in TaxAnalyzer.SECTION_80G['deduction_rates']['100']['keywords']):
                        deduction_type = '100'
                        result['full_deduction_amount'] += amount
                    else:
                        result['half_deduction_amount'] += amount
                    
                    result['transactions'].append({
                        'date': str(row.get('date', '')),
                        'description': row.get('description', ''),
                        'amount': amount,
                        'deduction_type': deduction_type
                    })
            
            # Calculate eligible deduction
            result['full_deduction_amount'] = min(result['full_deduction_amount'], result['total_donated'])
            result['half_deduction_amount'] = min(result['half_deduction_amount'], result['total_donated'] - result['full_deduction_amount'])
            
            result['eligible_deduction'] = result['full_deduction_amount'] + (result['half_deduction_amount'] * 0.5)
            
            logger.info(f"Section 80G Analysis: TotalDonated={result['total_donated']}, EligibleDeduction={result['eligible_deduction']}")
            return result
        
        except Exception as e:
            logger.error(f"Error detecting 80G donations: {str(e)}")
            raise TaxCalculationError(f"Failed to analyze 80G deductions: {str(e)}")
    
    @staticmethod
    def detect_education_loan_interest(transactions_df):
        """
        Detect Section 80E education loan interest payments
        
        Args:
            transactions_df: DataFrame with transaction description and amount
        
        Returns:
            Dictionary with 80E analysis
        """
        try:
            if transactions_df.empty:
                return {
                    'total_interest_paid': 0.0,
                    'eligible_deduction': 0.0,
                    'transactions': []
                }
            
            result = {
                'total_interest_paid': 0.0,
                'eligible_deduction': 0.0,
                'transactions': []
            }
            
            edu_keywords = ['education loan', 'student loan', 'loan interest', 'education interest']
            
            # Search for education loan interest
            for idx, row in transactions_df.iterrows():
                description = str(row.get('description', '')).lower()
                amount = float(row.get('amount', 0))
                
                if any(keyword in description for keyword in edu_keywords):
                    if amount <= 0:  # Only debit transactions
                        amount = abs(amount)
                    else:
                        continue
                    
                    result['total_interest_paid'] += amount
                    result['transactions'].append({
                        'date': str(row.get('date', '')),
                        'description': row.get('description', ''),
                        'amount': amount
                    })
            
            # Under 80E, full interest is deductible (no limit)
            result['eligible_deduction'] = result['total_interest_paid']
            
            logger.info(f"Section 80E Analysis: TotalInterest={result['total_interest_paid']}, EligibleDeduction={result['eligible_deduction']}")
            return result
        
        except Exception as e:
            logger.error(f"Error detecting 80E interest: {str(e)}")
            raise TaxCalculationError(f"Failed to analyze 80E deductions: {str(e)}")
    
    @staticmethod
    def generate_comprehensive_report(transactions_df, basic_salary=None):
        """
        Generate comprehensive tax analysis report
        
        Args:
            transactions_df: DataFrame with all transactions
            basic_salary: Monthly basic salary (optional)
        
        Returns:
            Structured JSON summary with all tax analysis
        """
        try:
            logger.info("Generating comprehensive tax analysis report")
            
            # Analyze each section
            section_80c = TaxAnalyzer.detect_80c_investments(transactions_df)
            section_80d = TaxAnalyzer.detect_80d_insurance(transactions_df)
            hra = TaxAnalyzer.detect_hra_rent(transactions_df, basic_salary)
            section_80g = TaxAnalyzer.detect_80g_donations(transactions_df)
            section_80e = TaxAnalyzer.detect_education_loan_interest(transactions_df)
            
            # Calculate total deductions
            total_deductions = (
                section_80c['eligible_amount'] +
                section_80d['eligible_amount'] +
                hra['eligible_amount'] +
                section_80g['eligible_deduction'] +
                section_80e['eligible_deduction']
            )
            
            # Calculate potential tax savings (assuming 30% tax slab)
            potential_tax_savings = total_deductions * 0.30
            
            # Generate recommendations
            recommendations = TaxAnalyzer._generate_recommendations(
                section_80c, section_80d, hra, section_80g, section_80e
            )
            
            report = {
                'report_date': datetime.now().isoformat(),
                'summary': {
                    'total_deductions_identified': total_deductions,
                    'potential_tax_savings': round(potential_tax_savings, 2),
                    'tax_savings_percentage': 30,  # Assumed tax rate
                    'total_deductions_limit': TaxAnalyzer.SECTION_80C['limit'] + TaxAnalyzer.SECTION_80D['limit'],
                    'utilization_percentage': (
                        (section_80c['eligible_amount'] / TaxAnalyzer.SECTION_80C['limit'] * 100) +
                        (section_80d['eligible_amount'] / TaxAnalyzer.SECTION_80D['limit'] * 100)
                    ) / 2 if TaxAnalyzer.SECTION_80C['limit'] and TaxAnalyzer.SECTION_80D['limit'] else 0
                },
                'detailed_analysis': {
                    'section_80c': section_80c,
                    'section_80d': section_80d,
                    'hra': hra,
                    'section_80g': section_80g,
                    'section_80e': section_80e
                },
                'recommendations': recommendations,
                'important_notes': [
                    'This analysis is based on transaction descriptions and may not capture all deductions',
                    'Verify all deductions with supporting documents before filing income tax return',
                    'Actual deductions allowed may vary based on income level and other factors',
                    'Consult with a tax professional for final income tax planning',
                    'Keep original receipts and policy documents for all claimed deductions'
                ]
            }
            
            logger.info("Comprehensive tax report generated successfully")
            return report
        
        except Exception as e:
            logger.error(f"Error generating comprehensive report: {str(e)}")
            raise TaxCalculationError(f"Failed to generate tax report: {str(e)}")
    
    @staticmethod
    def _generate_recommendations(section_80c, section_80d, hra, section_80g, section_80e):
        """
        Generate personalized tax optimization recommendations
        
        Args:
            section_80c: 80C analysis result
            section_80d: 80D analysis result
            hra: HRA analysis result
            section_80g: 80G analysis result
            section_80e: 80E analysis result
        
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # 80C recommendations
        if section_80c['remaining'] > 0:
            recommendations.append({
                'section': '80C',
                'priority': 'high',
                'title': 'Maximize Section 80C Investments',
                'description': f'You have Rs. {section_80c["remaining"]:,.0f} remaining in 80C limit. '
                             f'Consider investing in PPF, ELSS, or life insurance before year-end.',
                'potential_saving': section_80c['remaining'] * 0.30
            })
        
        if section_80c['eligible_amount'] == 0:
            recommendations.append({
                'section': '80C',
                'priority': 'high',
                'title': 'Start 80C Investments',
                'description': 'No 80C investments detected. Start with PPF (minimum Rs. 500/year) '
                             'or ELSS mutual funds for tax savings.',
                'potential_saving': 150000 * 0.30
            })
        
        # 80D recommendations
        if section_80d['remaining'] > 0:
            recommendations.append({
                'section': '80D',
                'priority': 'high',
                'title': 'Optimize Health Insurance Coverage',
                'description': f'You have Rs. {section_80d["remaining"]:,.0f} remaining in 80D limit. '
                             f'Consider comprehensive family health insurance policies.',
                'potential_saving': section_80d['remaining'] * 0.30
            })
        
        if section_80d['eligible_amount'] == 0:
            recommendations.append({
                'section': '80D',
                'priority': 'medium',
                'title': 'Get Health Insurance',
                'description': 'No medical insurance premiums found. Get a comprehensive health insurance '
                             'policy and claim deduction under 80D.',
                'potential_saving': 100000 * 0.30
            })
        
        # HRA recommendations
        if hra['total_rent_paid'] == 0:
            recommendations.append({
                'section': 'HRA',
                'priority': 'high',
                'title': 'Document and Claim HRA',
                'description': 'If you pay rent, ensure rent agreement and landlord details are documented. '
                             'HRA is not claimed. Get receipt from landlord and claim deduction.',
                'potential_saving': 'Variable (up to 50% of salary)'
            })
        elif hra['total_rent_paid'] > 0 and hra['eligible_amount'] < hra['total_rent_paid']:
            recommendations.append({
                'section': 'HRA',
                'priority': 'medium',
                'title': 'Optimize HRA Claim',
                'description': f'Current eligible HRA: Rs. {hra["eligible_amount"]:,.0f}. '
                             f'Ensure all rent payments are documented monthly.',
                'potential_saving': (hra['total_rent_paid'] - hra['eligible_amount']) * 0.30
            })
        
        # 80G recommendations
        if section_80g['total_donated'] == 0:
            recommendations.append({
                'section': '80G',
                'priority': 'low',
                'title': 'Consider Charitable Donations',
                'description': 'If you donate to eligible organizations, ensure they have 80G certification. '
                             'You can claim 50-100% deduction.',
                'potential_saving': 'Variable'
            })
        
        # 80E recommendations
        if section_80e['eligible_deduction'] > 0:
            recommendations.append({
                'section': '80E',
                'priority': 'high',
                'title': 'Claim Education Loan Interest',
                'description': f'You have paid Rs. {section_80e["total_interest_paid"]:,.0f} as education loan interest. '
                             f'Claim full deduction under Section 80E.',
                'potential_saving': section_80e['eligible_deduction'] * 0.30
            })
        
        return recommendations
    
    @staticmethod
    def validate_against_limits(deductions_dict):
        """
        Validate deductions against legal limits
        
        Args:
            deductions_dict: Dictionary with section-wise deductions
        
        Returns:
            Validation report with warnings/errors
        """
        try:
            validation_report = {
                'is_valid': True,
                'warnings': [],
                'errors': [],
                'adjustments': {}
            }
            
            # Check 80C limit
            if 'section_80c' in deductions_dict:
                if deductions_dict['section_80c'] > TaxAnalyzer.SECTION_80C['limit']:
                    validation_report['adjustments']['section_80c'] = TaxAnalyzer.SECTION_80C['limit']
                    validation_report['warnings'].append(
                        f"Section 80C deduction exceeds limit. Adjusted to Rs. {TaxAnalyzer.SECTION_80C['limit']:,}"
                    )
            
            # Check 80D limit
            if 'section_80d' in deductions_dict:
                if deductions_dict['section_80d'] > TaxAnalyzer.SECTION_80D['limit']:
                    validation_report['adjustments']['section_80d'] = TaxAnalyzer.SECTION_80D['limit']
                    validation_report['warnings'].append(
                        f"Section 80D deduction exceeds limit. Adjusted to Rs. {TaxAnalyzer.SECTION_80D['limit']:,}"
                    )
            
            logger.info(f"Validation report generated. Is valid: {validation_report['is_valid']}")
            return validation_report
        
        except Exception as e:
            logger.error(f"Error validating deductions: {str(e)}")
            raise TaxCalculationError(f"Failed to validate deductions: {str(e)}")
