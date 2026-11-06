import React, { useState, useEffect } from "react";
import { Calculator, ArrowRight, Info, Home, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateHRAExemption, HRACalculationResult } from "@/lib/taxCalculations";

interface HRAOptimizerProps {
  initialBasic?: number;
  initialHra?: number;
  initialRent?: number;
  initialIsMetro?: boolean;
  onUpdate?: (result: HRACalculationResult) => void;
}

export function HRAOptimizer({
  initialBasic = 600000,
  initialHra = 240000,
  initialRent = 180000,
  initialIsMetro = true,
  onUpdate,
}: HRAOptimizerProps) {
  // String states for seamless typing and bidirectional sync
  const [monthlySalary, setMonthlySalary] = useState<string>("");
  const [annualSalary, setAnnualSalary] = useState<string>("");

  const [monthlyBasic, setMonthlyBasic] = useState<string>(
    initialBasic ? String(Math.round(initialBasic / 12)) : ""
  );
  const [annualBasic, setAnnualBasic] = useState<string>(
    initialBasic ? String(initialBasic) : ""
  );

  const [monthlyHra, setMonthlyHra] = useState<string>(
    initialHra ? String(Math.round(initialHra / 12)) : ""
  );
  const [annualHra, setAnnualHra] = useState<string>(
    initialHra ? String(initialHra) : ""
  );

  const [monthlyRent, setMonthlyRent] = useState<string>(
    initialRent ? String(Math.round(initialRent / 12)) : ""
  );
  const [annualRent, setAnnualRent] = useState<string>(
    initialRent ? String(initialRent) : ""
  );

  const [isMetro, setIsMetro] = useState<boolean>(initialIsMetro);
  const [result, setResult] = useState<HRACalculationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync when initial props change
  useEffect(() => {
    if (initialBasic) {
      setAnnualBasic(String(initialBasic));
      setMonthlyBasic(String(Math.round(initialBasic / 12)));
    }
    if (initialHra) {
      setAnnualHra(String(initialHra));
      setMonthlyHra(String(Math.round(initialHra / 12)));
    }
    if (initialRent) {
      setAnnualRent(String(initialRent));
      setMonthlyRent(String(Math.round(initialRent / 12)));
    }
    setIsMetro(initialIsMetro);
  }, [initialBasic, initialHra, initialRent, initialIsMetro]);

  // Gross salary sync
  const handleMonthlySalaryChange = (val: string) => {
    setMonthlySalary(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) setAnnualSalary(String(Math.round(num * 12)));
    else if (val === "") setAnnualSalary("");
  };
  const handleAnnualSalaryChange = (val: string) => {
    setAnnualSalary(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) setMonthlySalary(String(Math.round(num / 12)));
    else if (val === "") setMonthlySalary("");
  };

  // Synchronizers without infinite loops
  const handleMonthlyBasicChange = (val: string) => {
    setMonthlyBasic(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setAnnualBasic(String(Math.round(num * 12)));
      setErrorMessage("");
    } else if (val === "") {
      setAnnualBasic("");
    }
  };

  const handleAnnualBasicChange = (val: string) => {
    setAnnualBasic(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMonthlyBasic(String(Math.round(num / 12)));
      setErrorMessage("");
    } else if (val === "") {
      setMonthlyBasic("");
    }
  };

  const handleMonthlyHraChange = (val: string) => {
    setMonthlyHra(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setAnnualHra(String(Math.round(num * 12)));
      setErrorMessage("");
    } else if (val === "") {
      setAnnualHra("");
    }
  };

  const handleAnnualHraChange = (val: string) => {
    setAnnualHra(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMonthlyHra(String(Math.round(num / 12)));
      setErrorMessage("");
    } else if (val === "") {
      setMonthlyHra("");
    }
  };

  const handleMonthlyRentChange = (val: string) => {
    setMonthlyRent(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setAnnualRent(String(Math.round(num * 12)));
      setErrorMessage("");
    } else if (val === "") {
      setAnnualRent("");
    }
  };

  const handleAnnualRentChange = (val: string) => {
    setAnnualRent(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMonthlyRent(String(Math.round(num / 12)));
      setErrorMessage("");
    } else if (val === "") {
      setMonthlyRent("");
    }
  };

  const handleCalculate = async () => {
    const basicNum = parseFloat(annualBasic);
    const hraNum = parseFloat(annualHra);
    const rentNum = parseFloat(annualRent);

    if (isNaN(basicNum) || basicNum <= 0) {
      setErrorMessage("Please enter a valid Annual Basic Salary greater than 0.");
      return;
    }
    if (isNaN(hraNum) || hraNum < 0) {
      setErrorMessage("Please enter a valid Annual HRA Received.");
      return;
    }
    if (isNaN(rentNum) || rentNum < 0) {
      setErrorMessage("Please enter a valid Annual Rent Paid.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      // Direct local calculation for instant responsiveness
      const localRes = calculateHRAExemption(basicNum, hraNum, rentNum, isMetro);
      setResult(localRes);
      if (onUpdate) onUpdate(localRes);

      // Also invoke backend API if available
      try {
        const response = await fetch("http://localhost:5001/api/tax/hra-optimizer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            basic_salary: basicNum,
            hra_received: hraNum,
            rent_paid: rentNum,
            is_metro: isMetro,
          }),
        });
        const data = await response.json();
        if (data.success && data.data) {
          const apiRes = {
            annualBasic: basicNum,
            annualHra: hraNum,
            annualRent: rentNum,
            isMetro,
            exemption: data.data.exemption,
            remainingTaxableHra:
              data.data.remaining_taxable_hra !== undefined
                ? data.data.remaining_taxable_hra
                : Math.max(0, hraNum - data.data.exemption),
            ruleApplied: data.data.rule_applied,
            breakdown: {
              actualHra: data.data.breakdown.actual_hra,
              percentageOfBasic: data.data.breakdown.percentage_of_basic,
              rentMinus10pctBasic: data.data.breakdown.rent_minus_10pct_basic,
            },
          };
          setResult(apiRes);
          if (onUpdate) onUpdate(apiRes);
        }
      } catch (apiErr) {
        // Local calculation is already set
      }
    } catch (e) {
      setErrorMessage("Error calculating HRA exemption. Please verify your numbers.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial calculation once
  useEffect(() => {
    if (initialBasic > 0 && initialHra > 0) {
      const res = calculateHRAExemption(initialBasic, initialHra, initialRent, initialIsMetro);
      setResult(res);
    }
  }, []);

  return (
    <div className="bg-card border border-border/60 p-6 rounded-xl shadow-lg glass-morphism">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Home className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground tracking-tight flex items-center gap-2">
            Smart HRA Optimizer
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              Section 10(13A)
            </span>
          </h3>
          <p className="text-xs text-muted-foreground font-mono">
            Synchronized monthly & annual inputs with exact statutory exemption matrix
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-4">
          {/* Gross / Total Salary */}
          <div className="rounded-lg border border-emerald-500/30 p-3 bg-emerald-500/5 space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              0. Gross / Total Salary
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-muted-foreground mb-1 block">
                  Monthly Salary (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={monthlySalary}
                    onChange={(e) => handleMonthlySalaryChange(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full bg-background/80 border border-emerald-500/30 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-mono text-muted-foreground mb-1 block">
                  Annual Salary (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={annualSalary}
                    onChange={(e) => handleAnnualSalaryChange(e.target.value)}
                    placeholder="e.g. 1200000"
                    className="w-full bg-background/80 border border-emerald-500/30 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Basic Salary */}
          <div className="rounded-lg border border-border/40 p-3 bg-muted/20 space-y-2">
            <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider block">
              1. Basic Salary
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-muted-foreground mb-1 block">
                  Monthly Basic (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={monthlyBasic}
                    onChange={(e) => handleMonthlyBasicChange(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-background/80 border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-mono text-muted-foreground mb-1 block">
                  Annual Basic (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={annualBasic}
                    onChange={(e) => handleAnnualBasicChange(e.target.value)}
                    placeholder="e.g. 600000"
                    className="w-full bg-background/80 border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HRA Received */}
          <div className="rounded-lg border border-border/40 p-3 bg-muted/20 space-y-2">
            <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider block">
              2. HRA Received
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-muted-foreground mb-1 block">
                  Monthly HRA (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={monthlyHra}
                    onChange={(e) => handleMonthlyHraChange(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full bg-background/80 border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-mono text-muted-foreground mb-1 block">
                  Annual HRA (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={annualHra}
                    onChange={(e) => handleAnnualHraChange(e.target.value)}
                    placeholder="e.g. 240000"
                    className="w-full bg-background/80 border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rent Paid */}
          <div className="rounded-lg border border-border/40 p-3 bg-muted/20 space-y-2">
            <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider block">
              3. Rent Paid
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-muted-foreground mb-1 block">
                  Monthly Rent (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={monthlyRent}
                    onChange={(e) => handleMonthlyRentChange(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full bg-background/80 border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-mono text-muted-foreground mb-1 block">
                  Annual Rent (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={annualRent}
                    onChange={(e) => handleAnnualRentChange(e.target.value)}
                    placeholder="e.g. 180000"
                    className="w-full bg-background/80 border border-border/60 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/60 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* City Tier Selection */}
          <div>
            <label className="text-xs font-mono font-bold text-muted-foreground mb-2 block uppercase tracking-wider">
              City Classification
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsMetro(true);
                  if (result) {
                    const res = calculateHRAExemption(
                      parseFloat(annualBasic) || 0,
                      parseFloat(annualHra) || 0,
                      parseFloat(annualRent) || 0,
                      true
                    );
                    setResult(res);
                    if (onUpdate) onUpdate(res);
                  }
                }}
                className={`flex-1 py-2 text-xs font-mono rounded-lg font-bold transition-all ${
                  isMetro
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "bg-muted/40 text-foreground hover:bg-muted border border-border/50"
                }`}
              >
                Metro City (50%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMetro(false);
                  if (result) {
                    const res = calculateHRAExemption(
                      parseFloat(annualBasic) || 0,
                      parseFloat(annualHra) || 0,
                      parseFloat(annualRent) || 0,
                      false
                    );
                    setResult(res);
                    if (onUpdate) onUpdate(res);
                  }
                }}
                className={`flex-1 py-2 text-xs font-mono rounded-lg font-bold transition-all ${
                  !isMetro
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "bg-muted/40 text-foreground hover:bg-muted border border-border/50"
                }`}
              >
                Non-Metro City (40%)
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button
            onClick={handleCalculate}
            disabled={isLoading || !annualBasic || !annualHra || !annualRent}
            className="w-full mt-2 bg-emerald-500 text-black hover:bg-emerald-400 font-bold font-mono text-sm h-10 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
          >
            {isLoading ? "Optimizing HRA..." : "Optimize HRA Exemption"}
            {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="bg-muted/20 rounded-xl p-5 border border-border/50 flex flex-col justify-center">
          {!result ? (
            <div className="text-center text-muted-foreground flex flex-col items-center">
              <Calculator className="w-10 h-10 mb-3 opacity-20 text-emerald-400" />
              <p className="text-sm font-mono font-medium">
                Enter your monthly or annual salary figures above to calculate the maximum legal tax exemption under Section 10(13A).
              </p>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center pb-4 border-b border-border/40">
                <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1">
                  Eligible Tax-Free HRA Exemption
                </p>
                <p className="font-display text-4xl font-black text-foreground">
                  ₹{result.exemption.toLocaleString("en-IN")}
                </p>
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1 rounded-full mt-3 font-mono font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {result.ruleApplied}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  The 3 Statutory Limits Breakdown
                </p>
                <div className="flex justify-between items-center text-xs font-mono p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">1. Actual Annual HRA</span>
                  <span
                    className={`font-bold ${
                      result.exemption === result.breakdown.actualHra
                        ? "text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    ₹{result.breakdown.actualHra.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">
                    2. {isMetro ? "50%" : "40%"} of Annual Basic ({isMetro ? "Metro" : "Non-Metro"})
                  </span>
                  <span
                    className={`font-bold ${
                      result.exemption === result.breakdown.percentageOfBasic
                        ? "text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    ₹{result.breakdown.percentageOfBasic.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">3. Annual Rent - 10% of Basic</span>
                  <span
                    className={`font-bold ${
                      result.exemption === result.breakdown.rentMinus10pctBasic
                        ? "text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    ₹{result.breakdown.rentMinus10pctBasic.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 flex gap-3 text-xs font-mono text-foreground">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-amber-400 font-bold block mb-0.5">Remaining Taxable HRA:</span>
                  <span>
                    ₹{result.remainingTaxableHra.toLocaleString("en-IN")} will be included in your gross taxable salary under the Old Regime.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
