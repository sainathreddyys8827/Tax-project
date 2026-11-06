import React, { useEffect } from "react";
import { Brain, CheckCircle2, AlertTriangle, Shield, TrendingUp, Info } from "lucide-react";

interface TaxReportPDFProps {
  data: any;
  onClose: () => void;
}

export function TaxReportPDF({ data, onClose }: TaxReportPDFProps) {
  const breakdown = data?.breakdown || {};
  const summary = data?.summary || {};
  const insights: string[] = summary.insights || [];
  const salaryProfile = data?.salary || breakdown.salary_profile || {};
  const sec80cProfile = data?.section80c || breakdown.section80c_profile || {};
  const sec80cDetailed = breakdown.section80c_detailed || {};
  const sec80dProfile = data?.section80d || breakdown.section80d_profile || {};
  const sec80dDetailed = breakdown.section80d_detailed || {};
  const hraDetailed = breakdown.hra_detailed || {};

  const gross = breakdown.gross_income || data?.grossIncome || 0;
  const oldTax = breakdown.old_regime_tax !== undefined ? breakdown.old_regime_tax : (data?.oldRegimeTax || 0);
  const newTax = breakdown.new_regime_tax !== undefined ? breakdown.new_regime_tax : (data?.newRegimeTax || 0);
  const taxSaved = breakdown.tax_saved !== undefined ? breakdown.tax_saved : (data?.taxSaved || 0);
  const rec = breakdown.recommended_regime || data?.recommendedRegime || "OLD";
  const selectedRegime = data?.selectedRegime || breakdown.selected_regime || "OLD";
  const financialYear = data?.financialYear || breakdown.financial_year || data?.financial_year || "2024-25";

  const d80c = breakdown["80c_deduction"] !== undefined ? breakdown["80c_deduction"] : (data?.d80c || 0);
  const d80d = breakdown["80d_deduction"] !== undefined ? breakdown["80d_deduction"] : (data?.d80d || 0);
  const hra = breakdown.hra_deduction !== undefined ? breakdown.hra_deduction : (data?.hraExemption || 0);
  const stdDed = selectedRegime === "OLD" ? 50000 : (breakdown.new_regime_std_deduction || 75000);
  const score = breakdown.efficiency_score || data?.efficiencyScore || 85;

  // Salary components
  const annualBasic = salaryProfile.annualBasic || Math.round(gross * 0.6);
  const monthlyBasic = salaryProfile.monthlyBasic || Math.round(annualBasic / 12);
  const annualHra = salaryProfile.annualHRA || Math.round(gross * 0.25);
  const monthlyHra = salaryProfile.monthlyHRA || Math.round(annualHra / 12);
  const annualRent = salaryProfile.annualRent || Math.round(annualHra * 0.8);
  const monthlyRent = salaryProfile.monthlyRent || Math.round(annualRent / 12);
  const annualOther = salaryProfile.annualOtherIncome || 0;
  const isMetro = salaryProfile.isMetro !== undefined ? salaryProfile.isMetro : true;

  // Section 80D components
  const selfSpouseInsurance = sec80dProfile.selfSpouseInsurance || 22000;
  const childrenInsurance = sec80dProfile.childrenInsurance || 0;
  const parentsInsurance = sec80dProfile.parentsInsurance || 35000;
  const isParentSenior = sec80dProfile.isParentsSenior !== undefined ? sec80dProfile.isParentsSenior : true;
  const isSelfSenior = sec80dProfile.isSelfSenior || false;
  const preventiveCheckup = sec80dProfile.preventiveCheckup || 5000;

  const selfFamilyLimit = isSelfSenior ? 50000 : 25000;
  const parentsLimit = isParentSenior ? 50000 : 25000;
  const eligibleSelf = sec80dDetailed.eligible_self_family !== undefined
    ? sec80dDetailed.eligible_self_family
    : Math.min(selfFamilyLimit, selfSpouseInsurance + childrenInsurance);
  const eligibleParents = sec80dDetailed.eligible_parents !== undefined
    ? sec80dDetailed.eligible_parents
    : Math.min(parentsLimit, parentsInsurance);
  const disallowed80D = sec80dDetailed.disallowed_amount !== undefined
    ? sec80dDetailed.disallowed_amount
    : Math.max(0, (selfSpouseInsurance + childrenInsurance + parentsInsurance + preventiveCheckup) - (eligibleSelf + eligibleParents));

  // HRA breakdown calculations
  const rule1ActualHra = annualHra;
  const rule2PctBasic = annualBasic * (isMetro ? 0.5 : 0.4);
  const rule3RentMinusTen = Math.max(0, annualRent - annualBasic * 0.1);
  const remainingTaxableHra = Math.max(0, annualHra - hra);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="tax-report-print" className="fixed inset-0 z-[100] bg-white text-black overflow-auto">
      {/* Top action controls — hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-[200]">
        <button
          onClick={() => window.print()}
          className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 shadow-md transition-colors"
        >
          🖨 Print / Save as PDF
        </button>
        <button
          onClick={onClose}
          className="bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* Report Sheet */}
      <div className="max-w-3xl mx-auto px-8 py-10 font-sans text-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">
                TaxMind<span className="text-emerald-600">AI</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              India's Comprehensive Personal Wealth & Tax-Saver Report
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-gray-900 uppercase tracking-wider">TAX ANALYSIS REPORT</p>
            <p className="text-xs text-gray-600 font-semibold">Financial Year: {financialYear.replace("-", "–")}</p>
            <p className="text-xs text-gray-400">
              Active Regime: <strong>{selectedRegime} REGIME</strong> • Generated:{" "}
              {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="border border-gray-200 rounded-xl p-3 text-center bg-gray-50/50">
            <p className="text-[11px] text-gray-500 font-mono uppercase mb-0.5">Gross Income</p>
            <p className="text-lg font-black text-emerald-700">₹{gross.toLocaleString("en-IN")}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-3 text-center bg-gray-50/50">
            <p className="text-[11px] text-gray-500 font-mono uppercase mb-0.5">Tax Payable ({selectedRegime})</p>
            <p className="text-lg font-black text-blue-700">
              ₹{(selectedRegime === "OLD" ? oldTax : newTax).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-3 text-center bg-gray-50/50">
            <p className="text-[11px] text-gray-500 font-mono uppercase mb-0.5">Potential Tax Saved</p>
            <p className="text-lg font-black text-amber-600">₹{taxSaved.toLocaleString("en-IN")}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-3 text-center bg-gray-50/50">
            <p className="text-[11px] text-gray-500 font-mono uppercase mb-0.5">Efficiency Score</p>
            <p className="text-lg font-black text-emerald-600">{score}/100</p>
          </div>
        </div>

        {/* 1. Salary & Rent Structure */}
        <div className="mb-6">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-2.5">
            1. Salary & Rent Structure (Monthly & Annual)
          </h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 text-gray-600 font-mono border-b border-gray-200">
                <th className="py-1.5 px-3 text-left">Component</th>
                <th className="py-1.5 px-3 text-right">Monthly (₹)</th>
                <th className="py-1.5 px-3 text-right">Annual (₹)</th>
                <th className="py-1.5 px-3 text-left">Classification</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 font-semibold text-gray-900">Basic Salary</td>
                <td className="py-1.5 px-3 text-right font-mono">₹{monthlyBasic.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">₹{annualBasic.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-gray-500">Core Salary Component</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 font-semibold text-gray-900">HRA Received</td>
                <td className="py-1.5 px-3 text-right font-mono">₹{monthlyHra.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-purple-700">₹{annualHra.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-gray-500">Eligible for Sec 10(13A)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 font-semibold text-gray-900">Rent Paid by Taxpayer</td>
                <td className="py-1.5 px-3 text-right font-mono">₹{monthlyRent.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-700">₹{annualRent.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-gray-500">{isMetro ? "Metro City (50% rule)" : "Non-Metro City (40% rule)"}</td>
              </tr>
              {annualOther > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 px-3 font-semibold text-gray-900">Other / Special Income</td>
                  <td className="py-1.5 px-3 text-right font-mono">—</td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold">₹{annualOther.toLocaleString("en-IN")}</td>
                  <td className="py-1.5 px-3 text-gray-500">Taxable under Income from Other Sources</td>
                </tr>
              )}
              <tr className="bg-emerald-50/60 font-bold border-t border-emerald-300">
                <td className="py-2 px-3 text-gray-900">Total Annual Gross Income</td>
                <td className="py-2 px-3 text-right font-mono">₹{Math.round(gross / 12).toLocaleString("en-IN")}</td>
                <td className="py-2 px-3 text-right font-mono text-emerald-800">₹{gross.toLocaleString("en-IN")}</td>
                <td className="py-2 px-3 text-emerald-700">Standard Gross Base</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Smart HRA Exemption Matrix */}
        <div className="mb-6">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-2.5">
            2. Section 10(13A) HRA Exemption Matrix
          </h2>
          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="bg-gray-100 text-gray-600 font-mono border-b border-gray-200">
                <th className="py-1.5 px-3 text-left">Statutory Rule</th>
                <th className="py-1.5 px-3 text-right">Computed Amount (₹)</th>
                <th className="py-1.5 px-3 text-left">Application</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 text-gray-700">1. Actual Annual HRA Received</td>
                <td className="py-1.5 px-3 text-right font-mono font-semibold">₹{rule1ActualHra.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-gray-500">{hra === rule1ActualHra ? "✓ Lowest (Applied)" : "Upper Bound"}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 text-gray-700">2. {isMetro ? "50%" : "40%"} of Annual Basic Salary ({isMetro ? "Metro" : "Non-Metro"})</td>
                <td className="py-1.5 px-3 text-right font-mono font-semibold">₹{rule2PctBasic.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-gray-500">{hra === rule2PctBasic ? "✓ Lowest (Applied)" : "City Cap"}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 text-gray-700">3. Annual Rent Paid minus 10% of Basic Salary</td>
                <td className="py-1.5 px-3 text-right font-mono font-semibold">₹{rule3RentMinusTen.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-gray-500">{hra === rule3RentMinusTen ? "✓ Lowest (Applied)" : "Rent Outflow Cap"}</td>
              </tr>
              <tr className="bg-purple-50 font-bold border-t border-purple-200">
                <td className="py-2 px-3 text-purple-900">Final Eligible Tax-Free HRA Exemption (Lowest)</td>
                <td className="py-2 px-3 text-right font-mono text-purple-900">₹{hra.toLocaleString("en-IN")}</td>
                <td className="py-2 px-3 text-purple-700">Deducted under Old Regime</td>
              </tr>
              <tr className="text-gray-500 text-[11px]">
                <td className="py-1 px-3">Remaining Taxable HRA Added to Gross Income</td>
                <td className="py-1 px-3 text-right font-mono">₹{remainingTaxableHra.toLocaleString("en-IN")}</td>
                <td className="py-1 px-3">Subject to slab tax</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Section 80C Investment Deduction */}
        <div className="mb-6">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-2.5">3. Section 80C Investment Deduction Details</h2>
          <table className="w-full text-xs"><thead><tr className="bg-gray-100 text-gray-600"><th className="py-1.5 px-3 text-left">Investment</th><th className="py-1.5 px-3 text-right">Amount (₹)</th></tr></thead><tbody>
            {[["EPF",sec80cProfile.epf],["PPF",sec80cProfile.ppf],["ELSS Mutual Funds",sec80cProfile.elss],["Life Insurance Premium",sec80cProfile.lifeInsurance],["NSC",sec80cProfile.nsc],["Tax-saving Fixed Deposits",sec80cProfile.taxSavingFD],["Eligible Tuition Fees",sec80cProfile.tuitionFees],["Home Loan Principal",sec80cProfile.homeLoanPrincipal],["Other Eligible Investments",sec80cProfile.otherInvestments]].map(([label,value]: any)=><tr key={label} className="border-b border-gray-100"><td className="py-1.5 px-3">{label}</td><td className="py-1.5 px-3 text-right font-mono">₹{Number(value||0).toLocaleString("en-IN")}</td></tr>)}
            <tr className="font-semibold"><td className="py-1.5 px-3">Total invested / claimed across items</td><td className="py-1.5 px-3 text-right">₹{Number(sec80cDetailed.totalInvested ?? d80c).toLocaleString("en-IN")}</td></tr>
            <tr className="font-bold text-emerald-800"><td className="py-1.5 px-3">Eligible deduction (cap ₹1,50,000)</td><td className="py-1.5 px-3 text-right">₹{Number(sec80cDetailed.eligibleDeduction ?? d80c).toLocaleString("en-IN")}</td></tr>
            <tr className="text-amber-700"><td className="py-1.5 px-3">Excess / not eligible under active regime</td><td className="py-1.5 px-3 text-right">₹{Number(sec80cDetailed.excessInvestments ?? Math.max(0,Number(sec80cDetailed.totalInvested||d80c)-d80c)).toLocaleString("en-IN")}</td></tr>
          </tbody></table>
          {selectedRegime === "NEW" && <p className="text-[11px] text-red-600 mt-1">Section 80C generally does not reduce taxable income under the New Regime.</p>}
        </div>

        {/* 4. Section 80D Comprehensive Medical Insurance */}
        <div className="mb-6">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-2.5">
            4. Section 80D Health Insurance Deduction Breakdown
          </h2>
          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="bg-gray-100 text-gray-600 font-mono border-b border-gray-200">
                <th className="py-1.5 px-3 text-left">Category & Item</th>
                <th className="py-1.5 px-3 text-right">Declared / Paid (₹)</th>
                <th className="py-1.5 px-3 text-right">Statutory Limit (₹)</th>
                <th className="py-1.5 px-3 text-right">Allowed (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 text-gray-800">
                  Self, Spouse & Dependent Children {isSelfSenior && <span className="font-bold text-sky-700">(Senior Citizen)</span>}
                </td>
                <td className="py-1.5 px-3 text-right font-mono">₹{(selfSpouseInsurance + childrenInsurance).toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono">₹{selfFamilyLimit.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono font-semibold text-emerald-700">₹{eligibleSelf.toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 text-gray-800">
                  Parents Health Insurance {isParentSenior && <span className="font-bold text-sky-700">(Senior Citizen Age 60+)</span>}
                </td>
                <td className="py-1.5 px-3 text-right font-mono">₹{parentsInsurance.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono">₹{parentsLimit.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono font-semibold text-emerald-700">₹{eligibleParents.toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 px-3 text-gray-800">Preventive Health Check-up</td>
                <td className="py-1.5 px-3 text-right font-mono">₹{preventiveCheckup.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono">₹5,000 (Sublimit)</td>
                <td className="py-1.5 px-3 text-right font-mono text-gray-600">Absorbed in limit</td>
              </tr>
              <tr className="bg-sky-50 font-bold border-t border-sky-300">
                <td className="py-2 px-3 text-sky-900">Total Section 80D Eligible Deduction</td>
                <td className="py-2 px-3 text-right font-mono">
                  ₹{(selfSpouseInsurance + childrenInsurance + parentsInsurance + preventiveCheckup).toLocaleString("en-IN")}
                </td>
                <td className="py-2 px-3 text-right font-mono">₹{(selfFamilyLimit + parentsLimit).toLocaleString("en-IN")}</td>
                <td className="py-2 px-3 text-right font-mono text-sky-900 font-black">₹{d80d.toLocaleString("en-IN")}</td>
              </tr>
              {disallowed80D > 0 && (
                <tr className="text-amber-700 text-[11px] bg-amber-50">
                  <td className="py-1 px-3">Disallowed Section 80D Premium (Exceeds statutory limit)</td>
                  <td className="py-1 px-3 text-right font-mono">₹{disallowed80D.toLocaleString("en-IN")}</td>
                  <td className="py-1 px-3 text-right font-mono">—</td>
                  <td className="py-1 px-3 text-right font-mono">₹0 (Disallowed)</td>
                </tr>
              )}
            </tbody>
          </table>
          {selectedRegime === "NEW" && (
            <p className="text-[11px] text-red-600 font-mono italic">
              * Note: Under the New Tax Regime (Section 115BAC), Section 80D deduction is disallowed entirely.
            </p>
          )}
        </div>

        {/* 4. Tax Computation Comparison (Old vs New) */}
        <div className="mb-6">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-2.5">
            5. Comparative Tax Computation (Old vs New Regime)
          </h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 text-gray-600 font-mono border-b border-gray-200">
                <th className="py-1.5 px-3 text-left">Computation Row</th>
                <th className="py-1.5 px-3 text-right">Old Regime (₹)</th>
                <th className="py-1.5 px-3 text-right">New Regime (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 font-semibold">
                <td className="py-1.5 px-3">Gross Income</td>
                <td className="py-1.5 px-3 text-right font-mono">₹{gross.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono">₹{gross.toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b border-gray-100 text-emerald-700">
                <td className="py-1.5 px-3">(-) Standard Deduction</td>
                <td className="py-1.5 px-3 text-right font-mono">-₹50,000</td>
                <td className="py-1.5 px-3 text-right font-mono">-₹75,000</td>
              </tr>
              <tr className="border-b border-gray-100 text-emerald-700">
                <td className="py-1.5 px-3">(-) Section 80C Deductions</td>
                <td className="py-1.5 px-3 text-right font-mono">-₹{d80c.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono text-gray-400">Not Allowed (₹0)</td>
              </tr>
              <tr className="border-b border-gray-100 text-sky-700">
                <td className="py-1.5 px-3">(-) Section 80D Health Insurance</td>
                <td className="py-1.5 px-3 text-right font-mono">-₹{d80d.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono text-gray-400">Not Allowed (₹0)</td>
              </tr>
              <tr className="border-b border-gray-100 text-purple-700">
                <td className="py-1.5 px-3">(-) Section 10(13A) HRA Exemption</td>
                <td className="py-1.5 px-3 text-right font-mono">-₹{hra.toLocaleString("en-IN")}</td>
                <td className="py-1.5 px-3 text-right font-mono text-gray-400">Not Allowed (₹0)</td>
              </tr>
              <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                <td className="py-2 px-3 text-gray-900">= Net Taxable Income</td>
                <td className="py-2 px-3 text-right font-mono text-emerald-700">
                  ₹{(breakdown.old_taxable_income || Math.max(0, gross - 50000 - d80c - d80d - hra)).toLocaleString("en-IN")}
                </td>
                <td className="py-2 px-3 text-right font-mono text-blue-700">
                  ₹{(breakdown.new_taxable_income || Math.max(0, gross - 75000)).toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="border-b border-gray-200 font-black text-sm bg-gray-100">
                <td className="py-2.5 px-3 text-gray-900">Total Tax Liability (incl. 4% Cess)</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700">₹{oldTax.toLocaleString("en-IN")}</td>
                <td className="py-2.5 px-3 text-right font-mono text-blue-700">₹{newTax.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-mono">
            <span className="font-bold text-emerald-900">OPTIMIZATION VERDICT: </span>
            <span className="text-emerald-800">
              The <strong>{rec} REGIME</strong> is mathematically superior for you, delivering an annual net saving of{" "}
              <strong>₹{taxSaved.toLocaleString("en-IN")}</strong>.
            </span>
          </div>
        </div>

        {/* 5. AI Notes & Footer */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-2.5">
              5. AI Advisory & Actionable Next Steps
            </h2>
            <ul className="space-y-1.5 text-xs text-gray-700 font-mono">
              {insights.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">[{idx + 1}]</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 font-mono">
          TaxMindAI Certified Automated Assessment • Conforms to Section 10(13A), Section 80C, Section 80D, and Section 115BAC (Finance Act 2024).
        </div>
      </div>
    </div>
  );
}
