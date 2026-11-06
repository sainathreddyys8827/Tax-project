import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Shield,
  BarChart3,
  Zap,
  ChevronRight,
  TrendingUp,
  Activity,
  AlertTriangle,
  Search,
  CheckCircle2,
  PieChart,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import heroBg from "@/assets/hero-bg.jpg";

export default function LandingPage() {
  const navigate = useNavigate();
  const [savingsCount, setSavingsCount] = useState(0);
  const [scanStep, setScanStep] = useState(0);

  const scanStepsText = [
    "Initializing tax engine...",
    "Parsing 80C transactions...",
    "Analyzing 80D payments...",
    "Comparing tax regimes...",
    "Generating savings report..."
  ];

  useEffect(() => {
    // Animate the money counter
    const target = 23450;
    const duration = 2000;
    const steps = 60;
    const stepValue = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= target) {
        setSavingsCount(target);
        clearInterval(timer);
      } else {
        setSavingsCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Animate the scan steps
    const timer = setInterval(() => {
      setScanStep((prev) => (prev + 1) % scanStepsText.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [scanStepsText.length]);

  return (
    <div className="min-h-screen bg-navy-900 text-foreground overflow-x-hidden selection:bg-emerald-500/30">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/80 to-navy-900" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />

        <div className="container relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* Hero Content */}
          <div className="flex-1 text-center lg:text-left pt-12 lg:pt-0">
            <div className="inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 mb-6 font-mono font-medium tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              SYSTEM ONLINE // v2.4.1
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-900 leading-[1.1] mb-6 text-white tracking-tight text-gradient-hero py-2">
              Your Personal<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 text-glow">Wealth Tax Saver Agent</span>
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8 font-600 border-l-4 border-emerald-500/50 pl-6 leading-relaxed">
              Smart tax management, investment planning, and wealth optimization—tailored to your financial goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-emerald-500 text-white hover:bg-emerald-400 font-bold text-base px-8 h-14 rounded-none border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                onClick={() => navigate("/upload")}
              >
                <Zap className="mr-2 h-5 w-5" />
                Run Tax Scan
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 bg-transparent font-semibold text-base px-8 h-14 rounded-none backdrop-blur-sm cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                <Search className="mr-2 h-4 w-4" />
                See Live Analysis
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground font-mono">
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-500" /> RBI-Grade Security</div>
              <div className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 text-emerald-500" /> Real-time Processing</div>
            </div>
          </div>

          {/* Hero Visual - Dashboard Preview */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-none perspective-1000">
            <div 
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-border bg-navy-800/80 backdrop-blur-xl overflow-hidden shadow-2xl relative transform rotate-y-[-5deg] rotate-x-[5deg] transition-all duration-700 hover:rotate-0 cursor-pointer hover:border-emerald-500/50 group"
              title="Click to explore interactive dashboard"
            >
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-navy-900/50 font-mono text-xs">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 text-center text-muted-foreground opacity-60">root@taxmind: ~/analysis_engine</div>
              </div>

              <div className="p-6 grid gap-4">
                {/* Savings Live Counter */}
                <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:animate-data-stream z-0" />
                  <div className="relative z-10">
                    <div className="text-xs text-emerald-400 font-mono mb-1 flex items-center gap-2">
                      <Activity className="h-3 w-3" /> POTENTIAL SAVINGS DETECTED
                    </div>
                    <div className="text-4xl font-display font-800 text-white tracking-tight">
                      ₹{savingsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-emerald-500/30 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/50 animate-ping opacity-20" />
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>

                {/* AI Scanning Visualizer */}
                <div className="rounded border border-border bg-navy-900/50 p-4 font-mono text-xs">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-muted-foreground">SCAN_STATUS: <span className="text-blue-400 animate-pulse">ACTIVE</span></span>
                    <span className="text-muted-foreground opacity-50">98.4% CONFIDENCE</span>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> <span>Loading statement.csv... OK</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> <span>Applying NLP classification... OK</span></div>
                    <div className="flex items-center gap-2 group cursor-default">
                      <RefreshCw className="h-3 w-3 text-emerald-500 animate-spin" />
                      <span className="text-emerald-400">{scanStepsText[scanStep]}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 h-1 w-full bg-navy-700 overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-emerald-500 w-2/3 transition-all duration-300" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Compare Chart */}
                  <div className="rounded border border-border bg-navy-900/50 p-4">
                    <div className="text-xs text-muted-foreground font-mono mb-3">REGIME_DELTA</div>
                    <div className="flex items-end gap-3 h-20 mb-2">
                      <div className="w-1/2 bg-navy-600 rounded-t relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">94k</div>
                        <div className="absolute bottom-2 left-0 w-full text-center text-[10px] font-mono font-bold text-white/50">NEW</div>
                      </div>
                      <div className="w-1/2 bg-emerald-500/80 rounded-t h-[60%] relative group shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity">70k</div>
                        <div className="absolute bottom-2 left-0 w-full text-center text-[10px] font-mono font-bold text-white">OLD</div>
                        {/* Winner indicator */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center border-2 border-navy-900 shadow-glow">
                          <CheckCircle2 className="h-2 w-2 text-navy-900" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Radar/Findings */}
                  <div className="rounded border border-red-500/20 bg-red-500/5 p-4 flex flex-col justify-center">
                    <div className="text-xs text-red-400 font-mono mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> RISK_DETECTED
                    </div>
                    <div className="text-sm font-medium text-white mb-1">Missed 80D Claim</div>
                    <div className="text-xs text-muted-foreground">Self-paid health premiums found on Aug 14. Potential saving: ₹7,500.</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Logic Section */}
      <section id="logic" className="py-24 relative border-t border-border">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-800 tracking-tight text-white mb-4">
              What Makes This Smart?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-mono text-sm">
              // INTELLIGENCE_PIPELINE_ARCHITECTURE
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative max-w-5xl mx-auto">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-border -translate-y-1/2 z-0" />
            <div className="hidden md:block absolute top-1/2 left-0 w-1/2 h-px bg-gradient-to-r from-emerald-500/10 to-emerald-500 -translate-y-1/2 z-0 animate-pulse-glow" />

            {[
              { num: "01", title: "Parse", desc: "Bank statement ingestion via secure pathways.", icon: Search },
              { num: "02", title: "Extract", desc: "NLP categorizes highly unstructured txns.", icon: Activity },
              { num: "03", title: "Match", desc: "Map to Indian tax law (80C, 80D, 24b).", icon: Brain },
              { num: "04", title: "Optimize", desc: "Compare Old vs New regime dynamics.", icon: BarChart3 },
              { num: "05", title: "Report", desc: "Generate actionable savings strategy.", icon: CheckCircle2 },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center group">
                <div className="w-12 h-12 rounded border border-border bg-navy-900 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 flex items-center justify-center mb-4 transition-colors font-mono text-xs text-muted-foreground group-hover:text-emerald-400">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="bg-navy-800 border border-border rounded p-4 text-center w-full h-full">
                  <div className="text-[10px] text-emerald-500 font-mono mb-1">MODE_{step.num}</div>
                  <h3 className="font-bold text-white mb-2 text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="py-20 border-t border-border bg-navy-800/30">
        <div className="container max-w-3xl text-center">
          <h2 className="font-display text-4xl md:text-5xl font-800 tracking-tight text-white mb-4">
            Stop Guessing.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Start Optimizing.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Upload your bank statement and get a full AI-powered tax report in under 60 seconds. No signup, no manual entry.
          </p>
          <Button
            size="lg"
            className="bg-emerald-500 text-white hover:bg-emerald-400 font-bold text-lg px-12 h-14 rounded shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]"
            onClick={() => navigate("/upload")}
          >
            Analyze My Taxes — Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <div className="mt-8 flex justify-center items-center gap-8 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> No signup required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Data never stored</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Results in 60s</span>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}
