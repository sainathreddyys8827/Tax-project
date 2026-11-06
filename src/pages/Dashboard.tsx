import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, TrendingUp, Target, Zap, ChevronRight,
  ArrowRight, CheckCircle2, AlertTriangle, Info, Download,
  RefreshCw, DollarSign, BarChart2, Activity, Shield, Cpu,
  Radio, Lock, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { HRAOptimizer } from "@/components/HRAOptimizer";
import { TaxReportPDF } from "@/components/TaxReportPDF";
import { DeepAnalysisTab } from "@/components/DeepAnalysisTab";

import {
  FullTaxCalculationResult, computeFullTaxAnalysis,
  SalaryProfile, Section80DProfile
} from "@/lib/taxCalculations";
import { cn } from "@/lib/utils";

const SECTION_80C_LIMIT = 150000;

// ─── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ text, delay = 30 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);
  return <span>{displayed}<span className="animate-pulse opacity-70">|</span></span>;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "₹", duration = 800 }: { value: number; prefix?: string; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [value, duration]);
  return <span>{prefix}{current.toLocaleString("en-IN")}</span>;
}

// ─── Glowing Score Gauge ──────────────────────────────────────────────────────
function TaxGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);
  const circumference = 2 * Math.PI * 54;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const glowColor = score >= 80 ? "rgba(16,185,129,0.6)" : score >= 50 ? "rgba(245,158,11,0.6)" : "rgba(239,68,68,0.6)";
  const label = score >= 80 ? "Highly Optimized" : score >= 60 ? "Moderate" : "Needs Action";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-32">
        <svg className="w-44 h-44 -mt-6" viewBox="0 0 120 120">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <circle cx="60" cy="70" r="54" fill="none" stroke="hsl(222 30% 14%)" strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round" transform="rotate(135 60 70)" />
          <circle cx="60" cy="70" r="54" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${animated ? (score / 100) * circumference * 0.75 : 0} ${circumference}`}
            strokeLinecap="round" transform="rotate(135 60 70)" filter="url(#glow)"
            style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <div className="font-display text-4xl font-black" style={{ color, textShadow: `0 0 20px ${glowColor}` }}>
            {score}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono tracking-widest">/ 100</div>
        </div>
      </div>
      <p className="text-xs font-bold mt-2 font-mono tracking-wider" style={{ color }}>{label.toUpperCase()}</p>
    </div>
  );
}

// ─── Segmented Energy Bar ─────────────────────────────────────────────────────
function EnergyBar({ label, used, limit, color, icon: Icon }: { label: string; used: number; limit: number; color: string; icon: any }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min((used / (limit || 1)) * 100, 100)), 400);
    return () => clearTimeout(t);
  }, [used, limit]);
  const segments = 20;
  const filledSegments = Math.round((width / 100) * segments);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-sm font-mono font-semibold text-foreground tracking-wider">{label}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          <span style={{ color }}>₹{used.toLocaleString("en-IN")}</span> / ₹{limit.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className="flex-1 h-3.5 rounded-sm transition-all duration-700"
            style={{
              backgroundColor: i < filledSegments ? color : "hsl(222 30% 16%)",
              opacity: i < filledSegments ? (0.4 + (i / segments) * 0.6) : 1,
              transitionDelay: `${i * 30}ms`,
              boxShadow: i < filledSegments ? `0 0 4px ${color}60` : "none",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs font-mono text-muted-foreground">
        <span>{Math.round(width)}% utilized</span>
        <span style={{ color }}>₹{Math.max(0, limit - used).toLocaleString("en-IN")} headroom</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon, glow = false }: any) {
  return (
    <div className={cn(
      "relative rounded-xl border p-5 overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-default shadow-lg glass-morphism",
      glow ? "border-emerald-500/40 bg-emerald-950/40 shadow-emerald/10" : "border-white/10 bg-white/5"
    )}>
      {glow && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />}
      <div className="flex items-start justify-between mb-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", glow ? "bg-emerald-500/30 border border-emerald-500/40" : "bg-white/10 border border-white/10")}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase font-bold">{label}</span>
      </div>
      <div className="font-display text-3xl font-black tracking-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-2 font-mono font-medium">{sub}</div>}
    </div>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-xl text-xs font-mono">
        <p className="text-muted-foreground">{payload[0].payload.regime}</p>
        <p className="text-foreground font-bold">₹{payload[0].value.toLocaleString("en-IN")}</p>
      </div>
    );
  }
  return null;
};

// ─── Report Section ───────────────────────────────────────────────────────────
function ReportSection({ title, children, defaultOpen = false, icon: Icon = ChevronRight }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
        onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono font-semibold text-sm text-foreground tracking-wide">{title}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border/40 pt-4">{children}</div>}
    </div>
  );
}

// ─── Default Tax Analysis Generator ───────────────────────────────────────────
function generateDefaultTaxData() {
  const defaultSalary: SalaryProfile = {
    monthlyBasic: 80000,
    annualBasic: 960000,
    monthlyHRA: 30000,
    annualHRA: 360000,
    monthlyRent: 25000,
    annualRent: 300000,
    annualOtherIncome: 40000,
    isMetro: true,
  };

  const default80D: Section80DProfile = {
    selfSpouseInsurance: 22000,
    childrenInsurance: 0,
    parentsInsurance: 35000,
    isSelfSenior: false,
    isParentsSenior: true,
    preventiveCheckup: 5000,
    selfMedicalExp: 0,
    parentsMedicalExp: 0,
  };

  const analysis = computeFullTaxAnalysis(
    defaultSalary,
    default80D,
    150000,
    0,
    "2024-25",
    "OLD"
  );

  return {
    gross_income: analysis.grossIncome,
    total_deductions: analysis.totalOldDeductions,
    taxable_income: analysis.oldTaxableIncome,
    estimated_tax: analysis.oldRegimeTax,
    selectedRegime: "OLD",
    salary: defaultSalary,
    section80d: default80D,
    breakdown: {
      gross_income: analysis.grossIncome,
      standard_deduction: analysis.standardDeduction,
      "80c_deduction": analysis.d80c,
      "80d_deduction": analysis.d80d,
      hra_deduction: analysis.hraExemption,
      other_deductions: analysis.otherDeductions,
      old_taxable_income: analysis.oldTaxableIncome,
      new_taxable_income: analysis.newTaxableIncome,
      old_regime_tax: analysis.oldRegimeTax,
      new_regime_tax: analysis.newRegimeTax,
      tax_saved: analysis.taxSaved,
      recommended_regime: analysis.recommendedRegime,
      efficiency_score: analysis.efficiencyScore,
      selected_regime: "OLD",
      salary_profile: defaultSalary,
      section80c_profile: analysis.section80c,
      section80c_detailed: analysis.section80cResult,
      section_80d_profile: default80D,
      section_80d_detailed: analysis.section80dResult,
      financial_year: analysis.financialYear,
      old_tax_before_rebate: analysis.oldTaxBeforeRebate,
      new_tax_before_rebate: analysis.newTaxBeforeRebate,
      old_rebate: analysis.oldRebate,
      new_rebate: analysis.newRebate,
      old_cess: analysis.oldCess,
      new_cess: analysis.newCess,
      hra_detailed: analysis.hraResult,
    },
    summary: {
      gross_income: analysis.grossIncome,
      taxable_income: analysis.oldTaxableIncome,
      tax_payable: analysis.oldRegimeTax,
      insights: [
        `Under Old Regime, ₹${analysis.d80d.toLocaleString("en-IN")} claimed in Section 80D with senior parents limit of ₹50,000.`,
        `Section 10(13A) HRA exemption of ₹${analysis.hraExemption.toLocaleString("en-IN")} deducted based on Metro City formula.`,
        `Old Regime saves you ₹${analysis.taxSaved.toLocaleString("en-IN")} vs New Regime due to high deductions.`,
        "Section 80C is fully maximized at ₹1,50,000.",
      ],
    },
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [simulatorValue, setSimulatorValue] = useState([50000]);
  const [activeTab, setActiveTab] = useState<"overview" | "report" | "simulator" | "deep">("overview");
  const [taxData, setTaxData] = useState<any>(null);
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    const rawData = localStorage.getItem("taxAnalysisData");
    if (rawData) {
      try {
        let parsed = JSON.parse(rawData);
        const savedProfileRaw = localStorage.getItem("taxProfileData");
        if (savedProfileRaw) {
          try {
            const savedProfile = JSON.parse(savedProfileRaw);
            const breakdown = parsed.breakdown || {};
            const d80d = breakdown["80d_deduction"] || 0;
            const hra = breakdown.hra_deduction || 0;
            const salary = savedProfile.salary;
            const sec80d = savedProfile.section80d;
            if ((d80d === 0 || hra === 0) && (salary || sec80d)) {
              const d80c = breakdown["80c_deduction"] ?? 150000;
              const fullRes = computeFullTaxAnalysis(
                salary || { monthlyBasic: 0, annualBasic: 0, monthlyHRA: 0, annualHRA: 0, monthlyRent: 0, annualRent: 0, annualOtherIncome: 0, isMetro: true },
                sec80d || { selfSpouseInsurance: 0, childrenInsurance: 0, parentsInsurance: 0, isSelfSenior: false, isParentsSenior: false, preventiveCheckup: 0, selfMedicalExp: 0, parentsMedicalExp: 0, parentsUninsured: false },
                d80c,
                breakdown.other_deductions || 0,
                parsed.financial_year || savedProfile.financialYear || "2024-25",
                savedProfile.regime || parsed.selectedRegime || "OLD"
              );
              parsed.breakdown = {
                ...breakdown,
                gross_income: fullRes.grossIncome || breakdown.gross_income,
                "80c_deduction": fullRes.d80c,
                "80d_deduction": fullRes.d80d,
                hra_deduction: fullRes.hraExemption,
                old_taxable_income: fullRes.oldTaxableIncome,
                new_taxable_income: fullRes.newTaxableIncome,
                old_regime_tax: fullRes.oldRegimeTax,
                new_regime_tax: fullRes.newRegimeTax,
                tax_saved: fullRes.taxSaved,
                recommended_regime: fullRes.recommendedRegime,
                efficiency_score: fullRes.efficiencyScore,
                section_80d_detailed: fullRes.section80dResult,
                hra_detailed: fullRes.hraResult,
              };
              parsed.gross_income = fullRes.grossIncome || parsed.gross_income;
              parsed.total_deductions = fullRes.selectedRegime === "OLD" ? fullRes.totalOldDeductions : fullRes.standardDeduction;
              parsed.taxable_income = fullRes.selectedRegime === "OLD" ? fullRes.oldTaxableIncome : fullRes.newTaxableIncome;
              parsed.estimated_tax = fullRes.taxPayable;
              parsed.salary = salary;
              parsed.section80d = sec80d;
              localStorage.setItem("taxAnalysisData", JSON.stringify(parsed));
            }
          } catch (e) {
            console.error("Error auto-syncing taxProfileData with taxAnalysisData:", e);
          }
        }
        setTaxData(parsed);
      } catch (e) {
        const fallback = generateDefaultTaxData();
        setTaxData(fallback);
        localStorage.setItem("taxAnalysisData", JSON.stringify(fallback));
      }
    } else {
      const fallback = generateDefaultTaxData();
      setTaxData(fallback);
      localStorage.setItem("taxAnalysisData", JSON.stringify(fallback));
    }
  }, []);

  // Handler for live updates from SalaryAndDeductionManager
  const handleLiveAnalysisChange = (analysis: FullTaxCalculationResult) => {
    const currentTaxData = taxData || {};
    const updatedData = {
      ...currentTaxData,
      gross_income: analysis.grossIncome,
      total_deductions: analysis.selectedRegime === "OLD" ? analysis.totalOldDeductions : analysis.standardDeduction,
      taxable_income: analysis.selectedRegime === "OLD" ? analysis.oldTaxableIncome : analysis.newTaxableIncome,
      estimated_tax: analysis.taxPayable,
      selectedRegime: analysis.selectedRegime,
      salary: analysis.salary,
      section80c: analysis.section80c,
      section80d: analysis.section80d,
      financial_year: analysis.financialYear,
      financialYear: analysis.financialYear,
      breakdown: {
        ...(currentTaxData.breakdown || {}),
        gross_income: analysis.grossIncome,
        standard_deduction: analysis.standardDeduction,
        new_regime_std_deduction: analysis.financialYear === "2023-24" ? 50000 : 75000,
        "80c_deduction": analysis.d80c,
        "80d_deduction": analysis.d80d,
        hra_deduction: analysis.hraExemption,
        other_deductions: analysis.otherDeductions,
        old_taxable_income: analysis.oldTaxableIncome,
        new_taxable_income: analysis.newTaxableIncome,
        old_regime_tax: analysis.oldRegimeTax,
        new_regime_tax: analysis.newRegimeTax,
        tax_saved: analysis.taxSaved,
        recommended_regime: analysis.recommendedRegime,
        efficiency_score: analysis.efficiencyScore,
        selected_regime: analysis.selectedRegime,
        salary_profile: analysis.salary,
        section80c_profile: analysis.section80c,
        section80c_detailed: analysis.section80cResult,
        section_80c_profile: analysis.section80c,
        section_80c_detailed: analysis.section80cResult,
        section_80d_profile: analysis.section80d,
        section_80d_detailed: analysis.section80dResult,
        hra_detailed: analysis.hraResult,
        financial_year: analysis.financialYear,
        old_tax_before_rebate: analysis.oldTaxBeforeRebate,
        new_tax_before_rebate: analysis.newTaxBeforeRebate,
        old_rebate: analysis.oldRebate,
        new_rebate: analysis.newRebate,
        old_cess: analysis.oldCess,
        new_cess: analysis.newCess,
      },
      summary: {
        ...(currentTaxData.summary || {}),
        gross_income: analysis.grossIncome,
        taxable_income: analysis.selectedRegime === "OLD" ? analysis.oldTaxableIncome : analysis.newTaxableIncome,
        tax_payable: analysis.taxPayable,
        insights: [
          analysis.selectedRegime === "NEW"
            ? "New Tax Regime is active: Standard deduction of ₹75,000 applies. Section 80D & HRA are excluded."
            : `Old Tax Regime is active: ₹${analysis.d80d.toLocaleString("en-IN")} claimed under Section 80D, ₹${analysis.hraExemption.toLocaleString("en-IN")} claimed under HRA.`,
          analysis.taxSaved > 0
            ? `The ${analysis.recommendedRegime} Regime saves you ₹${analysis.taxSaved.toLocaleString("en-IN")} compared to the other regime.`
            : "Both tax regimes yield equal tax liability for your income profile.",
          analysis.section80dResult.disallowedAmount > 0
            ? `₹${analysis.section80dResult.disallowedAmount.toLocaleString("en-IN")} in health insurance premiums exceeds statutory caps and is disallowed.`
            : "Section 80D health insurance premiums are fully optimized within eligible statutory caps.",
          `Section 80C is utilized at ₹${analysis.d80c.toLocaleString("en-IN")} / ₹1,50,000.`,
        ],
      },
    };

    setTaxData(updatedData);
    localStorage.setItem("taxAnalysisData", JSON.stringify(updatedData));
  };

  if (!taxData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-primary animate-pulse" />
            <Brain className="absolute inset-0 m-auto h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-mono text-muted-foreground tracking-wider">INITIALIZING INTELLIGENCE ENGINE...</p>
        </div>
      </div>
    );
  }

  const breakdown = taxData.breakdown || {};
  const summary = taxData.summary || {};
  const efficiencyScore = breakdown.efficiency_score || 0;
  const insights: string[] = summary.insights || [];

  const gross = breakdown.gross_income || 0;
  const oldTax = breakdown.old_regime_tax || 0;
  const newTax = breakdown.new_regime_tax || 0;
  const taxSaved = breakdown.tax_saved || 0;
  const rec = breakdown.recommended_regime || "NEW";
  const selectedRegime = taxData.selectedRegime || breakdown.selected_regime || "OLD";

  const d80c = breakdown["80c_deduction"] || 0;
  const d80d = breakdown["80d_deduction"] || 0;
  const hraExempt = breakdown.hra_deduction || 0;

  // Dynamic Section 80D statutory limit based on senior citizen status
  const sec80dDetailed = breakdown.section80d_detailed || {};
  const isParentsSenior = taxData?.section80d?.isParentsSenior ?? taxData?.section_80d_profile?.is_parents_senior ?? taxData?.section_80d_profile?.isParentsSenior ?? false;
  const sec80dLimit = (sec80dDetailed.self_family_limit || sec80dDetailed.selfFamilyLimit || 25000) + (sec80dDetailed.parents_limit || sec80dDetailed.parentsLimit || (isParentsSenior ? 50000 : 25000));

  const unused80C = Math.max(0, SECTION_80C_LIMIT - d80c);
  const unused80D = Math.max(0, sec80dLimit - d80d);
  const totalUnused = unused80C + unused80D;

  const simTaxSaving = Math.round(simulatorValue[0] * 0.312); // Standard 30% slab + 4% cess

  const regimeData = [
    { regime: "Old Regime", tax: oldTax, fill: "#10b981" },
    { regime: "New Regime", tax: newTax, fill: "#3b82f6" },
  ];

  const tabs = [
    { key: "overview", label: "INTELLIGENCE HQ", icon: Cpu },
    { key: "report", label: "AI REPORT", icon: Brain },
    { key: "simulator", label: "WHAT-IF ENGINE", icon: Activity },
    { key: "deep", label: "DEEP ANALYSIS", icon: Target },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* PDF Overlay */}
      {showPDF && taxData && (
        <TaxReportPDF data={taxData} onClose={() => setShowPDF(false)} />
      )}

      {/* ── Command Bar ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-2xl shadow-sm glass-morphism">
        <div className="container flex h-14 items-center justify-between gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
              <Brain className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-display text-lg font-black tracking-tight text-white">
              TaxMind<span className="text-emerald-400 text-glow">AI</span>
            </span>
          </button>

          {/* Tab Bar */}
          <nav className="flex items-center gap-1 bg-muted/40 border border-border/50 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono font-bold text-xs tracking-wider transition-all duration-200",
                    activeTab === tab.key
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                  <Icon className="h-3 w-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              SYSTEM ONLINE
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs border-border/50" onClick={() => navigate("/upload")}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Statement Upload
            </Button>
            <Button size="sm" className="h-8 text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-bold" onClick={() => setShowPDF(true)}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">

        {/* ── OVERVIEW TAB ────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {/* Alert banner */}
            {totalUnused > 0 && selectedRegime === "OLD" && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 animate-pulse" />
                <p className="text-xs font-mono text-foreground">
                  <span className="text-amber-400 font-bold">OPTIMIZATION OPPORTUNITY:</span>{" "}
                  ₹{totalUnused.toLocaleString("en-IN")} in deductions untapped under Old Regime (80C + 80D capacity)
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("simulator")}
                  className="ml-auto h-6 text-[10px] border-amber-500/40 text-amber-400 hover:bg-amber-500/10 flex-shrink-0"
                >
                  SIMULATE SAVINGS <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}

            {/* ── Row 1: Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="GROSS INCOME"
                value={<AnimatedNumber value={gross} />}
                sub={`Monthly ₹${Math.round(gross / 12).toLocaleString("en-IN")}`}
                color="#10b981"
                icon={TrendingUp}
                glow
              />
              <StatCard
                label="TAX PAYABLE"
                value={<AnimatedNumber value={selectedRegime === "OLD" ? oldTax : newTax} />}
                sub={`Under ${selectedRegime} Regime`}
                color={selectedRegime === "NEW" ? "#3b82f6" : "#10b981"}
                icon={DollarSign}
              />
              <StatCard
                label="TAX SAVED"
                value={<AnimatedNumber value={taxSaved} />}
                sub={`Comparing Old vs New`}
                color="#f59e0b"
                icon={Zap}
              />
              <StatCard
                label="OPT. SCORE"
                value={`${efficiencyScore}/100`}
                sub={efficiencyScore >= 70 ? "Highly optimized" : "Room to improve"}
                color={efficiencyScore >= 70 ? "#10b981" : "#f59e0b"}
                icon={Target}
              />
            </div>

            {/* ── Row 2: Gauge + Deductions + Regime ── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Gauge panel */}
              <div className="md:col-span-3 rounded-xl border border-border/50 bg-card/60 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 text-[11px] font-mono text-muted-foreground tracking-widest">EFFICIENCY INDEX</div>
                <TaxGauge score={efficiencyScore} />
                <div className="mt-4 w-full space-y-2.5">
                  {[
                    { label: "80C utilization", val: Math.round((d80c / SECTION_80C_LIMIT) * 100) },
                    { label: "80D utilization", val: Math.round((d80d / (sec80dLimit || 1)) * 100) },
                    { label: "Regime alignment", val: rec === selectedRegime ? 100 : 50 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-muted-foreground w-28 flex-shrink-0">{item.label}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, item.val)}%` }} />
                      </div>
                      <span className="text-emerald-400 w-8 text-right">{Math.min(100, item.val)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deduction Meters */}
              <div className="md:col-span-5 rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-mono font-bold tracking-wider text-foreground">DEDUCTION MATRIX</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {selectedRegime === "OLD" ? "Old Regime Active" : "New Regime (Std Ded Only)"}
                  </span>
                </div>

                <EnergyBar label="SECTION 80C" used={d80c} limit={SECTION_80C_LIMIT} color="#10b981" icon={TrendingUp} />
                <EnergyBar label="SECTION 80D" used={d80d} limit={sec80dLimit} color="#38bdf8" icon={Shield} />
                {hraExempt > 0 && (
                  <EnergyBar label="HRA EXEMPTION" used={hraExempt} limit={Math.max(hraExempt, 300000)} color="#a78bfa" icon={Lock} />
                )}

                <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">TOTAL DEDUCTIONS CLAIMED</span>
                  <span className="text-base font-mono font-bold text-emerald-400">
                    ₹{(selectedRegime === "OLD" ? (d80c + d80d + hraExempt + 50000) : 75000).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Regime Comparison */}
              <div className="md:col-span-4 rounded-xl border border-border/50 bg-card/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-mono font-bold tracking-wider text-foreground">REGIME COMPARISON</span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={regimeData} barSize={36} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="oldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" vertical={false} />
                    <XAxis dataKey="regime" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 9, fontFamily: "monospace" }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="tax" radius={[4, 4, 0, 0]}>
                      {regimeData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "url(#oldGrad)" : "url(#newGrad)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-mono text-muted-foreground tracking-widest">RECOMMENDED</p>
                    <p className="text-lg font-display font-black text-emerald-400">{rec} REGIME</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-mono text-muted-foreground tracking-widest">SAVES</p>
                    <p className="text-lg font-display font-black text-amber-400">₹{taxSaved.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── AI Intelligence Feed ── */}
            {insights.length > 0 && (
              <div className="rounded-xl border border-emerald-500/30 bg-[#020f0a] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span className="text-sm font-mono font-black text-emerald-400 tracking-wider text-glow uppercase">AI Intelligence Signal Engine</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-600">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    LIVE — {insights.length} SIGNAL{insights.length !== 1 ? "S" : ""} DETECTED
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 group cursor-default">
                      <div className="flex-shrink-0 mt-0.5">
                        <Zap className="h-4 w-4 text-emerald-500 group-hover:text-emerald-300 transition-colors" />
                      </div>
                      <p className="text-sm font-mono text-emerald-600 group-hover:text-emerald-400 transition-colors leading-relaxed">
                        <span className="text-emerald-500 mr-2">[{String(idx + 1).padStart(2, "0")}]</span>
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tax Breakdown Table ── */}
            <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono font-bold tracking-wider text-foreground">
                  INCOME TAX COMPUTATION — FY 2024–25 (AY 2025–26)
                </span>
                <span className="ml-auto text-xs font-mono bg-primary/15 text-primary px-2 py-0.5 rounded">
                  {selectedRegime} REGIME APPLIED
                </span>
              </div>
              <div className="p-5">
                <div className="space-y-2 font-mono text-sm">
                  {[
                    { label: "Gross Income (Annual Basic + HRA + Other)", value: `₹${gross.toLocaleString("en-IN")}`, color: "text-foreground", indent: false, bold: true },
                    { label: "(-) Standard Deduction", value: selectedRegime === "OLD" ? "-₹50,000" : "-₹75,000", color: "text-emerald-400", indent: true },
                    { label: "(-) Section 80C (LIC, ELSS, PPF)", value: selectedRegime === "OLD" ? `-₹${d80c.toLocaleString("en-IN")}` : "Not Permitted (₹0)", color: selectedRegime === "OLD" ? "text-emerald-400" : "text-muted-foreground", indent: true },
                    { label: "(-) Section 80D Health Insurance", value: selectedRegime === "OLD" ? `-₹${d80d.toLocaleString("en-IN")}` : "Not Permitted (₹0)", color: selectedRegime === "OLD" ? "text-sky-400" : "text-muted-foreground", indent: true },
                    { label: "(-) Section 10(13A) HRA Exemption", value: selectedRegime === "OLD" ? `-₹${hraExempt.toLocaleString("en-IN")}` : "Not Permitted (₹0)", color: selectedRegime === "OLD" ? "text-purple-400" : "text-muted-foreground", indent: true },
                  ].map((row) => (
                    <div key={row.label} className={cn("flex justify-between py-2 border-b border-border/20", row.indent && "pl-5")}>
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={cn(row.color, row.bold && "font-bold")}>{row.value}</span>
                    </div>
                  ))}

                  <div className="flex justify-between py-2.5 mt-1 border-b border-border/30">
                    <span className="font-bold text-foreground">= Net Taxable Income (Old Regime)</span>
                    <span className="font-bold text-emerald-400">₹{(breakdown.old_taxable_income || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-border/30">
                    <span className="font-bold text-foreground">= Net Taxable Income (New Regime)</span>
                    <span className="font-bold text-blue-400">₹{(breakdown.new_taxable_income || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-semibold text-foreground">Old Regime Tax (incl 4% Cess)</span>
                    <span className="font-bold text-emerald-400">₹{oldTax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-semibold text-foreground">New Regime Tax (incl 4% Cess)</span>
                    <span className="font-bold text-blue-400">₹{newTax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t border-emerald-500/30 mt-2 bg-emerald-500/5 px-3 -mx-3 rounded-lg">
                    <span className="font-bold text-emerald-400">✓ Recommended: {rec} Regime</span>
                    <span className="font-bold text-emerald-400">Save ₹{taxSaved.toLocaleString("en-IN")} / year</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── REPORT TAB ──────────────────────────────────────── */}
        {activeTab === "report" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-5 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/20 flex-shrink-0">
                <Brain className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-mono font-black text-emerald-400 tracking-wider mb-1">AI PERSONALIZED TAX REPORT</h2>
                <p className="text-xs text-muted-foreground font-mono">
                  Real-time statutory computation • FY 2024–25 (AY 2025–26) • Complete Section 10(13A) & 80D Integration
                </p>
              </div>
            </div>

            <ReportSection title="FINANCIAL BEHAVIOR SIGNALS" defaultOpen icon={Radio}>
              <div className="space-y-2.5">
                {[
                  { label: `Annual Basic Salary: ₹${(taxData?.salary?.annualBasic || Math.round(gross * 0.6)).toLocaleString("en-IN")} (Monthly ₹${(taxData?.salary?.monthlyBasic || Math.round(gross / 20)).toLocaleString("en-IN")})`, type: "ok" },
                  { label: d80c > 0 ? `Section 80C: ₹${d80c.toLocaleString("en-IN")} invested` : "No 80C investments detected this year", type: d80c > 0 ? "ok" : "warn" },
                  { label: d80d > 0 ? `Section 80D: ₹${d80d.toLocaleString("en-IN")} eligible health insurance deduction (Cap: ₹${sec80dLimit.toLocaleString("en-IN")})` : "No health insurance premium detected", type: d80d > 0 ? "ok" : "warn" },
                  { label: hraExempt > 0 ? `Section 10(13A) HRA: ₹${hraExempt.toLocaleString("en-IN")} tax-free rent exemption claimed` : "No HRA exemption claimed", type: hraExempt > 0 ? "ok" : "info" },
                  { label: unused80C > 0 ? `₹${unused80C.toLocaleString("en-IN")} of 80C capacity still unused` : "80C fully utilized — excellent!", type: unused80C > 0 ? "warn" : "ok" },
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm font-mono">
                    {b.type === "ok" ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      : b.type === "warn" ? <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0 animate-pulse" />
                        : <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />}
                    <span className={b.type === "warn" ? "text-amber-300" : b.type === "ok" ? "text-emerald-300" : "text-muted-foreground"}>{b.label}</span>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* Smart HRA Optimizer embedded in report */}
            <div className="mt-2">
              <HRAOptimizer
                initialBasic={taxData?.salary?.annualBasic || Math.round(gross * 0.6)}
                initialHra={taxData?.salary?.annualHRA || Math.round(gross * 0.25)}
                initialRent={taxData?.salary?.annualRent || Math.round(gross * 0.2)}
                initialIsMetro={taxData?.salary?.isMetro ?? true}
              />
            </div>

            <ReportSection title="REGIME JUSTIFICATION" defaultOpen icon={BarChart2}>
              <div className="space-y-3 text-xs font-mono text-muted-foreground leading-relaxed">
                <p>Your gross income is ₹{gross.toLocaleString("en-IN")}. Under the <span className="text-emerald-400">Old Regime</span>, total deductions are ₹{(d80c + d80d + hraExempt + 50000).toLocaleString("en-IN")}, giving a tax of ₹{oldTax.toLocaleString("en-IN")}. Under the <span className="text-blue-400">New Regime</span>, tax is ₹{newTax.toLocaleString("en-IN")}.</p>
                <p>{rec === "OLD" ? "Your eligible deductions exceed the break-even threshold. Sticking with the Old Regime is mathematically superior." : "Your deductions are below the threshold. The New Regime's broader slabs and ₹75,000 standard deduction deliver higher savings."}</p>
                <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <span className="text-emerald-400 font-bold">VERDICT: {rec === "OLD" ? "Stick with" : "Switch to"} {rec} REGIME — saves ₹{taxSaved.toLocaleString("en-IN")}/year</span>
                </div>
              </div>
            </ReportSection>

            <ReportSection title="STEP-BY-STEP ACTION PLAN" icon={CheckCircle2}>
              <div className="space-y-3">
                {[
                  { by: "JAN 31", action: `Invest ₹${unused80C.toLocaleString("en-IN")} in ELSS mutual funds to max 80C capacity`, priority: "HIGH" },
                  { by: "FEB 15", action: `Ensure parents health insurance receipts are collected (eligibility: ₹${sec80dLimit.toLocaleString("en-IN")})`, priority: "HIGH" },
                  { by: "FEB 28", action: "Open NPS Tier-1, contribute ₹50,000 for Section 80CCD(1B) extra benefit", priority: "MED" },
                  { by: "MAR 31", action: "Submit rent agreement and rent receipts to employer for HRA exemption", priority: "HIGH" },
                  { by: "JUL 31", action: `File ITR under ${rec} Regime with all verified deductions`, priority: "CRITICAL" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs font-mono">
                    <span className="bg-muted border border-border/60 rounded px-1.5 py-0.5 text-emerald-400 flex-shrink-0 mt-0.5">{item.by}</span>
                    <span className="text-foreground flex-1 leading-relaxed">{item.action}</span>
                    <span className={cn(
                      "text-[9px] rounded px-1.5 py-0.5 font-bold flex-shrink-0 mt-0.5",
                      item.priority === "CRITICAL" ? "bg-amber-500/20 text-amber-400" :
                        item.priority === "HIGH" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                    )}>{item.priority}</span>
                  </div>
                ))}
              </div>
            </ReportSection>
          </div>
        )}

        {/* ── WHAT-IF SIMULATOR TAB ──────────────────────────── */}
        {activeTab === "simulator" && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="rounded-xl border border-border/50 bg-card/60 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h2 className="font-mono font-black text-foreground tracking-wider">WHAT-IF TAX SIMULATOR</h2>
              </div>
              <p className="text-xs font-mono text-muted-foreground mb-6">
                Simulate additional Section 80C investments and see immediate tax savings in rupees.
              </p>

              {/* Slider */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">Additional 80C Investment</span>
                  <span className="font-display text-2xl font-black text-emerald-400">₹{simulatorValue[0].toLocaleString("en-IN")}</span>
                </div>
                <Slider value={simulatorValue} onValueChange={setSimulatorValue} min={0} max={150000} step={5000} className="mb-2" />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>₹0</span><span>₹1.5L (Max 80C)</span>
                </div>

                {/* Outputs */}
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-center">
                    <p className="text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Investment</p>
                    <p className="font-display text-xl font-black text-foreground">₹{simulatorValue[0].toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                    <p className="text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Tax Reduction</p>
                    <p className="font-display text-xl font-black text-emerald-400">−₹{simTaxSaving.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                    <p className="text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">Instant Return</p>
                    <p className="font-display text-xl font-black text-amber-400">31.2%</p>
                  </div>
                </div>

                {simulatorValue[0] > 0 && (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/8 px-4 py-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground">
                      Investing <span className="text-blue-400 font-bold">₹{simulatorValue[0].toLocaleString("en-IN")}</span> in ELSS reduces your tax liability by{" "}
                      <span className="text-emerald-400 font-bold">₹{simTaxSaving.toLocaleString("en-IN")}</span> before accounting for any fund returns.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 80C Slot Planner */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-mono font-bold tracking-wider text-foreground">80C INSTRUMENTS COMPARISON</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "ELSS Mutual Fund", lock: "3yr", returns: "12-15% p.a.", liquidity: "Moderate" },
                  { name: "PPF (Public Provident Fund)", lock: "15yr", returns: "7.1% p.a.", liquidity: "Low" },
                  { name: "NSC (National Savings Cert)", lock: "5yr", returns: "7.7% p.a.", liquidity: "Low" },
                  { name: "Tax Saver FD", lock: "5yr", returns: "6-7.5% p.a.", liquidity: "Very Low" },
                  { name: "NPS Tier-1 (80CCD)", lock: "Till 60", returns: "8-10% p.a.", liquidity: "Very Low" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-border/60 transition-colors cursor-default">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-semibold text-foreground">{item.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Expected: {item.returns}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Lock: {item.lock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DEEP ANALYSIS TAB ──────────────────────────────── */}
        {activeTab === "deep" && (
          <div className="container py-2">
            <DeepAnalysisTab taxData={taxData} />
          </div>
        )}
      </div>
    </div>
  );
}
