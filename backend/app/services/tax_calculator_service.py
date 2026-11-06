"""
Tax Calculator Service
Calculates Indian tax deductions based on 80C, 80D, HRA, and other sections
"""
import json
from typing import Dict, Any, Optional
import pandas as pd
from datetime import datetime
from app.models import Transaction, TaxAnalysis
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class TaxCalculatorService:
    """Service for calculating precise tax deductions and recommendations"""
    
    STANDARD_DEDUCTION = 50000.0          # Old Regime (unchanged)
    NEW_REGIME_STD_DEDUCTION = 75000.0    # New Regime — Budget 2024 increase
    MAX_80C = 150000.0
    MAX_80D = 25000.0

    @staticmethod
    def calculate_hra_exemption(basic_salary: float, hra_received: float, rent_paid: float, is_metro: bool = False) -> Dict[str, Any]:
        """
        Calculate HRA Exemption based on Indian Tax Rules (Section 10(13A)).
        Exemption is the least of:
        1. Actual HRA received
        2. 50% of Basic Salary (Metro) or 40% of Basic Salary (Non-Metro)
        3. Actual Rent Paid minus 10% of Basic Salary
        """
        val_basic = max(0.0, float(basic_salary or 0))
        val_hra = max(0.0, float(hra_received or 0))
        val_rent = max(0.0, float(rent_paid or 0))

        percentage = 0.50 if is_metro else 0.40
        val_basic_pct = val_basic * percentage
        val_rent_minus = max(0.0, val_rent - (val_basic * 0.10))

        if val_basic <= 0 or val_hra <= 0 or val_rent <= 0:
            return {
                "annual_basic": round(val_basic, 2),
                "annual_hra": round(val_hra, 2),
                "annual_rent": round(val_rent, 2),
                "is_metro": is_metro,
                "exemption": 0.0,
                "remaining_taxable_hra": round(val_hra, 2),
                "rule_applied": "Inputs required (Basic, HRA, and Rent must be > 0)",
                "breakdown": {
                    "actual_hra": round(val_hra, 2),
                    "rent_minus_10pct_basic": round(val_rent_minus, 2),
                    "percentage_of_basic": round(val_basic_pct, 2)
                }
            }

        exemption = max(0.0, min(val_hra, val_basic_pct, val_rent_minus))

        if exemption == val_hra:
            rule_applied = "Rule 1: Actual HRA Received"
        elif exemption == val_basic_pct:
            rule_applied = f"Rule 2: {int(percentage*100)}% of Annual Basic Salary"
        else:
            rule_applied = "Rule 3: Rent Paid minus 10% of Basic Salary"

        remaining_taxable_hra = max(0.0, val_hra - exemption)

        return {
            "annual_basic": round(val_basic, 2),
            "annual_hra": round(val_hra, 2),
            "annual_rent": round(val_rent, 2),
            "is_metro": is_metro,
            "exemption": round(exemption, 2),
            "remaining_taxable_hra": round(remaining_taxable_hra, 2),
            "rule_applied": rule_applied,
            "breakdown": {
                "actual_hra": round(val_hra, 2),
                "rent_minus_10pct_basic": round(val_rent_minus, 2),
                "percentage_of_basic": round(val_basic_pct, 2)
            }
        }

    @staticmethod
    def calculate_section_80d_detailed(
        self_spouse_premium: float = 0.0,
        children_premium: float = 0.0,
        parents_premium: float = 0.0,
        is_self_senior: bool = False,
        is_parents_senior: bool = False,
        preventive_checkup: float = 0.0,
        self_medical_exp: float = 0.0,
        parents_medical_exp: float = 0.0,
        financial_year: str = '2024-25',
        regime: str = 'OLD'
    ) -> Dict[str, Any]:
        """
        Calculate Section 80D with senior citizen rules, preventive sublimits, and regime eligibility.
        """
        self_limit = 50000.0 if is_self_senior else 25000.0
        parents_limit = 50000.0 if is_parents_senior else 25000.0
        preventive_sublimit = 5000.0

        self_spouse = max(0.0, float(self_spouse_premium or 0))
        children = max(0.0, float(children_premium or 0))
        parents = max(0.0, float(parents_premium or 0))
        preventive = max(0.0, float(preventive_checkup or 0))
        self_med = max(0.0, float(self_medical_exp or 0)) if is_self_senior else 0.0
        parents_med = max(0.0, float(parents_medical_exp or 0)) if is_parents_senior else 0.0

        raw_self_family = self_spouse + children + self_med
        raw_parents = parents + parents_med
        total_claimed = raw_self_family + raw_parents + preventive

        if regime.upper() == 'NEW':
            return {
                'financial_year': financial_year,
                'regime': 'NEW',
                'is_allowed_under_regime': False,
                'self_family_limit': self_limit,
                'parents_limit': parents_limit,
                'preventive_sublimit': preventive_sublimit,
                'self_family_claimed': round(raw_self_family, 2),
                'parents_claimed': round(raw_parents, 2),
                'preventive_claimed': round(preventive, 2),
                'eligible_self_family': 0.0,
                'eligible_parents': 0.0,
                'total_eligible_80d': 0.0,
                'total_claimed_80d': round(total_claimed, 2),
                'disallowed_amount': round(total_claimed, 2),
                'preventive_deduction_used': 0.0,
                'explanation': 'Section 80D is NOT permitted under the New Tax Regime (Section 115BAC).'
            }

        allowed_preventive = min(preventive, preventive_sublimit)
        self_headroom = max(0.0, self_limit - raw_self_family)
        self_prev_used = min(allowed_preventive, self_headroom)

        rem_preventive = allowed_preventive - self_prev_used
        parents_headroom = max(0.0, parents_limit - raw_parents)
        parents_prev_used = min(rem_preventive, parents_headroom)

        total_prev_used = self_prev_used + parents_prev_used
        eligible_self = min(self_limit, raw_self_family + self_prev_used)
        eligible_parents = min(parents_limit, raw_parents + parents_prev_used)
        total_eligible = eligible_self + eligible_parents
        disallowed = max(0.0, total_claimed - total_eligible)

        explanation = f"Self & Family: ₹{eligible_self:,.0f} (limit ₹{self_limit:,.0f}). Parents: ₹{eligible_parents:,.0f} (limit ₹{parents_limit:,.0f})."
        if preventive > 0:
            explanation += f" Preventive check-up claim of ₹{preventive:,.0f} capped at ₹{total_prev_used:,.0f} within category limits."
        if disallowed > 0:
            explanation += f" Disallowed amount: ₹{disallowed:,.0f}."

        return {
            'financial_year': financial_year,
            'regime': 'OLD',
            'is_allowed_under_regime': True,
            'self_family_limit': self_limit,
            'parents_limit': parents_limit,
            'preventive_sublimit': preventive_sublimit,
            'self_family_claimed': round(raw_self_family, 2),
            'parents_claimed': round(raw_parents, 2),
            'preventive_claimed': round(preventive, 2),
            'eligible_self_family': round(eligible_self, 2),
            'eligible_parents': round(eligible_parents, 2),
            'total_eligible_80d': round(total_eligible, 2),
            'total_claimed_80d': round(total_claimed, 2),
            'disallowed_amount': round(disallowed, 2),
            'preventive_deduction_used': round(total_prev_used, 2),
            'explanation': explanation
        }
    
    @staticmethod
    def calculate_section_80c_deduction(df: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate Section 80C deduction (Life Insurance, PPF, ELSS, etc.)
        Maximum limit: Rs. 1,50,000
        """
        try:
            section_80c_df = df[df['category'].isin(['INVESTMENT_80C'])]
            eligible_amount = abs(section_80c_df[section_80c_df['amount'] < 0]['amount'].sum())
            limit = TaxCalculatorService.MAX_80C
            
            utilized = min(eligible_amount, limit)
            percentage = (utilized / limit * 100) if limit > 0 else 0.0
            
            logger.info(f"Section 80C: Eligible={eligible_amount}, Utilized={utilized}")
            return {
                'eligible_amount': float(eligible_amount),
                'limit': limit,
                'utilized': float(utilized),
                'percentage': float(percentage),
                'remaining': float(max(0.0, limit - utilized))
            }
        except Exception as e:
            logger.error(f"Error calculating Section 80C: {str(e)}")
            return {'eligible_amount': 0.0, 'limit': TaxCalculatorService.MAX_80C, 'utilized': 0.0, 'percentage': 0.0, 'remaining': TaxCalculatorService.MAX_80C}
    
    @staticmethod
    def calculate_section_80d_deduction(df: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate Section 80D deduction (Medical Insurance Premiums)
        Maximum limit: Rs. 25,000
        """
        try:
            section_80d_df = df[df['category'].isin(['INVESTMENT_80D'])]
            eligible_amount = abs(section_80d_df[section_80d_df['amount'] < 0]['amount'].sum())
            limit = TaxCalculatorService.MAX_80D
            
            utilized = min(eligible_amount, limit)
            percentage = (utilized / limit * 100) if limit > 0 else 0.0
            
            logger.info(f"Section 80D: Eligible={eligible_amount}, Utilized={utilized}")
            return {
                'eligible_amount': float(eligible_amount),
                'limit': limit,
                'utilized': float(utilized),
                'percentage': float(percentage),
                'remaining': float(max(0.0, limit - utilized))
            }
        except Exception as e:
            logger.error(f"Error calculating Section 80D: {str(e)}")
            return {'eligible_amount': 0.0, 'limit': TaxCalculatorService.MAX_80D, 'utilized': 0.0, 'percentage': 0.0, 'remaining': TaxCalculatorService.MAX_80D}
    
    @staticmethod
    def calculate_hra_deduction(df: pd.DataFrame, basic_salary: Optional[float] = None) -> Dict[str, Any]:
        """
        Calculate HRA deduction
        """
        try:
            hra_df = df[df['category'].isin(['HRA'])]
            hra_paid = abs(hra_df[hra_df['amount'] < 0]['amount'].sum())
            
            if basic_salary:
                annual_salary = basic_salary * 12
                limit = annual_salary * 0.5
                eligible = hra_paid - (annual_salary * 0.1)
                utilized = max(0.0, min(eligible, limit))
            else:
                utilized = hra_paid
            
            logger.info(f"HRA: Paid={hra_paid}, Eligible={utilized}")
            return {
                'rent_paid': float(hra_paid),
                'eligible_amount': float(utilized),
                'notes': 'Verify with payslips and rent agreement'
            }
        except Exception as e:
            logger.error(f"Error calculating HRA: {str(e)}")
            return {'rent_paid': 0.0, 'eligible_amount': 0.0, 'notes': 'Error calculating HRA'}
    
    @staticmethod
    def calculate_donation_deduction(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate Section 80G deduction (Donations to eligible organizations)
        """
        try:
            donation_df = df[df['category'].isin(['DONATE'])]
            donation_amount = abs(donation_df[donation_df['amount'] < 0]['amount'].sum())
            
            permitted_deduction = donation_amount * 0.5
            
            logger.info(f"Donations: Amount={donation_amount}, Permitted={permitted_deduction}")
            return {
                'donation_amount': float(donation_amount),
                'permitted_deduction': float(permitted_deduction),
                'notes': 'Verify organizations are eligible under Section 80G'
            }
        except Exception as e:
            logger.error(f"Error calculating donations: {str(e)}")
            return {'donation_amount': 0.0, 'permitted_deduction': 0.0, 'notes': 'Error calculating donations'}
    
    @staticmethod
    def calculate_old_regime_tax(taxable: float) -> float:
        """Calculate tax liability based on explicit old regime slabs"""
        if taxable <= 500000:
            return 0.0 # 87A rebate fully covers tax up to 5L in old regime
            
        tax = 0.0
        if taxable <= 250000:
            tax = 0.0
        elif taxable <= 500000:
            tax = (taxable - 250000) * 0.05
        elif taxable <= 1000000:
            tax = (250000 * 0.05) + ((taxable - 500000) * 0.20)
        else:
            tax = (250000 * 0.05) + (500000 * 0.20) + ((taxable - 1000000) * 0.30)
        
        cess = tax * 0.04
        return tax + cess

    @staticmethod
    def calculate_new_regime_tax(taxable: float) -> float:
        """Calculate tax liability based on explicit new regime slabs (Budget 2024)"""
        if taxable <= 700000:
            return 0.0 # 87A rebate fully covers tax up to 7L in new regime
            
        tax = 0.0
        if taxable <= 300000:
            tax = 0.0
        elif taxable <= 600000:
            tax = (taxable - 300000) * 0.05
        elif taxable <= 900000:
            tax = (300000 * 0.05) + ((taxable - 600000) * 0.10)
        elif taxable <= 1200000:
            tax = (300000 * 0.05) + (300000 * 0.10) + ((taxable - 900000) * 0.15)
        elif taxable <= 1500000:
            tax = (300000 * 0.05) + (300000 * 0.10) + (300000 * 0.15) + ((taxable - 1200000) * 0.20)
        else:
            tax = (300000 * 0.05) + (300000 * 0.10) + (300000 * 0.15) + (300000 * 0.20) + ((taxable - 1500000) * 0.30)
        
        # Marginal relief calculation for incomes slightly above 7L in new regime
        if taxable > 700000 and taxable <= 727777:
            tax_without_relief = tax
            income_above_7l = taxable - 700000
            tax = min(tax_without_relief, income_above_7l)
        
        cess = tax * 0.04
        return tax + cess
    
    @staticmethod
    def generate_tax_report(
        df: pd.DataFrame,
        gross_income: float = 0.0,
        salary_profile: Optional[Dict[str, Any]] = None,
        section_80d_profile: Optional[Dict[str, Any]] = None,
        financial_year: str = '2024-25',
        selected_regime: str = 'OLD'
    ) -> Dict[str, Any]:
        """Generate precise JSON report containing Old vs New comparison, salary, and Section 80D details"""
        try:
            # 1. Salary & Gross Income Processing
            hra_res = None
            if salary_profile:
                annual_basic = float(
                    salary_profile.get('annual_basic') or 
                    salary_profile.get('annualBasic') or 
                    (float(salary_profile.get('monthlyBasic') or salary_profile.get('monthly_basic') or 0) * 12) or 0
                )
                annual_hra = float(
                    salary_profile.get('annual_hra') or 
                    salary_profile.get('annualHRA') or 
                    salary_profile.get('annualHra') or 
                    (float(salary_profile.get('monthlyHRA') or salary_profile.get('monthlyHra') or salary_profile.get('monthly_hra') or 0) * 12) or 0
                )
                annual_rent = float(
                    salary_profile.get('annual_rent') or 
                    salary_profile.get('annualRent') or 
                    (float(salary_profile.get('monthlyRent') or salary_profile.get('monthly_rent') or 0) * 12) or 0
                )
                annual_other = float(
                    salary_profile.get('annual_other_income') or 
                    salary_profile.get('annualOtherIncome') or 0
                )
                is_metro = bool(
                    salary_profile.get('is_metro') if 'is_metro' in salary_profile else salary_profile.get('isMetro', True)
                )

                # Fallback to bank statement HRA / rent transactions if rent not explicitly set
                if annual_rent == 0.0 and not df.empty:
                    df_rent = abs(df[df['category'].isin(['HRA'])][df['amount'] < 0]['amount'].sum())
                    if df_rent > 0:
                        annual_rent = float(df_rent)
                
                calculated_gross = annual_basic + annual_hra + annual_other
                if calculated_gross > 0:
                    gross_income = calculated_gross
                
                hra_res = TaxCalculatorService.calculate_hra_exemption(
                    annual_basic, annual_hra, annual_rent, is_metro
                )
                hra_val = float(hra_res['exemption'])
                ded_hra = {
                    'rent_paid': annual_rent,
                    'eligible_amount': hra_val,
                    'breakdown': hra_res['breakdown'],
                    'remaining_taxable_hra': hra_res['remaining_taxable_hra'],
                    'rule_applied': hra_res['rule_applied']
                }
            else:
                ded_hra = TaxCalculatorService.calculate_hra_deduction(df)
                hra_val = float(ded_hra.get('eligible_amount', 0.0))

            if gross_income == 0.0:
                salary_df = df[df['category'] == 'SALARY']
                gross_income = float(salary_df[salary_df['amount'] > 0]['amount'].sum()) if not df.empty else 0.0
            
            # 2. Section 80C Deduction
            ded_80c = TaxCalculatorService.calculate_section_80c_deduction(df) if not df.empty else {
                'eligible_amount': 0.0, 'limit': TaxCalculatorService.MAX_80C, 'utilized': 0.0, 'percentage': 0.0, 'remaining': TaxCalculatorService.MAX_80C
            }
            d80c_val = float(ded_80c.get('utilized', 0.0))

            # 3. Section 80D Deduction (Detailed vs DF)
            if section_80d_profile:
                self_prem = float(
                    section_80d_profile.get('self_spouse_insurance') or 
                    section_80d_profile.get('selfSpouseInsurance') or 
                    section_80d_profile.get('self_spouse_premium') or 0
                )
                children_prem = float(
                    section_80d_profile.get('children_insurance') or 
                    section_80d_profile.get('childrenInsurance') or 
                    section_80d_profile.get('children_premium') or 0
                )
                parents_prem = float(
                    section_80d_profile.get('parents_insurance') or 
                    section_80d_profile.get('parentsInsurance') or 
                    section_80d_profile.get('parents_premium') or 0
                )
                is_self_senior = bool(
                    section_80d_profile.get('is_self_senior') if 'is_self_senior' in section_80d_profile 
                    else section_80d_profile.get('isSelfSenior', False)
                )
                is_parents_senior = bool(
                    section_80d_profile.get('is_parents_senior') if 'is_parents_senior' in section_80d_profile 
                    else section_80d_profile.get('isParentsSenior', False)
                )
                prev_checkup = float(
                    section_80d_profile.get('preventive_checkup') or 
                    section_80d_profile.get('preventiveCheckup') or 
                    section_80d_profile.get('parentsPreventiveCheckup') or 0
                )
                self_med = float(
                    section_80d_profile.get('self_medical_exp') or 
                    section_80d_profile.get('selfMedicalExp') or 0
                )
                parents_med = float(
                    section_80d_profile.get('parents_medical_exp') or 
                    section_80d_profile.get('parentsMedicalExp') or 0
                )

                # Fallback to bank statement 80D transactions if premiums are 0 in profile
                if self_prem == 0.0 and parents_prem == 0.0 and not df.empty:
                    df_80d = abs(df[df['category'].isin(['INVESTMENT_80D'])][df['amount'] < 0]['amount'].sum())
                    if df_80d > 0:
                        self_prem = float(df_80d)

                ded_80d = TaxCalculatorService.calculate_section_80d_detailed(
                    self_spouse_premium=self_prem,
                    children_premium=children_prem,
                    parents_premium=parents_prem,
                    is_self_senior=is_self_senior,
                    is_parents_senior=is_parents_senior,
                    preventive_checkup=prev_checkup,
                    self_medical_exp=self_med,
                    parents_medical_exp=parents_med,
                    financial_year=financial_year,
                    regime='OLD'
                )
                d80d_val = float(ded_80d.get('total_eligible_80d', 0.0))
            else:
                ded_80d = TaxCalculatorService.calculate_section_80d_deduction(df) if not df.empty else {
                    'eligible_amount': 0.0, 'limit': TaxCalculatorService.MAX_80D, 'utilized': 0.0, 'percentage': 0.0, 'remaining': TaxCalculatorService.MAX_80D
                }
                d80d_val = float(ded_80d.get('utilized', 0.0))

            # 4. Other Deductions (e.g. Donations)
            ded_don = TaxCalculatorService.calculate_donation_deduction(df) if not df.empty else {
                'donation_amount': 0.0, 'permitted_deduction': 0.0
            }
            don_val = float(ded_don.get('permitted_deduction', 0.0))
            
            # Old regime taxable income
            old_std_ded = TaxCalculatorService.STANDARD_DEDUCTION
            old_taxable = gross_income - old_std_ded - d80c_val - d80d_val - hra_val - don_val
            old_taxable = max(0.0, old_taxable)
            
            # New regime (₹75,000 standard deduction — Budget 2024 / FY 2024-25)
            new_std_ded = TaxCalculatorService.NEW_REGIME_STD_DEDUCTION if financial_year != '2023-24' else 50000.0
            new_taxable = max(0.0, gross_income - new_std_ded)
            
            old_tax = TaxCalculatorService.calculate_old_regime_tax(old_taxable)
            new_tax = TaxCalculatorService.calculate_new_regime_tax(new_taxable)
            
            tax_saved  = max(0.0, abs(new_tax - old_tax))
            difference = new_tax - old_tax
            recommended = "OLD" if difference > 0 else "NEW"
            
            # Efficiency Score
            score_80c = min(1.0, d80c_val / TaxCalculatorService.MAX_80C)
            max_80d_limit = float(ded_80d.get('self_family_limit', 25000) + ded_80d.get('parents_limit', 25000)) if section_80d_profile else TaxCalculatorService.MAX_80D
            score_80d = min(1.0, d80d_val / max(1.0, max_80d_limit))
            score_hra = min(1.0, hra_val / max(1.0, float(salary_profile.get('annual_hra', 1.0)))) if salary_profile and salary_profile.get('annual_hra') else 0.8
            efficiency_score = (score_80c * 0.4 + score_80d * 0.4 + score_hra * 0.2) * 100

            # ── TAGGED TRANSACTIONS (Missed Deduction Evidence) ────────────────
            TAX_SECTION_MAP = {
                'INVESTMENT_80C': '80C', 'INVESTMENT_80D': '80D',
                'HRA': 'HRA', 'DONATE': '80G', 'SALARY': 'Income',
                'MEDICAL': '80D (Medical)', 'EDUCATION': '80E',
            }
            tagged_txns = []
            for _, row in df.iterrows():
                section = TAX_SECTION_MAP.get(row.get('category', ''), None)
                if section:
                    tagged_txns.append({
                        'description': str(row.get('description', 'Unknown')),
                        'amount': float(abs(row.get('amount', 0))),
                        'date': str(row.get('date', '')),
                        'category': str(row.get('category', '')),
                        'section': section,
                        'is_debit': float(row.get('amount', 0)) < 0,
                    })

            # ── SPENDING SUMMARY (Behavioral Insights) ────────────────────────
            spend_categories = ['DINING', 'MEDICAL', 'EDUCATION', 'HRA', 'INVESTMENT_80C',
                                 'INVESTMENT_80D', 'DONATE', 'DEDUCTIBLE_EXPENSE']
            spending_summary = {}
            for cat in spend_categories:
                cat_df = df[df['category'] == cat]
                total = float(abs(cat_df[cat_df['amount'] < 0]['amount'].sum()))
                if total > 0:
                    spending_summary[cat] = total

            # ── CONFIDENCE SCORE ──────────────────────────────────────────────
            total_txns = len(df)
            categorized = len(df[df['category'] != 'UNCATEGORIZED']) if 'UNCATEGORIZED' in df['category'].values else len(df)
            classification_rate = (categorized / total_txns * 100) if total_txns > 0 else 0
            data_completeness = 100 if gross_income > 0 else 40
            pattern_score = min(100, (len(tagged_txns) / max(total_txns, 1)) * 200)
            confidence_score = round((classification_rate * 0.5 + data_completeness * 0.3 + pattern_score * 0.2), 1)
            confidence_score = min(97.0, max(55.0, confidence_score))

            # ── RISK FLAGS ────────────────────────────────────────────────────
            risk_flags = []
            if d80d_val == 0:
                risk_flags.append({
                    'level': 'HIGH',
                    'message': 'No Section 80D health insurance detected. You are missing ₹25,000 deduction and are financially unprotected.'
                })
            if d80c_val < TaxCalculatorService.MAX_80C * 0.5:
                risk_flags.append({
                    'level': 'HIGH',
                    'message': f'Less than 50% of 80C utilised (₹{d80c_val:,.0f}/₹1,50,000). You are leaving significant tax savings on the table.'
                })
            dining_total = spending_summary.get('DINING', 0)
            if dining_total > 0 and gross_income > 0 and (dining_total / gross_income) > 0.05:
                risk_flags.append({
                    'level': 'MEDIUM',
                    'message': f'Discretionary dining spend (₹{dining_total:,.0f}) is over 5% of income. Consider redirecting some to tax-saving instruments.'
                })
            if hra_val == 0 and gross_income > 300000:
                risk_flags.append({
                    'level': 'MEDIUM',
                    'message': 'No HRA or rent payments detected. If you pay rent, submit rent receipts to your employer to claim HRA exemption.'
                })
            if don_val == 0:
                risk_flags.append({
                    'level': 'LOW',
                    'message': 'No charitable donations found. Section 80G donations to eligible NGOs can provide up to 100% deduction.'
                })
            risk_flags.append({
                'level': 'INFO',
                'message': 'Ensure all deductions match your Annual Information Statement (AIS) on the Income Tax portal to avoid mismatches.'
            })

            # ── INSIGHTS ──────────────────────────────────────────────────────
            insights = []
            if d80c_val < TaxCalculatorService.MAX_80C:
                missing_80c = TaxCalculatorService.MAX_80C - d80c_val
                insights.append(f"You have ₹{missing_80c:,.0f} remaining under Section 80C. Invest in ELSS/PPF before March 31 to save ₹{missing_80c*0.31:,.0f} in tax.")
            if d80d_val < TaxCalculatorService.MAX_80D:
                insights.append("You are missing out on Section 80D limits. Consider purchasing health insurance to protect your family and save tax.")
            if recommended == "NEW":
                insights.append(f"The New Tax Regime is mathematically better for you, saving ₹{abs(difference):,.0f} compared to the Old Regime since your deductions are relatively low.")
            else:
                insights.append(f"Stick to the Old Tax Regime. Your active investments save you ₹{abs(difference):,.0f} vs the New Regime.")
            if old_tax == 0 and new_tax == 0:
                insights.append("Excellent! Your tax liability is practically zero. Focus on maximizing wealth generation rather than tax saving right now.")
            
            breakdown = {
                "gross_income":       float(gross_income),
                "standard_deduction": float(TaxCalculatorService.STANDARD_DEDUCTION),
                "new_regime_std_deduction": float(TaxCalculatorService.NEW_REGIME_STD_DEDUCTION),
                "80c_deduction":      float(d80c_val),
                "80d_deduction":      float(d80d_val),
                "hra_deduction":      float(hra_val),
                "other_deductions":   float(don_val),
                "old_taxable_income": float(old_taxable),
                "new_taxable_income": float(new_taxable),
                "old_regime_tax":     float(old_tax),
                "new_regime_tax":     float(new_tax),
                "tax_saved":          float(tax_saved),
                "recommended_regime": recommended,
                "efficiency_score":   float(round(efficiency_score, 2)),
                "salary_profile":     salary_profile,
                "section_80d_profile": section_80d_profile,
                "section_80d_detailed": ded_80d if section_80d_profile else None,
                "hra_detailed":       hra_res,
            }
            
            logger.info("\n=== FULL TAX CALCULATION JSON STDOUT ===")
            logger.info(json.dumps(breakdown, indent=2, default=str))
            logger.info("========================================")
            
            return {
                'gross_income':      float(gross_income),
                'standard_deduction':float(TaxCalculatorService.STANDARD_DEDUCTION),
                'salary_profile':    salary_profile,
                'section_80d_profile': section_80d_profile,
                'deductions': {
                    'section_80c': ded_80c,
                    'section_80d': ded_80d,
                    'hra':         ded_hra,
                    'donation':    ded_don
                },
                'total_deductions':  float(d80c_val + d80d_val + hra_val + don_val + TaxCalculatorService.STANDARD_DEDUCTION),
                'taxable_income':    float(old_taxable),
                'tax_liability': {
                    'old_regime_tax': float(old_tax),
                    'new_regime_tax': float(new_tax),
                    'total_tax':      float(old_tax) if recommended == "OLD" else float(new_tax),
                    'tax_saved':      float(tax_saved),
                    'recommended':    recommended,
                    'effective_rate': float(((old_tax if recommended == "OLD" else new_tax) / gross_income * 100) if gross_income > 0 else 0)
                },
                'breakdown':          breakdown,
                'efficiency_score':   float(round(efficiency_score, 2)),
                'tagged_transactions':tagged_txns,
                'spending_summary':   spending_summary,
                'confidence_score':   float(confidence_score),
                'risk_flags':         risk_flags,
                'summary': {
                    'gross_income':       float(gross_income),
                    'taxable_income':     float(old_taxable),
                    'effective_tax_rate': float(((old_tax if recommended == "OLD" else new_tax) / gross_income * 100) if gross_income > 0 else 0),
                    'tax_payable':        float(old_tax) if recommended == "OLD" else float(new_tax),
                    'insights':           insights
                }
            }
        except Exception as e:
            logger.error(f"Error generating tax report: {str(e)}")
            raise

