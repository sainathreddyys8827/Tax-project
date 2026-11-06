import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
import pandas as pd
from app.services.tax_calculator_service import TaxCalculatorService

def test_hra_metro_calculation():
    # Basic 6,00,000, HRA 2,40,000, Rent 1,80,000, Metro (50%)
    # Rule 1: 2,40,000
    # Rule 2: 50% of 6L = 3,00,000
    # Rule 3: 1,80,000 - 60,000 = 1,20,000
    res = TaxCalculatorService.calculate_hra_exemption(600000, 240000, 180000, is_metro=True)
    assert res['exemption'] == 120000
    assert res['remaining_taxable_hra'] == 120000
    assert res['breakdown']['actual_hra'] == 240000
    assert res['breakdown']['percentage_of_basic'] == 300000
    assert res['breakdown']['rent_minus_10pct_basic'] == 120000

def test_hra_non_metro_calculation():
    # Basic 6,00,000, HRA 2,40,000, Rent 3,50,000, Non-Metro (40%)
    res = TaxCalculatorService.calculate_hra_exemption(600000, 240000, 350000, is_metro=False)
    assert res['exemption'] == 240000
    assert res['remaining_taxable_hra'] == 0
    assert res['breakdown']['percentage_of_basic'] == 240000

def test_hra_zero_negative_protection():
    res = TaxCalculatorService.calculate_hra_exemption(600000, 240000, 30000, is_metro=True)
    assert res['exemption'] == 0.0
    assert res['remaining_taxable_hra'] == 240000

def test_80d_non_senior_parents():
    res = TaxCalculatorService.calculate_section_80d_detailed(
        self_spouse_premium=20000,
        children_premium=0,
        parents_premium=35000,
        is_self_senior=False,
        is_parents_senior=False,
        preventive_checkup=0,
        financial_year='2024-25',
        regime='OLD'
    )
    assert res['eligible_self_family'] == 20000
    assert res['eligible_parents'] == 25000
    assert res['total_eligible_80d'] == 45000
    assert res['disallowed_amount'] == 10000

def test_80d_senior_parents():
    res = TaxCalculatorService.calculate_section_80d_detailed(
        self_spouse_premium=20000,
        children_premium=0,
        parents_premium=45000,
        is_self_senior=False,
        is_parents_senior=True,
        preventive_checkup=0,
        financial_year='2024-25',
        regime='OLD'
    )
    assert res['eligible_self_family'] == 20000
    assert res['eligible_parents'] == 45000
    assert res['total_eligible_80d'] == 65000
    assert res['disallowed_amount'] == 0

def test_80d_preventive_checkup_sublimit():
    res = TaxCalculatorService.calculate_section_80d_detailed(
        self_spouse_premium=22000,
        children_premium=0,
        parents_premium=20000,
        is_self_senior=False,
        is_parents_senior=False,
        preventive_checkup=8000,
        financial_year='2024-25',
        regime='OLD'
    )
    assert res['preventive_deduction_used'] == 5000
    assert res['eligible_self_family'] == 25000
    assert res['eligible_parents'] == 22000
    assert res['total_eligible_80d'] == 47000
    assert res['disallowed_amount'] == 3000

def test_80d_new_regime_disallowed():
    res = TaxCalculatorService.calculate_section_80d_detailed(
        self_spouse_premium=25000,
        children_premium=10000,
        parents_premium=50000,
        is_self_senior=True,
        is_parents_senior=True,
        preventive_checkup=5000,
        financial_year='2024-25',
        regime='NEW'
    )
    assert res['is_allowed_under_regime'] is False
    assert res['total_eligible_80d'] == 0
    assert res['disallowed_amount'] == res['total_claimed_80d']

def test_generate_tax_report_with_profiles():
    salary_profile = {
        'annual_basic': 960000,
        'annual_hra': 360000,
        'annual_rent': 300000,
        'annual_other_income': 40000,
        'is_metro': True
    }
    sec80d_profile = {
        'self_spouse_insurance': 25000,
        'children_insurance': 0,
        'parents_insurance': 40000,
        'is_self_senior': False,
        'is_parents_senior': True,
        'preventive_checkup': 5000
    }
    df = pd.DataFrame([{'category': 'INVESTMENT_80C', 'amount': -150000}])
    report = TaxCalculatorService.generate_tax_report(
        df=df,
        salary_profile=salary_profile,
        section_80d_profile=sec80d_profile,
        financial_year='2024-25',
        selected_regime='OLD'
    )
    assert report['gross_income'] == 1360000
    assert report['breakdown']['80c_deduction'] == 150000
    assert report['breakdown']['80d_deduction'] == 70000 # 25k + 45k
    assert report['breakdown']['hra_deduction'] == 204000 # 3L - 96k
    assert report['taxable_income'] == 1360000 - (50000 + 150000 + 70000 + 204000)

def test_generate_tax_report_with_camel_case_profiles():
    # Frontend sends camelCase keys from React components / localStorage
    salary_profile = {
        'annualBasic': 960000,
        'annualHRA': 360000,
        'annualRent': 300000,
        'annualOtherIncome': 40000,
        'isMetro': True
    }
    sec80d_profile = {
        'selfSpouseInsurance': 22000,
        'childrenInsurance': 3000,
        'parentsInsurance': 35000,
        'isSelfSenior': False,
        'isParentsSenior': True,
        'preventiveCheckup': 5000
    }
    df = pd.DataFrame([
        {'category': 'INVESTMENT_80C', 'amount': -150000, 'description': 'PPF', 'date': '2024-05-01'},
    ])
    report = TaxCalculatorService.generate_tax_report(
        df=df,
        salary_profile=salary_profile,
        section_80d_profile=sec80d_profile,
        financial_year='2024-25',
        selected_regime='OLD'
    )
    assert report['gross_income'] == 1360000
    assert report['breakdown']['80c_deduction'] == 150000
    assert report['breakdown']['80d_deduction'] == 65000  # 25k (self+family+preventive) + 40k (parents senior)
    assert report['breakdown']['hra_deduction'] == 204000  # min(3.6L, 4.8L, 3L - 96k)
    assert report['breakdown']['hra_detailed']['exemption'] == 204000

def test_chatbot_section_80d_guide():
    from app.services.llm_service import LLMService
    llm = LLMService()
    reply = llm.chat("Section 80D guide", context={"taxable_income": 1200000})
    assert "Section 80D Health Insurance Deduction Guide" in reply
    assert "Statutory Deduction Limits" in reply
    assert "Senior Citizen" in reply
    assert "₹25,000" in reply
    assert "₹50,000" in reply
    assert "Preventive Health Check-up" in reply
    assert "Old Tax Regime" in reply
