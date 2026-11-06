import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Zap, ArrowRight, Shield, X, Brain, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

const TIERS = [
    {
        name: "Free",
        price: "₹0",
        period: "forever",
        tagline: "Perfect for individuals",
        color: "border-border/60",
        buttonStyle: "variant" as const,
        highlight: false,
        features: [
            { label: "Upload bank statement (CSV)", ok: true },
            { label: "Old vs New Regime comparison", ok: true },
            { label: "Section 80C & 80D analysis", ok: true },
            { label: "AI insights (3 per report)", ok: true },
            { label: "Tax Efficiency Score", ok: true },
            { label: "What-If Simulator", ok: true },
            { label: "Full AI Report (PDF export)", ok: false },
            { label: "HRA Optimizer", ok: false },
            { label: "AI Tax Chatbot", ok: false },
            { label: "Priority support", ok: false },
        ],
        cta: "Get Started Free",
    },
    {
        name: "Pro",
        price: "₹999",
        period: "per year",
        tagline: "For serious tax optimization",
        color: "border-emerald-500/60",
        buttonStyle: "default" as const,
        highlight: true,
        badge: "Most Popular",
        features: [
            { label: "Upload bank statement (CSV)", ok: true },
            { label: "Old vs New Regime comparison", ok: true },
            { label: "Section 80C & 80D analysis", ok: true },
            { label: "Unlimited AI insights", ok: true },
            { label: "Tax Efficiency Score", ok: true },
            { label: "What-If Simulator", ok: true },
            { label: "Full AI Report (PDF export)", ok: true },
            { label: "HRA Optimizer", ok: true },
            { label: "AI Tax Chatbot", ok: true },
            { label: "Priority email support", ok: true },
        ],
        cta: "Start Pro — ₹999/yr",
    },
    {
        name: "CA Partner",
        price: "₹4,999",
        period: "per year",
        tagline: "White-label for chartered accountants",
        color: "border-purple-500/40",
        buttonStyle: "variant" as const,
        highlight: false,
        features: [
            { label: "Everything in Pro", ok: true },
            { label: "Unlimited clients", ok: true },
            { label: "White-label branding", ok: true },
            { label: "Client report sharing", ok: true },
            { label: "API access", ok: true },
            { label: "Bulk CSV processing", ok: true },
            { label: "Dedicated account manager", ok: true },
            { label: "Custom deduction rules", ok: true },
            { label: "Custom integrations", ok: true },
            { label: "SLA-backed uptime", ok: true },
        ],
        cta: "Contact Sales",
    },
];

const TESTIMONIALS = [
    { name: "Rahul M.", role: "Software Engineer, Bengaluru", stars: 5, text: "I was paying ₹45,000 extra in taxes. TaxMind AI found ₹1.2L in unused 80C capacity in literally 30 seconds. This is insane." },
    { name: "Priya S.", role: "Freelance Designer, Mumbai", stars: 5, text: "As a freelancer, tax is confusing. TaxMind made it so clear — Old vs New regime comparison was the most useful thing I've seen." },
    { name: "Ankit V.", role: "CA, Delhi", stars: 5, text: "I recommend this to all my junior clients. It gives them a solid foundation before they come to me. Saves everyone's time." },
];

export default function PricingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero */}
            <section className="container py-16 text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-6 font-mono">
                    <Shield className="h-3.5 w-3.5" />
                    Simple, Transparent Pricing
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-black mb-4">
                    Start Free.
                    <br />
                    <span className="text-emerald-400">Upgrade When You Save More.</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                    Most users save ₹10,000–₹40,000 in tax. Our Pro plan costs ₹999. The math is obvious.
                </p>
            </section>

            {/* Pricing Cards */}
            <section className="container pb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
                    {TIERS.map((tier) => (
                        <div key={tier.name} className={cn(
                            "rounded-2xl border bg-card/70 p-6 relative",
                            tier.highlight ? "border-emerald-500/60 shadow-xl shadow-emerald-500/10" : tier.color
                        )}>
                            {tier.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-mono font-bold px-3 py-1 rounded-full tracking-wider">
                                    {tier.badge}
                                </div>
                            )}
                            {tier.highlight && (
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                            )}

                            <div className="mb-5">
                                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">{tier.name}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-display text-4xl font-black text-foreground">{tier.price}</span>
                                    <span className="text-sm text-muted-foreground">/{tier.period}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{tier.tagline}</p>
                            </div>

                            <Button
                                onClick={() => navigate("/upload")}
                                className={cn(
                                    "w-full mb-6 font-bold",
                                    tier.highlight
                                        ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                                        : "border border-border/60 bg-transparent hover:bg-muted/40 text-foreground"
                                )}
                            >
                                {tier.cta}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                            <ul className="space-y-2.5">
                                {tier.features.map((f) => (
                                    <li key={f.label} className="flex items-start gap-2.5 text-sm">
                                        {f.ok
                                            ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                            : <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
                                        <span className={f.ok ? "text-foreground" : "text-muted-foreground/50"}>{f.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section className="border-t border-border/40 py-16">
                <div className="container max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="font-display text-2xl font-black mb-2">What Users Are Saying</h2>
                        <p className="text-muted-foreground text-sm">Real results from real Indian taxpayers</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t) => (
                            <div key={t.name} className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: t.stars }).map((_, i) => (
                                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="container pb-16">
                <div className="max-w-xl mx-auto text-center mb-8">
                    <h2 className="font-display text-xl font-black">Pricing Questions</h2>
                </div>
                <div className="max-w-xl mx-auto space-y-3">
                    {[
                        { q: "Can I use the Free plan forever?", a: "Yes. The Free plan has no trial period or expiry. You can analyze your bank statement and get full regime comparison anytime." },
                        { q: "Will there be a refund if I upgrade?", a: "Yes, we offer a 7-day full refund policy for Pro subscriptions, no questions asked." },
                        { q: "Is Pro a one-time payment or subscription?", a: "Pro is an annual subscription of ₹999/year. You can cancel anytime and your access continues until the end of the billing period." },
                    ].map((faq) => {
                        const [open, setOpen] = useState(false);
                        return (
                            <div key={faq.q} className="border border-border/50 rounded-xl overflow-hidden">
                                <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors">
                                    <span className="font-medium text-foreground text-sm pr-4">{faq.q}</span>
                                    {open ? <X className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <Zap className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                                </button>
                                {open && <div className="px-5 pb-4 border-t border-border/40 pt-3"><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></div>}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="border-t border-border/40 py-14">
                <div className="container max-w-xl text-center mx-auto">
                    <Brain className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
                    <h2 className="font-display text-2xl font-black mb-3">Start With Free. Always.</h2>
                    <p className="text-muted-foreground text-sm mb-6">No credit card. No signup. Just upload your statement and get your analysis in seconds.</p>
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold" onClick={() => navigate("/upload")}>
                        <Zap className="h-4 w-4 mr-2" /> Get My Free Tax Report
                    </Button>
                </div>
            </section>

            <Footer />
        </div>
    );
}
