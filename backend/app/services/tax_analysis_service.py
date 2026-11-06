from bson.objectid import ObjectId
from datetime import datetime
import pandas as pd
from app.db import get_database
from app.models import TaxAnalysis
from app.services.tax_calculator_service import TaxCalculatorService
from app.services.tax_analyzer import TaxAnalyzer
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class TaxAnalysisService:
    @staticmethod
    def analyze_taxes(
        user_id: str,
        financial_year: str = '2024-25',
        gross_income: float = 0.0,
        salary_profile: dict = None,
        section_80d_profile: dict = None,
        selected_regime: str = 'OLD'
    ):
        try:
            user_oid = ObjectId(user_id)
        except:
            raise ValidationError('Invalid user ID')

        db = get_database()
        user = db.db.users.find_one({'_id': user_oid})
        if not user:
            raise NotFoundError('User not found')

        # Fetch user transactions
        transactions_cursor = db.db.transactions.find({'user_id': user_oid})
        transactions_list = list(transactions_cursor)

        data_list = []
        for trans in transactions_list:
            data_list.append({
                'date': trans['date'],
                'description': trans['description'],
                'amount': trans['amount'],
                'category': trans.get('category', 'OTHER'),
                'transaction_type': trans.get('transaction_type', 'DEBIT')
            })

        df = pd.DataFrame(data_list)
        tax_report = TaxCalculatorService.generate_tax_report(
            df=df,
            gross_income=gross_income,
            salary_profile=salary_profile,
            section_80d_profile=section_80d_profile,
            financial_year=financial_year,
            selected_regime=selected_regime
        )
        
        # Get recommendations
        analyzer_report = TaxAnalyzer.generate_comprehensive_report(df, tax_report['gross_income'])
        recommendations = analyzer_report.get('recommendations', [])

        # Store analysis
        analysis_doc = TaxAnalysis.create_analysis_document(
            user_id=user_oid,
            financial_year=financial_year,
            transactions=transactions_list,
            recommendations=recommendations
        )

        analysis_doc.update({
            'total_income': tax_report['gross_income'],
            'deductible_amount': tax_report['total_deductions'],
            'taxable_income': tax_report['taxable_income'],
            'estimated_tax': tax_report['tax_liability']['total_tax'],
            'section_80c_eligible': tax_report['deductions']['section_80c']['utilized'] if isinstance(tax_report['deductions']['section_80c'], dict) else 0.0,
            'section_80d_eligible': tax_report['deductions']['section_80d'].get('total_eligible_80d', tax_report['deductions']['section_80d'].get('utilized', 0.0)) if isinstance(tax_report['deductions']['section_80d'], dict) else 0.0,
            'hra_eligible': tax_report['deductions']['hra']['eligible_amount'] if isinstance(tax_report['deductions']['hra'], dict) else 0.0,
            'donation_eligible': tax_report['deductions']['donation']['permitted_deduction'] if isinstance(tax_report['deductions']['donation'], dict) else 0.0,
            'breakdown': tax_report.get('breakdown', {}),
            'efficiency_score': tax_report.get('efficiency_score', 0.0),
            'recommended_regime': tax_report.get('tax_liability', {}).get('recommended', 'OLD'),
            'salary_profile': salary_profile,
            'section_80d_profile': section_80d_profile,
            'selected_regime': selected_regime
        })

        analysis_result = db.db.tax_analysis.insert_one(analysis_doc)
        logger.info(f"Tax analysis generated for user: {user_id}")

        tax_report['analysis_id'] = str(analysis_result.inserted_id)
        tax_report['financial_year'] = financial_year
        tax_report['user_id'] = user_id

        return tax_report

    @staticmethod
    def get_tax_summary(user_id: str):
        try:
            user_oid = ObjectId(user_id)
        except:
            raise ValidationError('Invalid user ID')

        db = get_database()
        user = db.db.users.find_one({'_id': user_oid})
        if not user:
            raise NotFoundError('User not found')

        latest_analysis = db.db.tax_analysis.find_one(
            {'user_id': user_oid},
            sort=[('created_at', -1)]
        )

        transactions = list(db.db.transactions.find({'user_id': user_oid}))
        total_credits = sum(t['amount'] for t in transactions if t['amount'] > 0)
        total_debits = sum(abs(t['amount']) for t in transactions if t['amount'] < 0)

        summary = {
            'user_id': user_id,
            'transactions_count': len(transactions),
            'total_income': total_credits,
            'total_expenses': total_debits,
            'net_amount': total_credits - total_debits
        }

        if latest_analysis:
            summary['latest_analysis'] = {
                'analysis_id': str(latest_analysis['_id']),
                'financial_year': latest_analysis.get('financial_year', 'N/A'),
                'taxable_income': latest_analysis.get('taxable_income', 0),
                'estimated_tax': latest_analysis.get('estimated_tax', 0),
                'deductible_amount': latest_analysis.get('deductible_amount', 0),
                'created_at': latest_analysis.get('created_at', {}).isoformat() if hasattr(latest_analysis.get('created_at', {}), 'isoformat') else str(latest_analysis.get('created_at', ''))
            }

        return summary

    @staticmethod
    def get_tax_analysis(analysis_id: str):
        try:
            analysis_oid = ObjectId(analysis_id)
        except:
            raise ValidationError('Invalid analysis ID')

        db = get_database()
        analysis = db.db.tax_analysis.find_one({'_id': analysis_oid})
        if not analysis:
            raise NotFoundError('Tax analysis not found')

        analysis['_id'] = str(analysis['_id'])
        analysis['user_id'] = str(analysis['user_id'])
        return analysis

    @staticmethod
    def get_user_analyses(user_id: str, limit: int = 10, skip: int = 0):
        try:
            user_oid = ObjectId(user_id)
        except:
            raise ValidationError('Invalid user ID')

        db = get_database()
        analyses = list(
            db.db.tax_analysis.find({'user_id': user_oid})
            .sort('created_at', -1)
            .limit(limit)
            .skip(skip)
        )

        for analysis in analyses:
            analysis['_id'] = str(analysis['_id'])
            analysis['user_id'] = str(analysis['user_id'])

        return {
            'total': len(analyses),
            'analyses': analyses
        }

    @staticmethod
    def generate_pdf_report(analysis_id: str):
        try:
            analysis_oid = ObjectId(analysis_id)
        except:
            raise ValidationError('Invalid analysis ID')

        db = get_database()
        analysis = db.db.tax_analysis.find_one({'_id': analysis_oid})
        if not analysis:
            raise NotFoundError('Tax analysis not found')

        user = db.db.users.find_one({'_id': analysis['user_id']})
        user_name = user.get('name', 'User') if user else 'User'

        from app.services.pdf_report_service import PDFReportService
        pdf_buffer = PDFReportService.generate_report(analysis, user_name)
        filename = f"Tax_Report_{analysis.get('financial_year', 'Current')}.pdf"

        return pdf_buffer, filename
