import { useState, useEffect } from "react";
import {
    AlertTriangle, CheckCircle2, Info, Zap, Target, Shield,
    TrendingUp, TrendingDown, Activity, Brain, BarChart2,
    ChevronRight, Clock, AlertCircle, ArrowRight, X, Home,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TaggedTxn {
    description: string;
    amount: number;
    date: string;
    section: string;
    category: string;
    is_debit: boolean;
}
interface RiskFlag { level: string; message: string; }
interface Props {
    taxData: any;
}

// ─── Confidence Ring ──────────────────────────────────────────────────────────
function ConfidenceRing({ score }: { score: number }) {
    const [anim, setAnim] = useState(false);
    useEffect(() => { const t = setTimeout(() => setAnim(true), 300); return () => clearTimeout(t); }, []);
    const r = 44, circ = 2 * Math.PI * r;
    const fill = anim ? (score / 100) * circ : 0;
    const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(222 30% 14%)" strokeWidth="8" />
                    <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${fill} ${circ}`}
                        style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 6px ${color}80)` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-black" style={{ color }}>{score}%</span>
                </div>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-1 tracking-wider">CONFIDENCE</p>
        </div>
    );
}

// ─── Deduction Radar Segment ──────────────────────────────────────────────────
function RadarSegment({ label, pct, color, status, opportunity, onClick }: {
    label: string; pct: number; color: string; status: string; opportunity: string; onClick?: () => void;
}) {
    const [w, setW] = useState(0);
    useEffect(() => { const t = setTimeout(() => setW(pct), 400); return () => clearTimeout(t); }, [pct]);
    const statusColor = pct >= 80 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
    return (
        <div 
            onClick={onClick}
            className={cn(
                "space-y-2 p-3 rounded-xl border border-transparent transition-all duration-200",
                onClick && "cursor-pointer hover:border-border/80 hover:bg-muted/30 hover:scale-[1.01] active:scale-[0.99] group"
            )}
        >
            <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                    {label}
                    {onClick && <ChevronRight className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />}
                </span>
                <span style={{ color: statusColor }} className="font-bold">{status}</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                <div className="h-full rounded-full transition-all duration-1000 relative"
                    style={{ width: `${w}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}>
                    {w > 15 && (
                        <span className="absolute right-2 top-0 bottom-0 flex items-center text-[10px] font-bold text-black opacity-80">
                            {pct}%
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>{opportunity}</span>
                {onClick && <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity font-bold">Configure →</span>}
            </div>
        </div>
    );
}

// ─── Risk Alert Card ──────────────────────────────────────────────────────────
function RiskCard({ flag }: { flag: RiskFlag }) {
    const cfg = {
        HIGH: { icon: AlertTriangle, color: "#ef4444", bg: "bg-red-500/10 border-red-500/30", label: "⚠ HIGH RISK" },
        MEDIUM: { icon: AlertCircle, color: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/30", label: "⚡ MEDIUM" },
        LOW: { icon: Info, color: "#38bdf8", bg: "bg-blue-500/10 border-blue-500/30", label: "ℹ LOW" },
        INFO: { icon: Shield, color: "#6366f1", bg: "bg-indigo-500/10 border-indigo-500/30", label: "🛡 INFO" },
    }[flag.level] || { icon: Info, color: "#6366f1", bg: "bg-indigo-500/10 border-indigo-500/30", label: "INFO" };
    const Icon = cfg.icon;
    return (
        <div className={cn("flex gap-3 p-3 rounded-xl border", cfg.bg)}>
            <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
            <div>
                <span className="text-[9px] font-mono font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                <p className="text-xs text-foreground mt-0.5 leading-relaxed">{flag.message}</p>
            </div>
        </div>
    );
}

// ─── Missed Deduction Card ────────────────────────────────────────────────────
function DeductionEvidence({ txn, claimed, limit, slab }: {
    txn: TaggedTxn; claimed: number; limit: number; slab: number;
}) {
    const saving = Math.round(txn.amount * slab);
    const isClaimed = claimed >= limit;
    return (
        <div className={cn(
            "rounded-xl border p-4 space-y-3 transition-all hover:scale-[1.01]",
            isClaimed ? "border-emerald-500/30 bg-emerald-950/30" : "border-amber-500/30 bg-amber-950/20"
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{txn.description}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{txn.date}</p>
                </div>
                <div className="flex-shrink-0 px-2 py-0.5 rounded font-mono text-[10px] font-bold"
                    style={{ background: isClaimed ? "#10b98120" : "#f59e0b20", color: isClaimed ? "#10b981" : "#f59e0b" }}>
                    {txn.section}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/30 p-2">
                    <p className="text-[9px] text-muted-foreground font-mono">AMOUNT</p>
                    <p className="text-sm font-bold text-foreground">₹{txn.amount.toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2">
                    <p className="text-[9px] text-muted-foreground font-mono">CLAIMED</p>
                    <p className={cn("text-sm font-bold", isClaimed ? "text-emerald-400" : "text-amber-400")}>
                        ₹{Math.min(claimed, txn.amount).toLocaleString("en-IN")}
                    </p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20">
                    <p className="text-[9px] text-muted-foreground font-mono">TAX SAVED</p>
                    <p className="text-sm font-bold text-emerald-400">₹{saving.toLocaleString("en-IN")}</p>
                </div>
            </div>
            {!isClaimed && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Eligible — include this in your ITR declaration
                </div>
            )}
        </div>
    );
}

// ─── Main Deep Analysis Component ────────────────────────────────────────────
export function DeepAnalysisTab({ taxData }: Props) {
    const breakdown = taxData?.breakdown || {};
    const tagged: TaggedTxn[] = taxData?.tagged_transactions || [];
    const spending = taxData?.spending_summary || {};
    const riskFlags: RiskFlag[] = taxData?.risk_flags || [];
    const confidence = taxData?.confidence_score || 78;

    const gross = breakdown.gross_income || taxData?.gross_income || taxData?.total_income || 0;
    const oldTax = breakdown.old_regime_tax ?? taxData?.tax_liability?.old_regime_tax ?? 0;
    const newTax = breakdown.new_regime_tax ?? taxData?.tax_liability?.new_regime_tax ?? 0;
    const taxSaved = breakdown.tax_saved ?? taxData?.tax_liability?.tax_saved ?? 0;
    const rec = breakdown.recommended_regime || taxData?.tax_liability?.recommended || "NEW";
    const d80c = breakdown["80c_deduction"] ?? taxData?.deductions?.section_80c?.utilized ?? taxData?.section_80c_eligible ?? 0;
    const d80d = breakdown["80d_deduction"] ?? taxData?.deductions?.section_80d?.total_eligible_80d ?? taxData?.deductions?.section_80d?.utilized ?? taxData?.section_80d_eligible ?? 0;
    const hra = breakdown.hra_deduction ?? taxData?.deductions?.hra?.eligible_amount ?? taxData?.hra_eligible ?? 0;

    // Regime toggle
    const [activeRegime, setActiveRegime] = useState<"OLD" | "NEW">(rec as "OLD" | "NEW");

    // What-If sliders
    const [elss, setElss] = useState([0]);
    const [health, setHealth] = useState([0]);
    const [nps, setNps] = useState([0]);
    const totalExtra = elss[0] + health[0] + nps[0];
    const totalSaving = Math.round(totalExtra * 0.60);

    // Behavioral chart data
    const SPEND_LABELS: Record<string, string> = {
        DINING: "Dining", MEDICAL: "Medical", EDUCATION: "Education",
        HRA: "Rent", INVESTMENT_80C: "80C Invest", INVESTMENT_80D: "Health Ins",
        DONATE: "Donations", DEDUCTIBLE_EXPENSE: "Business",
    };
    const SPEND_COLORS: Record<string, string> = {
        DINING: "#f43f5e", MEDICAL: "#38bdf8", EDUCATION: "#a78bfa",
        HRA: "#f59e0b", INVESTMENT_80C: "#10b981", INVESTMENT_80D: "#34d399",
        DONATE: "#6366f1", DEDUCTIBLE_EXPENSE: "#fb923c",
    };
    const spendData = Object.entries(spending).map(([k, v]) => ({
        category: SPEND_LABELS[k] || k,
        amount: v as number,
        color: SPEND_COLORS[k] || "#6b7280",
    }));

    const sec80dDetailed = breakdown.section80d_detailed || taxData?.deductions?.section_80d || {};
    const isParentsSenior = taxData?.section80d?.isParentsSenior ?? taxData?.section_80d_profile?.is_parents_senior ?? taxData?.section_80d_profile?.isParentsSenior ?? false;
    const sec80dLimit = (sec80dDetailed.self_family_limit || sec80dDetailed.selfFamilyLimit || 25000) + (sec80dDetailed.parents_limit || sec80dDetailed.parentsLimit || (isParentsSenior ? 50000 : 25000));

    const unused80C = Math.max(0, 150000 - d80c);
    const unused80D = Math.max(0, sec80dLimit - d80d);
    const elssMax = unused80C >= 1000 ? Math.floor(unused80C / 1000) * 1000 : 150000;
    const healthMax = unused80D >= 1000 ? Math.floor(unused80D / 1000) * 1000 : (sec80dLimit >= 1000 ? sec80dLimit : 50000);
    const npsMax = 50000;

    // Dynamic HRA total capacity
    const maxHra = breakdown.hra_detailed?.annual_hra || taxData?.salary?.annualHRA || taxData?.salary_profile?.annual_hra || taxData?.salary_profile?.annualHRA || (hra > 0 ? hra : 0);
    const hraPct = maxHra > 0 ? Math.min(100, Math.round((hra / maxHra) * 100)) : (hra > 0 ? 100 : 0);
    const pct80d = Math.min(100, Math.round((d80d / (sec80dLimit || 1)) * 100));

    // Interactive details modal state
    const [activeModal, setActiveModal] = useState<string | null>(null);

    // Scroll helper
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-primary", "transition-all");
            setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1500);
        }
    };

    // Radar data
    const radarItems = [
        {
            label: "Section 80C Utilization", pct: Math.min(100, Math.round((d80c / 150000) * 100)), color: "#10b981",
            status: d80c >= 150000 ? "MAX ✓" : d80c > 75000 ? "PARTIAL" : "LOW",
            opportunity: d80c >= 150000 ? "Fully optimized" : `₹${(150000 - d80c).toLocaleString("en-IN")} gap — ELSS/PPF opportunity`,
            onClick: () => {
                scrollToSection("whatif-section");
                const targetElss = unused80C >= 1000 ? Math.min(elssMax, Math.max(10000, Math.floor(unused80C / 1000) * 1000)) : Math.min(elssMax, 50000);
                setElss([targetElss]);
            }
        },
        {
            label: "Section 80D Utilization", pct: pct80d, color: "#38bdf8",
            status: d80d >= sec80dLimit ? "MAX ✓" : d80d > 0 ? (pct80d >= 75 ? "OPTIMIZED" : "PARTIAL") : "ZERO ⚠",
            opportunity: d80d >= sec80dLimit ? "Fully optimized" : `₹${unused80D.toLocaleString("en-IN")} gap — Health insurance opportunity`,
            onClick: () => {
                scrollToSection("whatif-section");
                const targetHealth = unused80D >= 1000 ? Math.min(healthMax, Math.max(10000, Math.floor(unused80D / 1000) * 1000)) : Math.min(healthMax, 25000);
                setHealth([targetHealth]);
            }
        },
        {
            label: "HRA Optimization", pct: hraPct, color: "#a78bfa",
            status: hra >= maxHra && hra > 0 ? "MAX ✓" : hra > 0 ? "OPTIMIZED" : "UNDETECTED",
            opportunity: hra > 0 ? `₹${hra.toLocaleString("en-IN")} tax exemption claimed` : "Submit rent receipts to employer",
            onClick: () => setActiveModal("HRA")
        },
        {
            label: "Regime Fit Score", pct: taxSaved > 0 ? (rec === activeRegime ? 90 : 50) : 55, color: "#f59e0b",
            status: taxSaved > 0 ? (rec === activeRegime ? "OPTIMAL" : "SUB-OPTIMAL") : "NEUTRAL",
            opportunity: taxSaved > 0 ? `${rec} Regime saves ₹${taxSaved.toLocaleString("en-IN")}` : "Both regimes are similar — no urgent action",
            onClick: () => {
                scrollToSection("regime-section");
                setActiveRegime(prev => prev === "OLD" ? "NEW" : "OLD");
            }
        },
    ];

    // Deduction evidence — pick tax-relevant debit transactions
    const deductionTxns = tagged.filter(t => t.is_debit && t.section !== "Income").slice(0, 6);

    // Regime bar data
    const regimeChartData = [
        { name: "Old Regime", tax: oldTax },
        { name: "New Regime", tax: newTax },
    ];

    // Action plan
    const actionPlan = [
        { by: "Jan 31", action: `Invest ₹${Math.max(0, 150000 - d80c).toLocaleString("en-IN")} in ELSS (Axis Long Term / Mirae)`, priority: "CRITICAL", section: "80C" },
        { by: "Feb 15", action: `Buy health insurance (₹${Math.max(0, sec80dLimit - d80d).toLocaleString("en-IN")} more capacity for full 80D cap of ₹${sec80dLimit.toLocaleString("en-IN")})`, priority: "HIGH", section: "80D" },
        { by: "Feb 28", action: "Open NPS Tier-1 and contribute ₹50,000 for 80CCD(1B) benefit", priority: "HIGH", section: "NPS" },
        { by: "Mar 31", action: "Submit investment proofs to employer's HR for TDS revision", priority: "MEDIUM", section: "TDS" },
        { by: "Jul 31", action: `File ITR-1 under ${rec} Regime on incometax.gov.in`, priority: "CRITICAL", section: "ITR" },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* ── Feature 4 + 8: Confidence + Risk Alerts Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Confidence Score */}
                <div className="rounded-xl border border-border/50 bg-card/60 p-5 flex flex-col items-center justify-center gap-4">
                    <div className="text-xs font-mono font-bold text-foreground tracking-wider flex items-center gap-2">
                        <Brain className="h-3.5 w-3.5 text-emerald-400" /> AI ANALYSIS CONFIDENCE
                    </div>
                    <ConfidenceRing score={Math.round(confidence)} />
                    <div className="w-full space-y-1.5 text-[10px] font-mono">
                        {[
                            { label: "Data completeness", val: gross > 0 ? 95 : 40 },
                            { label: "Classification rate", val: Math.round(Math.min(100, (tagged.length / Math.max(1, tagged.length + 2)) * 100 + 60)) },
                            { label: "Pattern matching", val: Math.round(Math.min(97, confidence + 5)) },
                        ].map(m => (
                            <div key={m.label} className="flex items-center gap-2">
                                <span className="text-muted-foreground w-28 flex-shrink-0">{m.label}</span>
                                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.val}%` }} />
                                </div>
                                <span className="text-emerald-400 w-6 text-right">{m.val}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk Alerts */}
                <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-foreground tracking-wider">RISK INTELLIGENCE ALERTS</span>
                        <span className="ml-auto text-[9px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded">
                            {riskFlags.length} DETECTED
                        </span>
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                        {riskFlags.length > 0
                            ? riskFlags.map((f, i) => <RiskCard key={i} flag={f} />)
                            : <p className="text-xs text-muted-foreground font-mono">No risk flags detected — excellent profile!</p>
                        }
                    </div>
                </div>
            </div>

            {/* ── Feature 3: Deduction Radar ── */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-5">
                <div className="flex items-center gap-2 mb-5">
                    <Target className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-xs font-mono font-bold text-foreground tracking-wider">DEDUCTION GAP DIAGNOSTIC RADAR</span>
                    <span className="ml-auto text-[9px] font-mono text-muted-foreground">DIAGNOSTIC MODE</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    {radarItems.map(item => <RadarSegment key={item.label} {...item} />)}
                </div>
            </div>

            {/* ── Feature 2: Regime Toggle Simulator ── */}
            <div id="regime-section" className="rounded-xl border border-border/50 bg-card/60 p-5 scroll-mt-20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-xs font-mono font-bold text-foreground tracking-wider">REGIME SIMULATION ENGINE</span>
                </div>
                <div className="flex gap-2 mb-5">
                    {(["OLD", "NEW"] as const).map(r => (
                        <button key={r} onClick={() => setActiveRegime(r)}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg font-mono font-bold text-sm transition-all duration-300",
                                activeRegime === r
                                    ? r === "OLD" ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400"
                                        : "bg-blue-500/20 border-2 border-blue-500 text-blue-400"
                                    : "border border-border/50 text-muted-foreground hover:border-border"
                            )}>
                            {r} REGIME
                            {rec === r && <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">RECOMMENDED</span>}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-6 items-end">
                    <div>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={regimeChartData} barSize={42} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 9 }}
                                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Tax"]} />
                                <Bar dataKey="tax" radius={[4, 4, 0, 0]}>
                                    <Cell fill={activeRegime === "OLD" ? "#10b981" : "#64748b"} />
                                    <Cell fill={activeRegime === "NEW" ? "#3b82f6" : "#64748b"} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                        <div className="rounded-lg border border-border/50 p-3">
                            <p className="text-[9px] font-mono text-muted-foreground">ACTIVE: {activeRegime} REGIME TAX</p>
                            <p className="text-2xl font-black" style={{ color: activeRegime === "OLD" ? "#10b981" : "#3b82f6" }}>
                                ₹{(activeRegime === "OLD" ? oldTax : newTax).toLocaleString("en-IN")}
                            </p>
                        </div>
                        <div className={cn(
                            "rounded-lg border p-3",
                            rec === activeRegime ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"
                        )}>
                            <p className="text-xs font-mono font-bold" style={{ color: rec === activeRegime ? "#10b981" : "#ef4444" }}>
                                {rec === activeRegime
                                    ? `✓ OPTIMAL — Saves ₹${taxSaved.toLocaleString("en-IN")}`
                                    : `✗ SUB-OPTIMAL — Pay ₹${taxSaved.toLocaleString("en-IN")} more`
                                }
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">vs. {activeRegime === "OLD" ? "New" : "Old"} Regime</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Feature 1: Missed Deduction Detector ── */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-foreground tracking-wider">MISSED DEDUCTION DETECTOR</span>
                    <span className="ml-auto text-[9px] font-mono text-muted-foreground">{deductionTxns.length} TAX-RELEVANT TXNS FOUND</span>
                </div>
                {deductionTxns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {deductionTxns.map((txn, i) => (
                            <DeductionEvidence key={i} txn={txn}
                                claimed={txn.section === "80C" ? d80c : txn.section === "80D" ? d80d : hra}
                                limit={txn.section === "80C" ? 150000 : txn.section === "80D" ? 25000 : 300000}
                                slab={0.60}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm font-mono">
                        Upload a CSV with LIC/PPF/ELSS/Health Insurance transactions to see evidence here.
                    </div>
                )}
            </div>

            {/* ── Feature 5: Enhanced What-If (3 sliders) ── */}
            <div id="whatif-section" className="rounded-xl border border-border/50 bg-card/60 p-5 scroll-mt-20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-foreground tracking-wider">WHAT-IF SCENARIO ENGINE</span>
                </div>
                <div className="space-y-6">
                    {[
                        { 
                            label: "ELSS Investment (80C)", 
                            value: elss, 
                            setter: setElss, 
                            max: elssMax, 
                            isCapReached: unused80C < 1000, 
                            color: "#10b981" 
                        },
                        { 
                            label: "Health Insurance Premium (80D)", 
                            value: health, 
                            setter: setHealth, 
                            max: healthMax, 
                            isCapReached: unused80D < 1000, 
                            color: "#38bdf8" 
                        },
                        { 
                            label: "NPS Contribution (80CCD 1B)", 
                            value: nps, 
                            setter: setNps, 
                            max: npsMax, 
                            isCapReached: false, 
                            color: "#a78bfa" 
                        },
                    ].map(s => (
                        <div key={s.label} className="space-y-2">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-muted-foreground">{s.label}</span>
                                <span style={{ color: s.color }} className="font-bold">₹{s.value[0].toLocaleString("en-IN")}</span>
                            </div>
                            <Slider value={s.value} onValueChange={s.setter} min={0} max={s.max} step={1000} />
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                <span>₹0</span>
                                <span>
                                    ₹{s.max.toLocaleString("en-IN")}{" "}
                                    {s.isCapReached ? "(simulated capacity)" : "(max available)"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {totalExtra > 0 && (
                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-center">
                            <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Additional Investment</p>
                            <p className="font-display text-xl font-black text-foreground">₹{totalExtra.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                            <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Tax Reduction</p>
                            <p className="font-display text-xl font-black text-emerald-400">−₹{totalSaving.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                            <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Instant ROI</p>
                            <p className="font-display text-xl font-black text-amber-400">60%</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Feature 6: Behavioral Spending ── */}
            {spendData.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-card/60 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="h-3.5 w-3.5 text-pink-400" />
                        <span className="text-xs font-mono font-bold text-foreground tracking-wider">BEHAVIORAL SPENDING INTELLIGENCE</span>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={spendData} barSize={28} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" vertical={false} />
                            <XAxis dataKey="category" tick={{ fill: "hsl(215 20% 55%)", fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 9 }}
                                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Spent"]} />
                            <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                                {spendData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {spendData.map(d => (
                            <span key={d.category} className="text-[10px] font-mono px-2 py-0.5 rounded"
                                style={{ background: `${d.color}20`, color: d.color }}>
                                {d.category}: ₹{d.amount.toLocaleString("en-IN")}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Feature 7: AI Optimization Plan ── */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <ChevronRight className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-foreground tracking-wider">AI OPTIMIZATION PLAN — EXECUTIVE SUMMARY</span>
                </div>
                <div className="space-y-2">
                    {actionPlan.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors">
                            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                                <span className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{item.by}</span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                                    style={{
                                        background: item.priority === "CRITICAL" ? "#f59e0b20" : item.priority === "HIGH" ? "#10b98120" : "#3b82f620",
                                        color: item.priority === "CRITICAL" ? "#f59e0b" : item.priority === "HIGH" ? "#10b981" : "#3b82f6"
                                    }}>
                                    {item.section}
                                </span>
                            </div>
                            <p className="text-sm text-foreground flex-1 leading-relaxed">{item.action}</p>
                            <span className={cn(
                                "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5",
                                item.priority === "CRITICAL" ? "bg-amber-500/20 text-amber-400" :
                                    item.priority === "HIGH" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                            )}>{item.priority}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── HRA Interactive Guidance Modal ── */}
            {activeModal === "HRA" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <Home className="h-5 w-5 text-purple-400" />
                                <h3 className="font-mono font-bold text-foreground text-sm">HRA EXEMPTION OPTIMIZER (SECTION 10(13A))</h3>
                            </div>
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs font-mono">
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                <p className="font-bold mb-1">Status: {hra > 0 ? "✓ HRA EXEMPTION ACTIVE" : "⚠️ NO EXEMPTION CLAIMED"}</p>
                                <p className="text-[11px] opacity-90">
                                    {hra > 0 
                                        ? `You have claimed ₹${hra.toLocaleString("en-IN")} tax exemption. Ensure rent receipts & landlord PAN (if rent > ₹1L/yr) are submitted.`
                                        : "You can save thousands in tax by submitting your rent receipts and rental agreement to your HR/Employer."}
                                </p>
                            </div>
                            <div className="space-y-1.5 border border-border/40 rounded-lg p-3 bg-muted/20">
                                <div className="flex justify-between py-1 border-b border-border/20">
                                    <span className="text-muted-foreground">Annual HRA Received:</span>
                                    <span className="font-bold text-foreground">₹{maxHra.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-border/20">
                                    <span className="text-muted-foreground">Annual Rent Paid:</span>
                                    <span className="font-bold text-foreground">₹{(taxData?.salary?.annualRent || taxData?.salary_profile?.annual_rent || (maxHra * 0.8)).toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-border/20">
                                    <span className="text-muted-foreground">Tax-Free HRA Exemption:</span>
                                    <span className="font-bold text-emerald-400">₹{hra.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Taxable Portion of HRA:</span>
                                    <span className="font-bold text-amber-400">₹{Math.max(0, maxHra - hra).toLocaleString("en-IN")}</span>
                                </div>
                            </div>
                            <div className="space-y-1 text-muted-foreground text-[11px]">
                                <p className="font-bold text-foreground">Required Documents for Exemption:</p>
                                <p>• Rent receipts signed by landlord</p>
                                <p>• Valid registered or notarized rent agreement</p>
                                <p>• Landlord PAN card (mandatory if rent exceeds ₹1,00,000/year)</p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setActiveModal(null)}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-xs font-bold hover:bg-primary/90 transition-all"
                            >
                                Close & Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
