"""
OpenAI Recommendation Service
Generates personalized financial recommendations using OpenAI API
"""
import openai
from app.utils.errors import OpenAIError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class OpenAIRecommendationService:
    """Service for generating AI-powered financial recommendations"""
    
    def __init__(self, api_key, model='gpt-4'):
        """
        Initialize OpenAI service
        
        Args:
            api_key: OpenAI API key
            model: Model to use (gpt-4 or gpt-3.5-turbo)
        """
        if not api_key:
            raise OpenAIError("OpenAI API key not provided")
        
        openai.api_key = api_key
        self.model = model
    
    def generate_tax_optimization_recommendations(self, tax_report):
        """
        Generate tax optimization recommendations based on tax report
        
        Args:
            tax_report: Dictionary with tax analysis data
        
        Returns:
            List of recommendations
        """
        try:
            deductions = tax_report.get('deductions', {})
            
            prompt = self._build_tax_recommendation_prompt(tax_report)
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a knowledgeable Indian tax advisor providing specific, actionable tax optimization recommendations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1024
            )
            
            recommendations_text = response['choices'][0]['message']['content']
            recommendations = self._parse_recommendations(recommendations_text)
            
            logger.info("Generated AI recommendations successfully")
            return recommendations
        
        except openai.error.AuthenticationError:
            logger.error("OpenAI authentication failed")
            raise OpenAIError("Invalid OpenAI API key")
        except openai.error.RateLimitError:
            logger.error("OpenAI rate limit exceeded")
            raise OpenAIError("OpenAI API rate limit exceeded")
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            raise OpenAIError(f"Failed to generate recommendations: {str(e)}")
    
    def _build_tax_recommendation_prompt(self, tax_report):
        """Build prompt for tax recommendations"""
        deductions = tax_report.get('deductions', {})
        summary = tax_report.get('summary', {})
        
        prompt = f"""
Based on the following tax analysis for an Indian taxpayer, provide specific, actionable tax optimization recommendations:

Gross Income: Rs. {summary.get('gross_income', 0):,.0f}
Taxable Income: Rs. {summary.get('taxable_income', 0):,.0f}
Estimated Tax Payable: Rs. {summary.get('tax_payable', 0):,.0f}

Current Deductions:
- Section 80C (Life Insurance, PPF, ELSS): Rs. {deductions.get('section_80c', {}).get('utilized', 0):,.0f} / Rs. 150,000
- Section 80D (Medical Insurance): Rs. {deductions.get('section_80d', {}).get('utilized', 0):,.0f} / Rs. 100,000
- HRA: Rs. {deductions.get('hra', {}).get('eligible_amount', 0):,.0f}
- Donations (80G): Rs. {deductions.get('donation', {}).get('permitted_deduction', 0):,.0f}

Please provide:
1. Specific areas where they can optimize their tax deductions
2. Investment strategies to maximize 80C deductions
3. Healthcare investment strategies for 80D
4. Any other tax-saving opportunities under Indian Income Tax Act
5. Recommendations should be specific and actionable
"""
        return prompt
    
    def _parse_recommendations(self, recommendations_text):
        """Parse recommendations from OpenAI response"""
        # Simple parsing - in production, use more sophisticated parsing
        recommendations = []
        lines = recommendations_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                recommendations.append({
                    'title': line[:100],
                    'description': line,
                    'priority': 'medium',
                    'category': self._categorize_recommendation(line)
                })
        
        return recommendations
    
    def _categorize_recommendation(self, text):
        """Categorize recommendation"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['80c', 'insurance', 'ppf', 'nps', 'elss']):
            return '80C'
        elif any(word in text_lower for word in ['80d', 'medical', 'health', 'insurance']):
            return '80D'
        elif any(word in text_lower for word in ['hra', 'rent', 'house']):
            return 'HRA'
        elif any(word in text_lower for word in ['donate', 'charity', '80g']):
            return '80G'
        else:
            return 'OTHER'
    
    def generate_financial_insights(self, transactions, account_summary):
        """
        Generate general financial insights from transaction data
        
        Args:
            transactions: Transaction data
            account_summary: Account summary statistics
        
        Returns:
            String with financial insights
        """
        try:
            prompt = f"""
Analyze the following financial transaction summary and provide brief, actionable financial insights:

Total Credits: Rs. {account_summary.get('total_credits', 0):,.0f}
Total Debits: Rs. {account_summary.get('total_debits', 0):,.0f}
Net Amount: Rs. {account_summary.get('net_amount', 0):,.0f}
Number of Transactions: {account_summary.get('total_records', 0)}

Provide:
1. Brief spending patterns
2. Areas of potential savings
3. Financial health indicators
Keep response concise (2-3 sentences)
"""
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a financial advisor providing brief, actionable insights."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=512
            )
            
            insights = response['choices'][0]['message']['content']
            logger.info("Generated financial insights successfully")
            return insights
        
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return "Unable to generate insights at this time."
