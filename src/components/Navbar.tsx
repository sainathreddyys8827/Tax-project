import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, Menu, X, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Features", href: "/features" },
];

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-2xl shadow-sm glass-morphism">
            <div className="container flex h-16 items-center justify-between gap-6">
                {/* Logo */}
                <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group flex-shrink-0 min-w-0">
                    {/* Icon */}
                    <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 group-hover:bg-emerald-500/25 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300">
                        <Bot className="h-5 w-5 text-emerald-400" />
                    </div>

                    {/* Title */}
                    <div className="flex flex-col leading-none min-w-0">
                        <span className="font-display font-black tracking-tight text-[0.78rem] md:text-[0.88rem] leading-snug">
                            <span className="text-white">Design of an </span>
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">AI based personal</span>
                            <span className="text-white"> wealth tax saver agent</span>
                        </span>
                        <span className="text-[9px] font-mono font-semibold tracking-[0.2em] text-emerald-400/70 uppercase mt-0.5">
                            Agent · Powered by AI
                        </span>
                    </div>
                </button>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map((link) => (
                        <button
                            key={link.href}
                            onClick={() => navigate(link.href)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                                location.pathname === link.href
                                    ? "text-foreground bg-muted"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                        >
                            {link.label}
                        </button>
                    ))}
                </nav>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Button
                        size="lg"
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm h-10 px-6 glow-emerald shadow-emerald/20 transition-all hover:scale-105"
                        onClick={() => navigate("/upload")}
                    >
                        <Zap className="h-4 w-4 mr-2" />
                        Analyze Free
                        <ArrowRight className="h-3.5 w-3.5 ml-2" />
                    </Button>
                </div>

                {/* Mobile burger */}
                <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-2 space-y-1">
                    {NAV_LINKS.map((link) => (
                        <button
                            key={link.href}
                            onClick={() => { navigate(link.href); setMenuOpen(false); }}
                            className={cn(
                                "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                location.pathname === link.href ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {link.label}
                        </button>
                    ))}
                    <div className="pt-2">
                        <Button size="sm" className="w-full bg-emerald-500 text-black font-bold" onClick={() => { navigate("/upload"); setMenuOpen(false); }}>
                            <Zap className="h-3.5 w-3.5 mr-1.5" /> Analyze Free
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
}
