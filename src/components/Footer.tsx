import { useNavigate } from "react-router-dom";
import { Brain, Twitter, Linkedin, Github, Mail, Shield } from "lucide-react";

const PRODUCT_LINKS = [
    { label: "How It Works", href: "/features" },
    { label: "Upload Statement", href: "/upload" },
    { label: "Dashboard", href: "/dashboard" },
];

const LEGAL_LINKS = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Disclaimer", href: "#" },
];

const SOCIAL = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Mail, href: "#", label: "Email" },
];

export function Footer() {
    const navigate = useNavigate();

    return (
        <footer className="border-t border-border/40 bg-background mt-16">
            <div className="container py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                    {/* Brand */}
                    <div className="md:col-span-2 space-y-4">
                        <button onClick={() => navigate("/")} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40">
                                <Brain className="h-4 w-4 text-emerald-400" />
                            </div>
                            <span className="font-display text-lg font-black">
                                TaxMind<span className="text-emerald-400">AI</span>
                            </span>
                        </button>
                        <p className="text-base text-muted-foreground max-w-sm leading-relaxed font-medium">
                            India's first AI-powered tax intelligence engine. Upload your bank statement, discover hidden deductions, and stop overpaying tax.
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400/80 font-semibold uppercase tracking-wider">
                            <Shield className="h-4 w-4" />
                            <span>256-bit encrypted • Zero data stored • RBI compliant</span>
                        </div>
                        {/* Social */}
                        <div className="flex items-center gap-2 pt-1">
                            {SOCIAL.map((s) => (
                                <a key={s.label} href={s.href} aria-label={s.label}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                                    <s.icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product links */}
                    <div>
                        <h4 className="text-xs font-mono font-bold text-foreground tracking-wider uppercase mb-4">Product</h4>
                        <ul className="space-y-2">
                            {PRODUCT_LINKS.map((l) => (
                                <li key={l.label}>
                                    <button onClick={() => navigate(l.href)}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {l.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal links */}
                    <div>
                        <h4 className="text-xs font-mono font-bold text-foreground tracking-wider uppercase mb-4">Legal</h4>
                        <ul className="space-y-2">
                            {LEGAL_LINKS.map((l) => (
                                <li key={l.label}>
                                    <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-white/5 backdrop-blur-sm p-4 shadow-inner">
                            <p className="text-xs font-mono text-emerald-500 font-bold leading-relaxed">
                                ⚠ TaxMind AI provides educational tax guidance only. Consult a CA for official tax advice.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border/40 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground font-mono font-600 opacity-90">
                        © {new Date().getFullYear()} TaxMind AI. All rights reserved.
                    </p>
                    <p className="text-sm text-white font-semibold">
                        Built with ❤️ for Indian taxpayers · FY 2024–25
                    </p>
                </div>
            </div>
        </footer>
    );
}
