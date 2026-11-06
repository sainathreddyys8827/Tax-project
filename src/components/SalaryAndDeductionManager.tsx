import React, { useState, useEffect } from "react";
import {
  DollarSign, Shield, HeartPulse, UserCheck, AlertTriangle,
  CheckCircle2, Info, RefreshCw, ChevronDown, ChevronUp, Sparkles, Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SalaryProfile, Section80DProfile, Section80CProfile, FullTaxCalculationResult,
  computeFullTaxAnalysis, calculateSection80C, calculateSection80D, FY_CONFIGS
} from "@/lib/taxCalculations";

interface SalaryAndDeductionManagerProps {
  initialSalary?: Partial<SalaryProfile>;
  initialSection80D?: Partial<Section80DProfile>;
  initialD80C?: number;
  initialOtherDeductions?: number;
  initialFY?: string;
  initialRegime?: "OLD" | "NEW";
  onAnalysisChange: (analysis: FullTaxCalculationResult) => void;
}

export function SalaryAndDeductionManager({
  initialSalary,
  initialSection80D,
  initialD80C = 150000,
  initialOtherDeductions = 0,
  initialFY = "2024-25",
  initialRegime = "OLD",
  onAnalysisChange,
}: SalaryAndDeductionManagerProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Financial Year and Tax Regime
  const [financialYear, setFinancialYear] = useState<string>(initialFY);
  const [regime, setRegime] = useState<"OLD" | "NEW">(initialRegime);

  // Salary string states for fluid editing
  const defaultAnnualBasic = initialSalary?.annualBasic ?? 960000;
  const [monthlyBasic, setMonthlyBasic] = useState<string>(
    String(Math.round(defaultAnnualBasic / 12))
  );
  const [annualBasic, setAnnualBasic] = useState<string>(String(defaultAnnualBasic));

  const defaultAnnualHra = initialSalary?.annualHRA ?? 360000;
  const [monthlyHra, setMonthlyHra] = useState<string>(
    String(Math.round(defaultAnnualHra / 12))
  );
  const [annualHra, setAnnualHra] = useState<string>(String(defaultAnnualHra));

  const defaultAnnualRent = initialSalary?.annualRent ?? 300000;
  const [monthlyRent, setMonthlyRent] = useState<string>(
    String(Math.round(defaultAnnualRent / 12))
  );
  const [annualRent, setAnnualRent] = useState<string>(String(defaultAnnualRent));

  const [annualOtherIncome, setAnnualOtherIncome] = useState<string>(
    String(initialSalary?.annualOtherIncome ?? 0)
  );
  const [isMetro, setIsMetro] = useState<boolean>(initialSalary?.isMetro ?? true);

  // Section 80D states
  const [selfSpouseInsurance, setSelfSpouseInsurance] = useState<string>(
    String(initialSection80D?.selfSpouseInsurance ?? 22000)
  );
  const [childrenInsurance, setChildrenInsurance] = useState<string>(
    String(initialSection80D?.childrenInsurance ?? 0)
  );
  const [parentsInsurance, setParentsInsurance] = useState<string>(
    String(initialSection80D?.parentsInsurance ?? 35000)
  );
  const [isSelfSenior, setIsSelfSenior] = useState<boolean>(
    initialSection80D?.isSelfSenior ?? false
  );
  const [isParentsSenior, setIsParentsSenior] = useState<boolean>(
    initialSection80D?.isParentsSenior ?? true
  );
  const [preventiveCheckup, setPreventiveCheckup] = useState<string>(
    String(initialSection80D?.preventiveCheckup ?? 5000)
  );
  const [selfMedicalExp, setSelfMedicalExp] = useState<string>(
    String(initialSection80D?.selfMedicalExp ?? 0)
  );
  const [parentsMedicalExp, setParentsMedicalExp] = useState<string>(
    String(initialSection80D?.parentsMedicalExp ?? 0)
  );

  // Itemized Section 80C values; preserve legacy single-value imports as EPF.
  const [section80c, setSection80c] = useState<Section80CProfile>({
    epf: initialD80C, ppf: 0, elss: 0, lifeInsurance: 0, nsc: 0,
    taxSavingFD: 0, tuitionFees: 0, homeLoanPrincipal: 0, otherInvestments: 0,
  });
  const [parentsPreventiveCheckup, setParentsPreventiveCheckup] = useState<string>(String(initialSection80D?.parentsPreventiveCheckup ?? 0));

  // Synchronizers without infinite loops
  const handleMonthlyBasicChange = (val: string) => {
    setMonthlyBasic(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setAnnualBasic(String(Math.round(num * 12)));
    } else if (val === "") {
      setAnnualBasic("");
    }
  };

  const handleAnnualBasicChange = (val: string) => {
    setAnnualBasic(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMonthlyBasic(String(Math.round(num / 12)));
    } else if (val === "") {
      setMonthlyBasic("");
    }
  };

  const handleMonthlyHraChange = (val: string) => {
    setMonthlyHra(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setAnnualHra(String(Math.round(num * 12)));
    } else if (val === "") {
      setAnnualHra("");
    }
  };

  const handleAnnualHraChange = (val: string) => {
    setAnnualHra(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMonthlyHra(String(Math.round(num / 12)));
    } else if (val === "") {
      setMonthlyHra("");
    }
  };

  const handleMonthlyRentChange = (val: string) => {
    setMonthlyRent(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setAnnualRent(String(Math.round(num * 12)));
    } else if (val === "") {
      setAnnualRent("");
    }
  };

  const handleAnnualRentChange = (val: string) => {
    setAnnualRent(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMonthlyRent(String(Math.round(num / 12)));
    } else if (val === "") {
      setMonthlyRent("");
    }
  };

  // Recalculate analysis immediately whenever any input changes
  useEffect(() => {
    const salary: SalaryProfile = {
      monthlyBasic: Math.max(0, parseFloat(monthlyBasic) || 0),
      annualBasic: Math.max(0, parseFloat(annualBasic) || 0),
      monthlyHRA: Math.max(0, parseFloat(monthlyHra) || 0),
      annualHRA: Math.max(0, parseFloat(annualHra) || 0),
      monthlyRent: Math.max(0, parseFloat(monthlyRent) || 0),
      annualRent: Math.max(0, parseFloat(annualRent) || 0),
      annualOtherIncome: Math.max(0, parseFloat(annualOtherIncome) || 0),
      isMetro,
    };

    const sec80d: Section80DProfile = {
      selfSpouseInsurance: Math.max(0, parseFloat(selfSpouseInsurance) || 0),
      childrenInsurance: Math.max(0, parseFloat(childrenInsurance) || 0),
      parentsInsurance: Math.max(0, parseFloat(parentsInsurance) || 0),
      isSelfSenior,
      isParentsSenior,
      preventiveCheckup: Math.max(0, parseFloat(preventiveCheckup) || 0),
      parentsPreventiveCheckup: Math.max(0, parseFloat(parentsPreventiveCheckup) || 0),
      selfMedicalExp: Math.max(0, parseFloat(selfMedicalExp) || 0),
      parentsMedicalExp: Math.max(0, parseFloat(parentsMedicalExp) || 0),
      parentsUninsured: Math.max(0, parseFloat(parentsMedicalExp) || 0) > 0,
    };

    const analysis = computeFullTaxAnalysis(
      salary,
      sec80d,
      section80c,
      initialOtherDeductions,
      financialYear,
      regime
    );

    // Save profile to localStorage for persistent state across app
    localStorage.setItem(
      "taxProfileData",
      JSON.stringify({
        salary,
        section80c,
        section80d: sec80d,
        financialYear,
        regime,
      })
    );

    onAnalysisChange(analysis);
  }, [
    monthlyBasic,
    annualBasic,
    monthlyHra,
    annualHra,
    monthlyRent,
    annualRent,
    annualOtherIncome,
    isMetro,
    selfSpouseInsurance,
    childrenInsurance,
    parentsInsurance,
    isSelfSenior,
    isParentsSenior,
    preventiveCheckup,
    selfMedicalExp,
    parentsMedicalExp,
    parentsPreventiveCheckup,
    financialYear,
    regime,
    section80c,
    initialOtherDeductions,
  ]);

  // Current real-time 80D result for preview in UI
  const current80DPreview = calculateSection80D(
    {
      selfSpouseInsurance: Math.max(0, parseFloat(selfSpouseInsurance) || 0),
      childrenInsurance: Math.max(0, parseFloat(childrenInsurance) || 0),
      parentsInsurance: Math.max(0, parseFloat(parentsInsurance) || 0),
      isSelfSenior,
      isParentsSenior,
      preventiveCheckup: Math.max(0, parseFloat(preventiveCheckup) || 0),
      parentsPreventiveCheckup: Math.max(0, parseFloat(parentsPreventiveCheckup) || 0),
      selfMedicalExp: Math.max(0, parseFloat(selfMedicalExp) || 0),
      parentsMedicalExp: Math.max(0, parseFloat(parentsMedicalExp) || 0),
    },
    financialYear,
    regime
  );

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-card/70 backdrop-blur-xl shadow-xl overflow-hidden glass-morphism">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base text-foreground tracking-wide flex items-center gap-2">
              SALARY & TAX DEDUCTION ENGINE
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                LIVE SYNC
              </span>
            </h2>
            <p className="text-xs font-mono text-muted-foreground">
              Edit any monthly or annual field — instant bidirectional recalculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Financial Year Selector */}
          <div className="flex items-center gap-1.5 bg-background/80 border border-border/60 rounded-lg px-2.5 py-1 text-xs font-mono">
            <span className="text-muted-foreground">FY:</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="2023-24" className="bg-background text-foreground">2023–24</option>
              <option value="2024-25" className="bg-background text-foreground">2024–25</option>
              <option value="2025-26" className="bg-background text-foreground">2025–26</option>
              <option value="2026-27" className="bg-background text-foreground">2026–27</option>
              <option value="2026-27" className="bg-background text-foreground">2026–27 (provisional)</option>
            </select>
          </div>

          {/* Regime Switcher */}
          <div className="flex items-center gap-1 bg-muted/50 border border-border/60 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setRegime("OLD")}
              className={`px-3 py-1 rounded font-bold transition-all ${
                regime === "OLD"
                  ? "bg-emerald-500 text-black shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Old Regime
            </button>
            <button
              onClick={() => setRegime("NEW")}
              className={`px-3 py-1 rounded font-bold transition-all ${
                regime === "NEW"
                  ? "bg-blue-500 text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              New Regime
            </button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Form Body */}
      {isOpen && (
        <div className="p-6 space-y-6">
          {/* Regime Notice Banner */}
          {regime === "NEW" ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-mono text-blue-200">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-300 block mb-0.5">
                  NEW TAX REGIME ACTIVE (Section 115BAC)
                </span>
                <span>
                  Section 80D health insurance and Section 10(13A) HRA exemptions are{" "}
                  <strong>disallowed</strong> under the New Regime. Revised standard deduction of{" "}
                  <strong>₹75,000</strong> (Budget 2024) is applied automatically.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs font-mono text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>OLD TAX REGIME ACTIVE:</strong> All Chapter VI-A deductions (Section 80C,
                Section 80D, HRA exemption) are legally permitted and subtracted from your gross
                income.
              </span>
            </div>
          )}

          {/* ── SECTION 1: SALARY INPUTS (MONTHLY & ANNUAL SYNC) ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
                  1. Salary & Rent Structure (Bidirectional Monthly ⇄ Annual Sync)
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Formula: Annual = Monthly × 12
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Salary Card */}
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground">Basic Salary</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Core Income
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Monthly Basic Salary (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={monthlyBasic}
                        onChange={(e) => handleMonthlyBasicChange(e.target.value)}
                        placeholder="e.g. 80000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Annual Basic Salary (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={annualBasic}
                        onChange={(e) => handleAnnualBasicChange(e.target.value)}
                        placeholder="e.g. 960000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* HRA Received Card */}
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground">HRA Received</span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                    Allowance
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Monthly HRA Received (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={monthlyHra}
                        onChange={(e) => handleMonthlyHraChange(e.target.value)}
                        placeholder="e.g. 30000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Annual HRA Received (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={annualHra}
                        onChange={(e) => handleAnnualHraChange(e.target.value)}
                        placeholder="e.g. 360000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-purple-400 font-bold focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rent Paid Card */}
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground">Rent Paid</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Outflow
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Monthly Rent Paid (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={monthlyRent}
                        onChange={(e) => handleMonthlyRentChange(e.target.value)}
                        placeholder="e.g. 25000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Annual Rent Paid (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={annualRent}
                        onChange={(e) => handleAnnualRentChange(e.target.value)}
                        placeholder="e.g. 300000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Income & Metro Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="rounded-xl border border-border/50 bg-muted/10 p-3.5 flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-mono font-bold text-foreground block">
                    Annual Other Income (₹)
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Bonus, interest, freelance earnings
                  </span>
                </div>
                <div className="relative w-44">
                  <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={annualOtherIncome}
                    onChange={(e) => setAnnualOtherIncome(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60 font-semibold text-right"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/10 p-3.5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-foreground block">
                    City Classification (HRA Exemption Rule)
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Metro: Mumbai, Delhi, Kolkata, Chennai (50%)
                  </span>
                </div>
                <div className="flex gap-1.5 bg-muted/60 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsMetro(true)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      isMetro ? "bg-emerald-500 text-black shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Metro (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMetro(false)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      !isMetro ? "bg-emerald-500 text-black shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Non-Metro (40%)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: SECTION 80C INVESTMENT MATRIX ── */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-2"><span className="text-sm font-mono font-bold text-foreground">2. Section 80C Investment Matrix</span><span className="text-xs text-emerald-400">Annual limit ₹{FY_CONFIGS[financialYear]?.max80C.toLocaleString("en-IN")}</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {([["epf","EPF / Employee Provident Fund"],["ppf","PPF / Public Provident Fund"],["elss","ELSS Mutual Funds"],["lifeInsurance","Life Insurance Premium"],["nsc","NSC"],["taxSavingFD","Tax-saving Fixed Deposits"],["tuitionFees","Eligible children's tuition fees"],["homeLoanPrincipal","Home Loan Principal Repayment"],["otherInvestments","Other eligible investments"]] as const).map(([key,label]) => <label key={key} className="rounded-lg border-emerald-500/20 bg-muted/15 p-3 text-xs font-mono"><span className="block mb-2">{label}</span><div className="relative"><span className="absolute left-2.5 top-2 text-muted-foreground">₹</span><input aria-label={label} title="Enter eligible payments made during this financial year; do not repeat the same payment in another category" type="number" min="0" step="1" value={section80c[key]} onChange={(e) => setSection80c(current => ({...current,[key]:Math.max(0,Number(e.target.value)||0)}))} className="w-full bg-background border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs" /></div></label>)}
            </div>
            {(() => { const r=calculateSection80C(section80c,financialYear,regime); return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="rounded-lg border-border/40 bg-card p-3"><p className="text-[10px] uppercase text-muted-foreground">Total investments</p><p className="text-lg font-bold">₹{r.totalInvested.toLocaleString("en-IN")}</p></div><div className="rounded-lg border-emerald-500/40 bg-emerald-500/10 p-3"><p className="text-[10px] uppercase text-muted-foreground">Eligible deduction ({regime})</p><p className="text-lg font-bold text-emerald-400">₹{r.eligibleDeduction.toLocaleString("en-IN")}</p></div><div className="rounded-lg border-amber-500/40 bg-amber-500/10 p-3"><p className="text-[10px] uppercase text-muted-foreground">Excess / disallowed</p><p className="text-lg font-bold text-amber-400">₹{r.excessInvestments.toLocaleString("en-IN")}</p></div></div>; })()}
            <p className="text-[10px] font-mono text-muted-foreground">Combined statutory cap ₹1,50,000. Add only eligible investments, without duplication. Section 80C is generally unavailable under the New Regime.</p>
          </div>

          {/* ── SECTION 3: SECTION 80D COMPREHENSIVE MEDICAL INSURANCE ── */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
                  2. Section 80D Health Insurance Matrix & Senior Citizen Rules
                </span>
              </div>
              <span className="text-xs font-mono text-sky-400 font-semibold">
                Statutory Limit: up to ₹1,00,000
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category A: Self, Spouse & Children */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider">
                      A. Self, Spouse & Dependent Children
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                    Cap: {isSelfSenior ? "₹50,000 (Senior)" : "₹25,000 (Standard)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Self & Spouse Health Premium (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={selfSpouseInsurance}
                        onChange={(e) => setSelfSpouseInsurance(e.target.value)}
                        placeholder="e.g. 20000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-sky-500/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Children Health Premium (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={childrenInsurance}
                        onChange={(e) => setChildrenInsurance(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-sky-500/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Senior Citizen Checkbox for Self */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-sky-500/20">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="selfSenior"
                      checked={isSelfSenior}
                      onChange={(e) => setIsSelfSenior(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-500 accent-sky-500 cursor-pointer"
                    />
                    <label htmlFor="selfSenior" className="text-xs font-mono text-foreground cursor-pointer">
                      Self or Spouse is Senior Citizen (Age 60+)
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400">
                    {isSelfSenior ? "+₹25k Cap Boost" : "Standard ₹25k"}
                  </span>
                </div>

                {/* Medical Expenditure for uninsured senior citizen */}
                {isSelfSenior && (
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Medical Expenditure for Uninsured Senior Citizen (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={selfMedicalExp}
                        onChange={(e) => setSelfMedicalExp(e.target.value)}
                        placeholder="e.g. 15000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-sky-500/60"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Category B: Parents */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider">
                      B. Parents Health Insurance
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                    Cap: {isParentsSenior ? "₹50,000 (Senior)" : "₹25,000 (Non-Senior)"}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                    Parents' Health Insurance Premium (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={parentsInsurance}
                      onChange={(e) => setParentsInsurance(e.target.value)}
                      placeholder="e.g. 35000"
                      className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-sky-500/60 font-semibold"
                    />
                  </div>
                </div>

                {/* Senior Citizen Checkbox for Parents */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-sky-500/20">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="parentsSenior"
                      checked={isParentsSenior}
                      onChange={(e) => setIsParentsSenior(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-500 accent-sky-500 cursor-pointer"
                    />
                    <label htmlFor="parentsSenior" className="text-xs font-mono text-foreground cursor-pointer">
                      Parents are Senior Citizens (Age 60+)
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">
                    {isParentsSenior ? "Eligible Cap: ₹50,000" : "Eligible Cap: ₹25,000"}
                  </span>
                </div>

                {/* Medical Expenditure for uninsured senior citizen parents */}
                {isParentsSenior && (
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Medical Expenditure for Uninsured Senior Parents (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={parentsMedicalExp}
                        onChange={(e) => setParentsMedicalExp(e.target.value)}
                        placeholder="e.g. 20000"
                        className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-sky-500/60"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preventive Health Check-up Row */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-foreground block">
                  Self / Family Preventive Health Check-up Expenses (₹)
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Statutory Sublimit: ₹5,000 overall (absorbed within category limits, not an extra allowance)
                </span>
              </div>
              <div className="relative w-44">
                <span className="absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">₹</span>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={preventiveCheckup}
                  onChange={(e) => setPreventiveCheckup(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-background border border-border/60 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-sky-500/60 text-right font-bold"
                />
              </div>
            </div>

            <div className="rounded-xl border-sky-500/25 bg-sky-950/10 p-4 flex-col sm:flex-row sm:items-center justify-between gap-3"><div><label className="text-xs font-mono font-bold">Parents' Preventive Check-up Expenses (₹)</label><p className="text-[10px] text-muted-foreground">Combined preventive allowance across groups capped at ₹5,000.</p></div><input aria-label="Parents preventive health check-up expenses" type="number" min="0" value={parentsPreventiveCheckup} onChange={(e)=>setParentsPreventiveCheckup(e.target.value)} className="w-full sm:w-44 bg-background border-border/60 rounded-lg px-3 py-1.5 text-xs" /></div>
            {/* Section 80D Live Deduction Badge & Disallowed Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border/40 bg-card p-3 text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Self / Family Eligible</p>
                <p className="font-display text-lg font-black text-sky-400">
                  ₹{current80DPreview.eligibleSelfFamily.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">Limit: ₹{current80DPreview.selfFamilyLimit.toLocaleString("en-IN")}</p>
              </div>

              <div className="rounded-lg border border-border/40 bg-card p-3 text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Parents Eligible</p>
                <p className="font-display text-lg font-black text-sky-400">
                  ₹{current80DPreview.eligibleParents.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">Limit: ₹{current80DPreview.parentsLimit.toLocaleString("en-IN")}</p>
              </div>

              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Total 80D Eligible</p>
                <p className="font-display text-lg font-black text-emerald-400">
                  ₹{current80DPreview.totalEligible80D.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] font-mono text-emerald-500 font-semibold">
                  {regime === "OLD" ? "Claimed in Old Regime" : "Disallowed in New"}
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Disallowed Amount</p>
                <p className="font-display text-lg font-black text-amber-400">
                  ₹{current80DPreview.disallowedAmount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] font-mono text-amber-500">
                  {current80DPreview.disallowedAmount > 0 ? "Exceeds Cap / Regime" : "Fully Allowed"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
