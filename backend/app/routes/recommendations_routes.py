"""
Recommendations Routes
AI-powered financial recommendations
"""
from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from app.db import get_database
from app.services import TaxCalculatorService, LLMService
from app.utils import NotFoundError
from app.utils.logger import setup_logger
import pandas as pd

bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')
logger = setup_logger(__name__)

@bp.route('/recommend', methods=['POST'])
def recommend():
    """
    Get AI-powered financial recommendations for a user
    
    JSON Request Body:
        - user_id: User ID (required)
        - analysis_id: Specific analysis to base recommendations on (optional)
    
    Returns:
        JSON with personalized recommendations (structured)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body must be JSON',
                'status': 'FAILED'
            }), 400
        
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User ID is required',
                'status': 'FAILED'
            }), 400
        
        try:
            user_oid = ObjectId(user_id)
        except:
            return jsonify({
                'success': False,
                'error': 'Invalid user ID',
                'status': 'FAILED'
            }), 400
        
        # Fetch tax analysis
        analysis_id = data.get('analysis_id')
        if analysis_id:
            try:
                analysis_oid = ObjectId(analysis_id)
                db = get_database()
                analysis = db.db.tax_analysis.find_one({'_id': analysis_oid})
            except:
                return jsonify({
                    'success': False,
                    'error': 'Invalid analysis ID',
                    'status': 'FAILED'
                }), 400
        else:
            db = get_database()
            analysis = db.db.tax_analysis.find_one(
                {'user_id': user_oid},
                sort=[('created_at', -1)]
            )
        
        if not analysis:
            return jsonify({
                'success': False,
                'error': 'No tax analysis found',
                'suggestion': 'Please upload and analyze transactions first',
                'status': 'FAILED'
            }), 400
        
        # Prepare summarized tax_report for LLM (no raw transactions)
        tax_report = {
            'deductions': {
                'section_80c': {
                    'utilized': analysis.get('section_80c_eligible', 0),
                    'limit': 150000
                },
                'section_80d': {
                    'utilized': analysis.get('section_80d_eligible', 0),
                    'limit': 100000
                },
                'hra': {
                    'eligible_amount': analysis.get('hra_eligible', 0)
                },
                'donation': {
                    'permitted_deduction': analysis.get('donation_eligible', 0)
                }
            },
            'summary': {
                'gross_income': analysis.get('total_income', 0),
                'taxable_income': analysis.get('taxable_income', 0),
                'tax_payable': analysis.get('estimated_tax', 0)
            }
        }

        try:
            llm = LLMService(current_app.config.get('OPENAI_API_KEY'), current_app.config.get('OPENAI_MODEL'))
            recommendations = llm.generate_tax_recommendations(tax_report)
            return jsonify({
                'success': True,
                'status': 'COMPLETED',
                'analysis_id': str(analysis['_id']),
                'user_id': user_id,
                'recommendations': recommendations
            }), 200
        except Exception as e:
            logger.error(f"Error generating AI recommendations: {str(e)}")
            fallback_recs = get_fallback_recommendations(analysis)
            return jsonify({
                'success': True,
                'status': 'COMPLETED',
                'analysis_id': str(analysis['_id']),
                'user_id': user_id,
                'recommendations': fallback_recs,
                'note': 'AI service unavailable, using fallback recommendations'
            }), 200
    
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get recommendations',
            'status': 'FAILED'
        }), 500

@bp.route('/tax-optimization/<user_id>', methods=['GET'])
def get_tax_optimization_recommendations(user_id):
    """
    Get AI-powered tax optimization recommendations for a user
    
    Query Parameters:
        - analysis_id: Specific analysis to base recommendations on (optional)
    
    Returns:
        List of personalized tax optimization recommendations
    """
    try:
        try:
            user_oid = ObjectId(user_id)
        except:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Fetch latest tax analysis
        analysis_id = request.args.get('analysis_id')
        if analysis_id:
            try:
                analysis_oid = ObjectId(analysis_id)
                db = get_database()
                analysis = db.db.tax_analysis.find_one({'_id': analysis_oid})
            except:
                return jsonify({'error': 'Invalid analysis ID'}), 400
        else:
            db = get_database()
            analysis = db.db.tax_analysis.find_one(
                {'user_id': user_oid},
                sort=[('created_at', -1)]
            )
        
        if not analysis:
            return jsonify({
                'error': 'No tax analysis found',
                'suggestion': 'Please upload and analyze transactions first'
            }), 400
        
        # Prepare summarized tax_report for LLM (no raw transactions)
        tax_report = {
            'deductions': {
                'section_80c': {
                    'utilized': analysis.get('section_80c_eligible', 0),
                    'limit': 150000
                },
                'section_80d': {
                    'utilized': analysis.get('section_80d_eligible', 0),
                    'limit': 100000
                },
                'hra': {
                    'eligible_amount': analysis.get('hra_eligible', 0)
                },
                'donation': {
                    'permitted_deduction': analysis.get('donation_eligible', 0)
                }
            },
            'summary': {
                'gross_income': analysis.get('total_income', 0),
                'taxable_income': analysis.get('taxable_income', 0),
                'tax_payable': analysis.get('estimated_tax', 0)
            }
        }

        try:
            llm = LLMService(current_app.config.get('OPENAI_API_KEY'), current_app.config.get('OPENAI_MODEL'))
            recommendations = llm.generate_tax_recommendations(tax_report)
            return jsonify({
                'analysis_id': str(analysis['_id']),
                'recommendations': recommendations
            }), 200
        except Exception as e:
            logger.error(f"Error generating AI recommendations: {str(e)}")
            return jsonify({
                'error': 'Failed to generate AI recommendations',
                'recommendations': get_fallback_recommendations(analysis)
            }), 200
    
    except NotFoundError as e:
        return jsonify({'error': e.message}), e.status_code
    except Exception as e:
        logger.error(f"Error fetching recommendations: {str(e)}")
        return jsonify({'error': 'Failed to fetch recommendations'}), 500

def get_fallback_recommendations(analysis):
    """
    Generate basic recommendations when AI is not available
    
    Args:
        analysis: Tax analysis document
    
    Returns:
        List of basic recommendations
    """
    recommendations = []
    
    # Section 80C recommendations
    section_80c = analysis.get('section_80c_eligible', 0)
    if section_80c < 150000:
        remaining = 150000 - section_80c
        recommendations.append({
            'title': 'Maximize Section 80C Deductions',
            'description': f'You have Rs. {remaining:,.0f} remaining in 80C limit. Consider investing in PPF, ELSS, or Life Insurance.',
            'priority': 'high',
            'category': '80C',
            'savings_potential': remaining
        })
    
    # Section 80D recommendations
    section_80d = analysis.get('section_80d_eligible', 0)
    if section_80d < 100000:
        remaining = 100000 - section_80d
        recommendations.append({
            'title': 'Consider Health Insurance Premium',
            'description': f'You have Rs. {remaining:,.0f} remaining in 80D limit. Consider comprehensive health insurance.',
            'priority': 'medium',
            'category': '80D',
            'savings_potential': remaining
        })
    
    # HRA recommendations
    if analysis.get('hra_eligible', 0) == 0:
        recommendations.append({
            'title': 'Document House Rent',
            'description': 'If you pay rent, ensure proper documentation for HRA deduction claims.',
            'priority': 'medium',
            'category': 'HRA'
        })
    
    return recommendations

@bp.route('/financial-insights/<user_id>', methods=['GET'])
def get_financial_insights(user_id):
    """
    Get AI-powered financial insights based on transaction patterns
    
    Returns:
        Financial insights and recommendations
    """
    try:
        try:
            user_oid = ObjectId(user_id)
        except:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Fetch transactions summary only (do not send raw transactions to LLM)
        db = get_database()
        transactions = list(db.db.transactions.find({'user_id': user_oid}))
        if not transactions:
            return jsonify({
                'error': 'No transactions found',
                'insights': []
            }), 200

        # Calculate summary
        total_credits = sum(t['amount'] for t in transactions if t['amount'] > 0)
        total_debits = sum(abs(t['amount']) for t in transactions if t['amount'] < 0)

        summary = {
            'total_credits': total_credits,
            'total_debits': total_debits,
            'net_amount': total_credits - total_debits,
            'total_records': len(transactions)
        }

        try:
            llm = LLMService(current_app.config.get('OPENAI_API_KEY'), current_app.config.get('OPENAI_MODEL'))
            insights = llm.generate_tax_recommendations({'summary_notes': 'Financial insights', **summary})
        except Exception:
            insights = "Unable to generate AI insights at this time."

        return jsonify({
            'insights': insights,
            'summary': summary
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching financial insights: {str(e)}")
        return jsonify({'error': 'Failed to fetch insights'}), 500
