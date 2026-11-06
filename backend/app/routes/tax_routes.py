"""
Tax Analysis Routes
Tax calculation and analysis endpoints
"""
from flask import Blueprint, request, send_file
from app.services.tax_analysis_service import TaxAnalysisService
from app.services.tax_calculator_service import TaxCalculatorService
from app.utils.response import success_response
from app.utils.logger import setup_logger

bp = Blueprint('tax', __name__, url_prefix='/api/tax')
logger = setup_logger(__name__)

@bp.route('/analyze', methods=['POST'])
def analyze():
    """Analyze taxes for a user via POST body"""
    data = request.get_json()
    if not data:
        return success_response(message="Request body must be JSON", status_code=400, success=False, status="FAILED")
    
    user_id = data.get('user_id')
    financial_year = data.get('financial_year', '2024-25')
    gross_income = float(data.get('gross_income', 0))
    salary_profile = data.get('salary_profile')
    section_80d_profile = data.get('section_80d_profile')
    selected_regime = data.get('selected_regime', 'OLD')

    tax_report = TaxAnalysisService.analyze_taxes(
        user_id=user_id,
        financial_year=financial_year,
        gross_income=gross_income,
        salary_profile=salary_profile,
        section_80d_profile=section_80d_profile,
        selected_regime=selected_regime
    )
    return success_response(data=tax_report, status_code=200)

@bp.route('/summary/<user_id>', methods=['GET'])
def get_summary(user_id):
    """Get tax summary for a user"""
    summary = TaxAnalysisService.get_tax_summary(user_id)
    return success_response(data=summary)

@bp.route('/analyze/<user_id>', methods=['GET'])
def analyze_taxes(user_id):
    """Analyze taxes for a user based on their transactions via parameters"""
    financial_year = request.args.get('financial_year', '2024-25')
    gross_income = float(request.args.get('gross_income', 0))
    
    tax_report = TaxAnalysisService.analyze_taxes(user_id, financial_year, gross_income)
    return success_response(data=tax_report)

@bp.route('/analysis/<analysis_id>', methods=['GET'])
def get_tax_analysis(analysis_id):
    """Retrieve a saved tax analysis"""
    analysis = TaxAnalysisService.get_tax_analysis(analysis_id)
    return success_response(data=analysis)

@bp.route('/analysis/<analysis_id>/download', methods=['GET'])
def download_tax_report(analysis_id):
    """Download a PDF tax report for a specific analysis"""
    pdf_buffer, filename = TaxAnalysisService.generate_pdf_report(analysis_id)
    return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name=filename)

@bp.route('/user/<user_id>/analyses', methods=['GET'])
def get_user_analyses(user_id):
    """Get all tax analyses for a user"""
    limit = int(request.args.get('limit', 10))
    skip = int(request.args.get('skip', 0))
    
    analyses = TaxAnalysisService.get_user_analyses(user_id, limit, skip)
    return success_response(data=analyses)

@bp.route('/hra-optimizer', methods=['POST'])
def analyze_hra():
    """Independent HRA optimization endpoint"""
    data = request.get_json()
    if not data:
        return success_response(message="Request body must be JSON", status_code=400, success=False, status="FAILED")
    
    basic_salary = float(data.get('basic_salary', 0))
    hra_received = float(data.get('hra_received', 0))
    rent_paid = float(data.get('rent_paid', 0))
    is_metro = bool(data.get('is_metro', False))

    result = TaxCalculatorService.calculate_hra_exemption(
        basic_salary=basic_salary,
        hra_received=hra_received,
        rent_paid=rent_paid,
        is_metro=is_metro
    )

    return success_response(data=result)

@bp.route('/80d-optimizer', methods=['POST'])
def analyze_80d():
    """Independent Section 80D optimization endpoint"""
    data = request.get_json() or {}
    result = TaxCalculatorService.calculate_section_80d_detailed(
        self_spouse_premium=float(data.get('self_spouse_insurance', 0)),
        children_premium=float(data.get('children_insurance', 0)),
        parents_premium=float(data.get('parents_insurance', 0)),
        is_self_senior=bool(data.get('is_self_senior', False)),
        is_parents_senior=bool(data.get('is_parents_senior', False)),
        preventive_checkup=float(data.get('preventive_checkup', 0)),
        self_medical_exp=float(data.get('self_medical_exp', 0)),
        parents_medical_exp=float(data.get('parents_medical_exp', 0)),
        financial_year=data.get('financial_year', '2024-25'),
        regime=data.get('regime', 'OLD')
    )
    return success_response(data=result)

