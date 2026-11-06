from flask import Blueprint, request, current_app
from app.utils.response import success_response, error_response
from app.utils.errors import ValidationError
from app.services.llm_service import LLMService
from app.services.tax_analysis_service import TaxAnalysisService
from app.db import get_database

bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@bp.route('', methods=['POST'])
def chat():
    """Endpoint for AI Chatbot interactions."""
    data = request.get_json()
    if not data:
        raise ValidationError('No JSON data provided')

    message = data.get('message')
    if not message:
        raise ValidationError('Message is required')

    history = data.get('history', [])
    user_id = data.get('user_id')

    # Build context from previous tax analysis if user_id is provided
    context = {}
    if user_id:
        try:
            summary = TaxAnalysisService.get_tax_summary(user_id)
            if summary:
                latest = summary.get('latest_analysis', {})
                context = {
                    'gross_income': summary.get('total_income', 0),
                    'taxable_income': latest.get('taxable_income', 0),
                    'total_deductions': latest.get('deductible_amount', 0),
                    'recommended_regime': latest.get('recommended_regime', 'N/A'),
                    'tax_payable': latest.get('estimated_tax', 0),
                    'financial_year': latest.get('financial_year', '2024-25'),
                }
        except Exception:
            # If no analysis exists or error occurs, proceed with empty context
            pass

    llm = LLMService(current_app.config.get('OPENAI_API_KEY'), current_app.config.get('OPENAI_MODEL'))
    bot_reply = llm.chat(message=message, context=context, history=history)

    return success_response(
        message='Chat successful',
        data={'reply': bot_reply}
    )
