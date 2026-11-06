from io import BytesIO
import json
from datetime import datetime

class PDFReportService:
    @staticmethod
    def generate_report(analysis_data, user_name="User"):
        """
        Generates a PDF report using reportlab.
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        except ImportError:
            raise Exception("reportlab is not installed. Please install it using `pip install reportlab`")

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        elements = []
        styles = getSampleStyleSheet()

        # Styles
        title_style = styles['Heading1']
        title_style.alignment = 1 # Center
        subtitle_style = styles['Heading2']
        normal_style = styles['Normal']
        
        custom_heading = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=10
        )

        elements.append(Paragraph("Tax Analysis Report", title_style))
        elements.append(Spacer(1, 10))

        financial_year = analysis_data.get('financial_year', '2024-25')
        selected_regime = analysis_data.get('selected_regime', 'OLD')
        elements.append(Paragraph(f"Financial Year: {financial_year} | Assessment Year: {int(financial_year[:4])+1}-{int(financial_year[:4])+2}", normal_style))
        elements.append(Paragraph(f"Taxpayer: <b>{user_name}</b> | Selected Regime: <b>{selected_regime} Regime</b>", normal_style))
        elements.append(Spacer(1, 15))

        salary_profile = analysis_data.get('salary_profile') or {}
        breakdown = analysis_data.get('breakdown') or {}
        sec_80d_profile = analysis_data.get('section_80d_profile') or {}
        sec_80d_detailed = breakdown.get('section_80d_detailed') or {}
        hra_detailed = breakdown.get('hra_detailed') or {}

        # 1. Salary & Income Structure
        elements.append(Paragraph("1. Salary & Income Structure", custom_heading))
        annual_basic = float(salary_profile.get('annual_basic') or salary_profile.get('annualBasic') or (float(salary_profile.get('monthlyBasic') or salary_profile.get('monthly_basic') or 0) * 12) or (float(analysis_data.get('total_income', 0)) * 0.6))
        monthly_basic = float(salary_profile.get('monthly_basic') or salary_profile.get('monthlyBasic') or round(annual_basic / 12))
        annual_hra = float(salary_profile.get('annual_hra') or salary_profile.get('annualHRA') or salary_profile.get('annualHra') or (float(salary_profile.get('monthlyHRA') or salary_profile.get('monthlyHra') or salary_profile.get('monthly_hra') or 0) * 12) or (float(analysis_data.get('total_income', 0)) * 0.3))
        monthly_hra = float(salary_profile.get('monthly_hra') or salary_profile.get('monthlyHRA') or salary_profile.get('monthlyHra') or round(annual_hra / 12))
        annual_rent = float(salary_profile.get('annual_rent') or salary_profile.get('annualRent') or (float(salary_profile.get('monthlyRent') or salary_profile.get('monthly_rent') or 0) * 12) or 0)
        monthly_rent = float(salary_profile.get('monthly_rent') or salary_profile.get('monthlyRent') or round(annual_rent / 12))
        annual_other = float(salary_profile.get('annual_other_income') or salary_profile.get('annualOtherIncome') or 0)
        gross_income = float(analysis_data.get('total_income', 0)) or (annual_basic + annual_hra + annual_other)

        salary_table_data = [
            ['Income Component', 'Monthly (₹)', 'Annual (₹)'],
            ['Basic Salary', f"₹ {monthly_basic:,.0f}", f"₹ {annual_basic:,.0f}"],
            ['House Rent Allowance (HRA)', f"₹ {monthly_hra:,.0f}", f"₹ {annual_hra:,.0f}"],
            ['Rent Paid by Employee', f"₹ {monthly_rent:,.0f}", f"₹ {annual_rent:,.0f}"],
            ['Other / Special Income', '-', f"₹ {annual_other:,.0f}"],
            ['Total Gross Income', f"₹ {(gross_income / 12):,.0f}", f"₹ {gross_income:,.0f}"]
        ]
        t_salary = Table(salary_table_data, colWidths=[220, 140, 140])
        t_salary.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f2b1d')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f0fdf4')),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ]))
        elements.append(t_salary)
        elements.append(Spacer(1, 15))

        # 2. Smart HRA Exemption Analysis Section 10(13A)
        elements.append(Paragraph("2. Smart HRA Exemption Matrix — Section 10(13A)", custom_heading))
        hra_exemption = float(analysis_data.get('hra_eligible', 0))
        hra_remaining = max(0.0, annual_hra - hra_exemption)
        is_metro = bool(salary_profile.get('is_metro') if 'is_metro' in salary_profile else salary_profile.get('isMetro', True))

        rule1 = annual_hra
        rule2 = annual_basic * (0.50 if is_metro else 0.40)
        rule3 = max(0.0, annual_rent - (annual_basic * 0.10))

        hra_table_data = [
            ['HRA Exemption Rule', 'Calculated Amount (₹)', 'Status'],
            ['Rule 1: Actual HRA Received', f"₹ {rule1:,.0f}", 'Applied' if hra_exemption == rule1 and hra_exemption > 0 else 'Alternative'],
            [f"Rule 2: {'50%' if is_metro else '40%'} of Basic ({'Metro' if is_metro else 'Non-Metro'})", f"₹ {rule2:,.0f}", 'Applied' if hra_exemption == rule2 and hra_exemption > 0 else 'Alternative'],
            ['Rule 3: Rent Paid minus 10% of Basic', f"₹ {rule3:,.0f}", 'Applied' if hra_exemption == rule3 and hra_exemption > 0 else 'Alternative'],
            ['Eligible Tax-Free HRA Exemption (Lowest)', f"₹ {hra_exemption:,.0f}", 'EXEMPT (Old Regime)'],
            ['Taxable HRA Added to Income', f"₹ {hra_remaining:,.0f}", 'TAXABLE']
        ]
        t_hra = Table(hra_table_data, colWidths=[240, 140, 120])
        t_hra.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('BACKGROUND', (0,4), (-1,4), colors.HexColor('#dcfce7')),
            ('FONTNAME', (0,4), (-1,4), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0,4), (-1,4), colors.HexColor('#166534')),
        ]))
        elements.append(t_hra)
        elements.append(Spacer(1, 15))

        # 3. Section 80D Comprehensive Health Insurance
        elements.append(Paragraph("3. Section 80D Health Insurance Breakdown", custom_heading))
        d80d_eligible = float(analysis_data.get('section_80d_eligible', 0))
        self_prem = float(sec_80d_profile.get('self_spouse_insurance') or sec_80d_profile.get('selfSpouseInsurance') or sec_80d_profile.get('self_spouse_premium', 0))
        parents_prem = float(sec_80d_profile.get('parents_insurance') or sec_80d_profile.get('parentsInsurance') or sec_80d_profile.get('parents_premium', 0))
        is_parent_senior = bool(sec_80d_profile.get('is_parents_senior') if 'is_parents_senior' in sec_80d_profile else sec_80d_profile.get('isParentsSenior', False))
        prev_checkup = float(sec_80d_profile.get('preventive_checkup') or sec_80d_profile.get('preventiveCheckup', 0))
        tot_claimed_80d = float(sec_80d_detailed.get('total_claimed_80d', self_prem + parents_prem + prev_checkup))
        disallowed_80d = float(sec_80d_detailed.get('disallowed_amount', max(0.0, tot_claimed_80d - d80d_eligible)))

        sec80d_table_data = [
            ['Section 80D Item', 'Declared / Paid (₹)', 'Statutory Cap (₹)', 'Allowed Deduction (₹)'],
            ['Self, Spouse & Children Insurance', f"₹ {self_prem:,.0f}", f"₹ {sec_80d_detailed.get('self_family_limit', 25000):,.0f}", f"₹ {sec_80d_detailed.get('eligible_self_family', min(25000, self_prem)):,.0f}"],
            [f"Parents Insurance ({'Senior Citizen' if is_parent_senior else 'Non-Senior'})", f"₹ {parents_prem:,.0f}", f"₹ {sec_80d_detailed.get('parents_limit', 50000 if is_parent_senior else 25000):,.0f}", f"₹ {sec_80d_detailed.get('eligible_parents', min(50000 if is_parent_senior else 25000, parents_prem)):,.0f}"],
            ['Preventive Health Check-up', f"₹ {prev_checkup:,.0f}", '₹ 5,000 (Sublimit)', f"₹ {sec_80d_detailed.get('preventive_deduction_used', min(5000, prev_checkup)):,.0f}"],
            ['Total Section 80D Allowed', f"₹ {tot_claimed_80d:,.0f}", '-', f"₹ {d80d_eligible:,.0f}"],
            ['Disallowed / Capped Amount', f"₹ {disallowed_80d:,.0f}", '-', 'Exceeds statutory cap']
        ]
        t_80d = Table(sec80d_table_data, colWidths=[200, 100, 100, 100])
        t_80d.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('BACKGROUND', (0,4), (-1,4), colors.HexColor('#dbeafe')),
            ('FONTNAME', (0,4), (-1,4), 'Helvetica-Bold'),
        ]))
        elements.append(t_80d)
        if selected_regime == 'NEW':
            elements.append(Paragraph("<i>Note: Section 80D deduction is disallowed under the New Tax Regime (Section 115BAC).</i>", styles['Italic']))
        elements.append(Spacer(1, 15))

        # 4. Old vs New Tax Regime Comparison
        elements.append(Paragraph("4. Tax Regime Comparative Analysis", custom_heading))
        old_taxable = float(breakdown.get('old_taxable_income', analysis_data.get('taxable_income', 0)))
        new_taxable = float(breakdown.get('new_taxable_income', gross_income - 75000))
        old_tax = float(breakdown.get('old_regime_tax', analysis_data.get('estimated_tax', 0)))
        new_tax = float(breakdown.get('new_regime_tax', 0))
        tax_saved = float(breakdown.get('tax_saved', abs(old_tax - new_tax)))
        rec_regime = breakdown.get('recommended_regime', 'OLD' if old_tax <= new_tax else 'NEW')

        regime_table_data = [
            ['Metric', 'Old Tax Regime', 'New Tax Regime (Sec 115BAC)'],
            ['Total Gross Income', f"₹ {gross_income:,.0f}", f"₹ {gross_income:,.0f}"],
            ['Standard Deduction', '₹ 50,000', f"₹ {breakdown.get('new_regime_std_deduction', 75000):,.0f}"],
            ['Chapter VI-A Deductions (80C, 80D, etc.)', f"₹ {(float(analysis_data.get('section_80c_eligible', 0)) + d80d_eligible):,.0f}", 'Not Allowed (₹ 0)'],
            ['HRA Exemption Sec 10(13A)', f"₹ {hra_exemption:,.0f}", 'Not Allowed (₹ 0)'],
            ['Net Taxable Income', f"₹ {old_taxable:,.0f}", f"₹ {new_taxable:,.0f}"],
            ['Final Tax Payable (incl 4% Cess)', f"₹ {old_tax:,.0f}", f"₹ {new_tax:,.0f}"],
            ['Tax Verdict', 'RECOMMENDED' if rec_regime == 'OLD' else 'Alternative', 'RECOMMENDED' if rec_regime == 'NEW' else 'Alternative']
        ]
        t_regime = Table(regime_table_data, colWidths=[200, 150, 150])
        t_regime.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f2b1d')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('BACKGROUND', (0,-2), (-1,-2), colors.HexColor('#fef3c7')),
            ('FONTNAME', (0,-2), (-1,-2), 'Helvetica-Bold'),
        ]))
        elements.append(t_regime)
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(f"<b>Financial Optimization Impact:</b> Selecting the <b>{rec_regime} Regime</b> yields an annual tax saving of <b>₹ {tax_saved:,.0f}</b>.", styles['Normal']))
        elements.append(Spacer(1, 15))

        # 5. Tax-saving suggestions & Action Items
        elements.append(Paragraph("5. Tax Optimization Recommendations", custom_heading))
        recommendations = analysis_data.get('recommendations', [])
        
        if recommendations and isinstance(recommendations, list):
            for idx, rec in enumerate(recommendations[:5]):
                title = rec.get('title', 'Recommendation')
                desc = rec.get('description', '')
                elements.append(Paragraph(f"<b>[{idx+1}] {title}</b>", styles['Normal']))
                elements.append(Paragraph(desc, styles['Normal']))
                elements.append(Spacer(1, 6))
        else:
            elements.append(Paragraph("Maintain active investment proofs for Section 80C and Section 80D to secure maximum tax savings.", styles['Normal']))
            
        elements.append(Spacer(1, 15))
        elements.append(Paragraph(f"Report Generated: {datetime.now().strftime('%d %B %Y, %I:%M %p')} | Confidential & Certified", styles['Italic']))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
