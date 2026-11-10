import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Shield,
  CheckCircle2,
  Download,
  ArrowRight,
  Brain,
  Lock,
  Loader2,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { parseStatementCsv, analyzeStatement } from "@/lib/statementAnalyzer";

const sampleData = [
  { date: "2024-04-05", description: "LIC Premium Payment", amount: "15000", category: "80C" },
  { date: "2024-04-12", description: "HDFC Health Insurance", amount: "18000", category: "80D" },
  { date: "2024-05-03", description: "SBI Mutual Fund ELSS", amount: "25000", category: "80C" },
  { date: "2024-06-01", description: "PPF Contribution", amount: "50000", category: "80C" },
  { date: "2024-07-10", description: "Salary Credit", amount: "85000", category: "Income" },
];

const processingSteps = [
  "Parsing transaction data…",
  "Classifying tax-relevant transactions…",
  "Detecting 80C & 80D deductions…",
  "Running regime comparison engine…",
  "Calculating Tax Efficiency Score…",
  "Generating optimization strategies…",
];

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleFile = (f: File) => {
    if (f.type !== "text/csv" && !f.name.endsWith(".csv")) return;
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setCurrentStep(0);
    setCompletedSteps([]);

    try {
      if (!file) throw new Error("No file selected.");
      const text = await file.text();
      setCompletedSteps([0]);
      setCurrentStep(1);
      const txns = parseStatementCsv(text);
      setCompletedSteps([0, 1, 2]);
      setCurrentStep(3);
      let savedProfile: any = null;
      try { savedProfile = JSON.parse(localStorage.getItem("taxProfileData") || "null"); } catch (e) {}
      const result = analyzeStatement(txns, savedProfile);
      setCompletedSteps([0, 1, 2, 3, 4]);
      setCurrentStep(5);
      await new Promise((r) => setTimeout(r, 400));
      setCompletedSteps([0, 1, 2, 3, 4, 5]);
      localStorage.setItem("taxAnalysisData", JSON.stringify(result));
      navigate("/dashboard");

    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to process the bank statement.");
      setIsProcessing(false);
    }
  };

  const downloadSample = () => {
    const rows = [
      "date,description,amount",
      "2024-04-01,Salary Credit,120000",
      "2024-04-08,LIC Premium Payment,-15000",
      "2024-04-15,HDFC Health Insurance Premium,-18000",
      "2024-05-01,Salary Credit,120000",
      "2024-05-10,SBI Mutual Fund ELSS,-25000",
      "2024-05-20,Swiggy Food Order,-1200",
      "2024-06-01,Salary Credit,120000",
      "2024-06-05,PPF Contribution,-50000",
      "2024-06-18,Amazon Prime Subscription,-1499",
      "2024-07-01,Salary Credit,120000",
      "2024-07-12,NPS Contribution ICICI Bank,-12000",
      "2024-07-22,Rent Payment,-25000",
      "2024-08-01,Salary Credit,120000",
      "2024-08-10,Zomato Order,-850",
      "2024-08-25,Rent Payment,-25000",
      "2024-09-01,Salary Credit,120000",
      "2024-09-15,LIC Premium Payment,-15000",
      "2024-09-28,Rent Payment,-25000",
      "2024-10-01,Salary Credit,120000",
      "2024-10-20,Starbucks Coffee,-650",
      "2024-11-01,Salary Credit,120000",
      "2024-11-05,ELSS Mirae Asset Tax Saver,-10000",
      "2024-12-01,Salary Credit,120000",
      "2024-12-10,NSC Post Office Investment,-20000",
      "2025-01-01,Salary Credit,120000",
      "2025-01-15,Rent Payment,-25000",
      "2025-02-01,Salary Credit,120000",
      "2025-02-14,Groww ELSS Mutual Fund,-10000",
      "2025-03-01,Salary Credit,120000",
      "2025-03-20,Donation to CRY Foundation,-5000",
      "2025-03-28,Tax Saver FD SBI,-25000",
    ];
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_bank_statement.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-4xl py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-medium">End-to-End Encrypted Processing</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-800 mb-6 text-gradient-hero">
            Upload Your Bank Statement
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            We process your CSV locally. Your financial data never leaves your browser.
          </p>
        </div>

        {!isProcessing ? (
          <div className="space-y-6">
            {/* Upload Zone */}
            <div
              className={cn(
                "relative rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 cursor-pointer shadow-xl glass-morphism",
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : file
                    ? "border-primary/60 bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-white/5"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB · CSV File
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border">
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">
                      {isDragging ? "Drop your CSV here" : "Drag & drop your bank statement"}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">or click to browse — CSV format only</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />Max 10MB</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />CSV format</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />Not stored</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sample download */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-5 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">Don't have a bank statement?</p>
                  <p className="text-sm text-muted-foreground">Download our sample CSV to try the demo</p>
                </div>
              </div>
              <Button variant="outline" size="lg" onClick={downloadSample} className="border-white/20 hover:border-primary/50 font-bold">
                Download Sample
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Preview table */}
            {file && (
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">File Preview</span>
                  <span className="ml-auto text-xs text-muted-foreground">Showing sample rows</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                        <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Description</th>
                        <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount (₹)</th>
                        <th className="px-5 py-2.5 text-center text-xs font-medium text-muted-foreground">Tax Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.map((row, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{row.date}</td>
                          <td className="px-5 py-3 text-foreground">{row.description}</td>
                          <td className="px-5 py-3 text-right font-mono text-foreground">
                            {parseInt(row.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={cn(
                              "inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
                              row.category === "80C" && "bg-primary/15 text-primary",
                              row.category === "80D" && "bg-sky/15 text-sky",
                              row.category === "Income" && "bg-gold/15 text-gold",
                            )}>
                              {row.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: "256-bit Encryption", sub: "Bank-grade security" },
                { icon: Lock, label: "Zero Data Retention", sub: "Processed client-side" },
                { icon: CheckCircle2, label: "RBI Compliant", sub: "No account access" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center text-center rounded-xl border border-border/60 bg-card p-4 gap-2">
                  <b.icon className="h-5 w-5 text-primary" />
                  <p className="text-xs font-semibold text-foreground">{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.sub}</p>
                </div>
              ))}
            </div>

            {/* Action */}
            <div className="flex gap-4">
              {!file && (
                <div className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 py-4 text-sm text-muted-foreground font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Upload a CSV file to enable analysis
                </div>
              )}
              {file && (
                  <Button
                  size="lg"
                  className="flex-1 bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-lg h-14 glow-emerald-lg transition-transform hover:scale-[1.01]"
                  onClick={handleProcess}
                >
                  Analyze My Tax
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Processing State */
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-border flex items-center justify-center">
                  <Brain className="h-9 w-9 text-primary animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-700 mb-2">Analyzing Financial Patterns…</h2>
            <p className="text-muted-foreground mb-10">TaxMind AI is processing your data</p>
            <div className="max-w-md mx-auto space-y-3">
              {processingSteps.map((step, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-300",
                  i === currentStep && !completedSteps.includes(i) && "bg-primary/10 border border-primary/30",
                  completedSteps.includes(i) && "opacity-60",
                )}>
                  {completedSteps.includes(i) ? (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : i === currentStep ? (
                    <Loader2 className="h-4 w-4 text-primary flex-shrink-0 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />
                  )}
                  <span className={i <= currentStep ? "text-foreground" : "text-muted-foreground"}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
