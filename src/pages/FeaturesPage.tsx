import { useNavigate } from "react-router-dom";
import {
    Brain, Upload, Zap, Shield, BarChart2, CheckCircle2,
    ArrowRight, ChevronDown, ChevronUp, Target, Lock, Cpu,
    TrendingUp, FileText, AlertTriangle, Activity, Star,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

const PIPELINE = [
    { step: "01", icon: Upload, title: "Upload Statement", desc: "Drop your bank CSV exported from any Indian bank — HDFC, SBI, ICICI, Axis, Kotak and more. We auto-detect the format.", color: "#10b981" },
    { step: "02", icon: Cpu, title: "AI Parses & Classifies", desc: "Our NLP engine reads every transaction line and tags it — LIC premiums become 80C, health insurance becomes 80D, rent becomes HRA.", color: "#38bdf8" },
    { step: "03", icon: BarChart2, title: "Regime Comparison Engine", desc: "We compute your exact tax liability under both Old and New Regime (Budget 2024 slabs) including 87A rebate and marginal relief.", color: "#a78bfa" },
    { step: "04", icon: Zap, title: "AI Generates Insights", desc: "Based on your specific numbers, the engine generates personalized English-language advice on missed deductions and optimal strategy.", color: "#f59e0b" },
    { step: "05", icon: Target, title: "Action Plan Ready", desc: "Download your full report with a step-by-step action plan — which funds to invest in, which regime to choose, and by when.", color: "#f43f5e" },
];

const FEATURES = [
    { icon: Brain, title: "Auto Tax Categorization", desc: "Recognizes 40+ Indian-specific merchants and tax categories. Zerodha = ELSS, Swiggy = discretionary, HDFC Insurance = 80D.", tag: "NLP Engine" },
    { icon: BarChart2, title: "Budget 2024 Tax Engine", desc: "Fully updated for the latest Income Tax slabs. New Regime now includes 87A rebate up to ₹7L and marginal relief logic.", tag: "Accurate" },
    { icon: Zap, title: "AI Insights Feed", desc: "Not just numbers — real English sentences telling you exactly what to do with your money and why.", tag: "Intelligence" },
    { icon: Shield, title: "What-If Simulator", desc: "Slide to see how investing ₹50K more in ELSS today would reduce your tax by the exact rupee amount.", tag: "Interactive" },
    { icon: TrendingUp, title: "Old vs New Regime", desc: "Visual, mathematical side-by-side comparison. Instantly see which regime wins for your specific income and deduction profile.", tag: "Comparison" },
    { icon: Lock, title: "HRA Optimizer", desc: "Specialized HRA exemption calculator. Inputs your actual rent, basic salary, and city tier to output the exact legal exemption amount.", tag: "Deductions" },
    { icon: Activity, title: "Efficiency Score", desc: "Get a 0–100 intelligence score showing how well-optimized your tax profile is versus what's theoretically possible.", tag: "Score" },
    { icon: FileText, title: "Full AI Report", desc: "A clean, exportable PDF-ready report with behavior analysis, deduction gaps, regime justification, and action steps.", tag: "Report" },
];

const FAQS = [
    { q: "Is my bank statement data safe?", a: "Absolutely. Your CSV is processed in-memory only and never written to disk or stored on any server. We do not have access to your banking credentials." },
    { q: "Which banks are supported?", a: "We support CSV exports from all major Indian banks: HDFC, SBI, ICICI, Axis, Kotak, Yes Bank, BOB, PNB, IndusInd, and more. Any CSV with Date, Description, and Amount columns will work." },
    { q: "Is this compliant with Budget 2024?", a: "Yes. Our tax engine uses the exact slabs announced in Union Budget 2024. The New Regime now reflects the updated ₹3L–₹15L+ slabs and the 87A rebate threshold of ₹7L." },
    { q: "Can I use this to actually file my ITR?", a: "TaxMind AI is an analysis and optimization tool. The output gives you the exact numbers and strategy, but the actual ITR filing should be done through the Income Tax portal or a CA." },
    { q: "What is included?", a: "Everything is completely free — unlimited statement uploads, full tax analysis, Old vs New regime comparison, AI insights, the what-if simulator, and PDF report export. No credit card, no signup required." },
    { q: "How accurate is the AI categorization?", a: "Our rules engine has been trained on common Indian transaction descriptions. It correctly identifies 85–90% of tax-relevant transactions automatically. Edge cases can be manually corrected in future versions." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-border/50 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors">
                <span className="font-medium text-foreground text-sm pr-4">{q}</span>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </button>
            {open && (
                <div className="px-5 pb-4 border-t border-border/40 pt-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </div>
            )}
        </div>
    );
}

export default function FeaturesPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero */}
            <section className="container py-20 text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-6 font-mono">
                    <Cpu className="h-3.5 w-3.5" />
                    How TaxMind AI Works
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-black mb-4 tracking-tight">
                    A Complete Tax Intelligence
                    <br />
                    <span className="text-emerald-400">Pipeline In 60 Seconds</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                    From raw bank CSV to an optimized tax strategy — no CA needed, no manual data entry. Just upload and let the AI work.
                </p>
                <div className="flex gap-3 justify-center mt-8">
                    <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold" onClick={() => navigate("/upload")}>
                        <Zap className="h-4 w-4 mr-2" /> Analyze My Taxes — Free
                    </Button>
                    <Button variant="outline" className="border-border/60" onClick={() => navigate("/dashboard")}>
                        View Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </section>

            {/* Pipeline */}
            <section className="container pb-20">
                <div className="text-center mb-12">
                    <h2 className="font-display text-2xl font-black mb-2">The Intelligence Pipeline</h2>
                    <p className="text-muted-foreground text-sm">5 steps from raw data to tax savings</p>
                </div>
                <div className="relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-emerald-500/40 via-blue-500/20 to-transparent -translate-x-1/2" />
                    <div className="space-y-6">
                        {PIPELINE.map((step, i) => (
                            <div key={step.step} className={cn(
                                "relative grid grid-cols-1 md:grid-cols-2 gap-6 items-center",
                                i % 2 === 1 && "md:[direction:rtl]"
                            )}>
                                <div className={cn("rounded-2xl border border-border/50 bg-card/70 p-6", i % 2 === 1 && "md:[direction:ltr]")}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${step.color}20`, border: `1px solid ${step.color}40` }}>
                                            <step.icon className="h-4 w-4" style={{ color: step.color }} />
                                        </div>
                                        <span className="text-2xl font-display font-black text-muted-foreground/30">{step.step}</span>
                                    </div>
                                    <h3 className="font-display font-black text-lg mb-2">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-background" style={{ borderColor: `${step.color}60` }}>
                                        <step.icon className="h-7 w-7" style={{ color: step.color }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="border-t border-border/40 py-20">
                <div className="container">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-2xl font-black mb-2">Every Feature You Need</h2>
                        <p className="text-muted-foreground text-sm">Built specifically for Indian taxpayers</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="rounded-xl border border-border/50 bg-card/60 p-5 hover:border-emerald-500/30 hover:bg-card transition-all duration-200 group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                                        <f.icon className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">{f.tag}</span>
                                </div>
                                <h3 className="font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="container pb-20">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="font-display text-2xl font-black mb-2">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground text-sm">Everything you need to know</p>
                    </div>
                    <div className="space-y-3">
                        {FAQS.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="border-t border-border/40 py-16">
                <div className="container text-center max-w-xl mx-auto">
                    <h2 className="font-display text-3xl font-black mb-3">Ready to Stop Overpaying?</h2>
                    <p className="text-muted-foreground mb-6">Upload your bank statement in seconds. Get AI-powered tax clarity instantly.</p>
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold" onClick={() => navigate("/upload")}>
                        <Zap className="h-4 w-4 mr-2" /> Analyze My Tax — Free
                    </Button>
                </div>
            </section>

            <Footer />
        </div>
    );
}
