/**
 * Client-side bank statement analyzer.
 * Parses a CSV bank statement in the browser, categorizes each transaction,
 * and runs the tax engine to produce the data consumed by the Dashboard.
 */
import {
  computeFullTaxAnalysis,
  SalaryProfile,
  Section80CProfile,
  Section80DProfile,
} from "@/lib/taxCalculations";

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number; // positive = credit, negative = debit
  category: string;
}

export class StatementParseError extends Error {}

// ─── CSV parsing ──────────────────────────────────────────────────────────────
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");
  // Support semicolon / tab separated exports too
  const firstLine = src.split(/\r?\n/, 1)[0] || "";
  const counts = { ",": 0, ";": 0, "\t": 0 } as Record<string, number>;
  for (const ch of firstLine) if (ch in counts) counts[ch]++;
  const delim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : ",";

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(field.trim()); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field.trim()); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field.trim());
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const COLUMN_ALIASES = {
  date: ["date", "transaction_date", "trans_date", "txn_date", "tran_date", "posted_date", "posting_date", "entry_date", "value_date", "value_dt", "txn_dt", "settlement_date", "booking_date", "dated"],
  description: ["description", "narration", "remarks", "transaction_details", "transaction_remarks", "detail", "details", "transaction_description", "desc", "particulars", "memo", "trans_details", "transaction_particulars"],
  amount: ["amount", "transaction_amount", "txn_amount", "trans_amt", "amt", "transaction_value", "amount_inr", "amount_rs", "amount_in_rs"],
  credit: ["credit", "credit_amount", "credit_amt", "cr_amount", "cr_amt", "cr", "inflow", "deposit", "deposits", "deposit_amt", "deposit_amount", "credits"],
  debit: ["debit", "debit_amount", "debit_amt", "db_amount", "db_amt", "dr_amount", "dr_amt", "dr", "outflow", "withdrawal", "withdrawals", "withdrawal_amt", "withdrawal_amount", "debits"],
  type: ["type", "dr_cr", "cr_dr", "debit_credit", "transaction_type", "txn_type"],
};

function findColumn(headers: string[], aliases: string[]): number {
  for (const a of aliases) {
    const idx = headers.indexOf(a);
    if (idx !== -1) return idx;
  }
  // Fuzzy: header starts with alias (e.g. "withdrawal_amt_inr")
  for (const a of aliases) {
    if (a.length < 3) continue;
    const idx = headers.findIndex((h) => h.startsWith(a));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseAmount(raw: string | undefined): number | null {
  if (raw == null) return null;
  let s = raw.trim();
  if (!s || s === "-") return null;
  let sign = 1;
  if (/\bdr\.?$/i.test(s)) { sign = -1; s = s.replace(/dr\.?$/i, ""); }
  else if (/\bcr\.?$/i.test(s)) { s = s.replace(/cr\.?$/i, ""); }
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
  s = s.replace(/[₹$,\s]|rs\.?|inr/gi, "");
  if (s.startsWith("-")) { sign *= -1; s = s.slice(1); }
  else if (s.startsWith("+")) s = s.slice(1);
  const n = parseFloat(s);
  return Number.isFinite(n) ? sign * n : null;
}

export function parseStatementCsv(text: string): ParsedTransaction[] {
  const rows = parseCsvRows(text);
  if (rows.length === 0) throw new StatementParseError("The CSV file is empty.");

  // Many bank exports have a preamble before the real header — find it.
  let headerIdx = -1;
  let cols = { date: -1, description: -1, amount: -1, credit: -1, debit: -1, type: -1 };
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const headers = rows[i].map(norm);
    const c = {
      date: findColumn(headers, COLUMN_ALIASES.date),
      description: findColumn(headers, COLUMN_ALIASES.description),
      amount: findColumn(headers, COLUMN_ALIASES.amount),
      credit: findColumn(headers, COLUMN_ALIASES.credit),
      debit: findColumn(headers, COLUMN_ALIASES.debit),
      type: findColumn(headers, COLUMN_ALIASES.type),
    };
    if (c.date !== -1 && (c.amount !== -1 || c.credit !== -1 || c.debit !== -1)) {
      headerIdx = i;
      cols = c;
      break;
    }
  }
  if (headerIdx === -1) {
    throw new StatementParseError(
      "Could not find the required columns. Your CSV needs a date column and either an amount column or separate debit/credit (withdrawal/deposit) columns."
    );
  }

  const txns: ParsedTransaction[] = [];
  for (const r of rows.slice(headerIdx + 1)) {
    const date = (r[cols.date] || "").trim();
    if (!date) continue;
    let amount: number | null = null;
    if (cols.credit !== -1 || cols.debit !== -1) {
      const cr = cols.credit !== -1 ? parseAmount(r[cols.credit]) : null;
      const dr = cols.debit !== -1 ? parseAmount(r[cols.debit]) : null;
      if (cr != null || dr != null) amount = Math.abs(cr || 0) - Math.abs(dr || 0);
    }
    if ((amount == null || amount === 0) && cols.amount !== -1) {
      amount = parseAmount(r[cols.amount]);
      if (amount != null && cols.type !== -1) {
        const t = (r[cols.type] || "").toLowerCase();
        if (/^(dr|debit|d|withdrawal)/.test(t)) amount = -Math.abs(amount);
        else if (/^(cr|credit|c|deposit)/.test(t)) amount = Math.abs(amount);
      }
    }
    if (amount == null || amount === 0) continue;
    const description = cols.description !== -1 ? (r[cols.description] || "").trim() : "";
    txns.push({ date, description, amount, category: categorize(description, amount) });
  }

  if (txns.length === 0) {
    throw new StatementParseError("No valid transactions were found in the CSV file.");
  }
  return txns;
}

// ─── Categorization ───────────────────────────────────────────────────────────
const RULES: { category: string; priority: number; pattern: RegExp; creditOnly?: boolean; debitOnly?: boolean }[] = [
  { category: "INVESTMENT_80D", priority: 11, pattern: /health\s*insur|health\s*prem|medical\s*insur|mediclaim|bupa|star\s*health|care\s*health|hdfc\s*ergo|tata\s*aig\s*health|preventive|health\s*check/i, debitOnly: true },
  { category: "SALARY", priority: 10, pattern: /salary|\bsal\b|wages|payroll|stipend|bonus/i, creditOnly: true },
  { category: "INVESTMENT_80C", priority: 9, pattern: /\blic\b|life\s*insur|term\s*insur|\bppf\b|\bnps\b|elss|mutual\s*fund|\bmf\b|zerodha|groww|upstox|\bnsc\b|post\s*office|sukanya|tax\s*saver|tax\s*saving|\bepf\b|provident/i, debitOnly: true },
  { category: "HRA", priority: 7, pattern: /\brent\b|landlord|house\s*rent|\bhra\b|pg\s*rent/i, debitOnly: true },
  { category: "MEDICAL", priority: 6, pattern: /hospital|doctor|pharmacy|medical|clinic|apollo|practo|\b1mg\b|pharmeasy|medicine|dental/i, debitOnly: true },
  { category: "EDUCATION", priority: 5, pattern: /school|college|university|education|tuition|byjus|unacademy|coursera|udemy/i, debitOnly: true },
  { category: "DONATE", priority: 4, pattern: /charity|donation|\bngo\b|foundation|donate|relief|pm\s*cares|\bcry\b/i, debitOnly: true },
  { category: "INTEREST", priority: 3, pattern: /interest|\bint\.?\s*(pd|paid|cr)|fd\s*int|sweep/i, creditOnly: true },
  { category: "DIVIDEND", priority: 2, pattern: /dividend/i, creditOnly: true },
  { category: "DINING", priority: 1, pattern: /zomato|swiggy|restaurant|cafe|starbucks|mcdonald|kfc|domino|dining|food/i, debitOnly: true },
  { category: "DEDUCTIBLE_EXPENSE", priority: 1, pattern: /business|office|supplies|utilities|maintenance/i, debitOnly: true },
];

export function categorize(description: string, amount: number): string {
  let best = "OTHER";
  let bestPriority = -1;
  for (const rule of RULES) {
    if (rule.creditOnly && amount < 0) continue;
    if (rule.debitOnly && amount > 0) continue;
    if (rule.priority > bestPriority && rule.pattern.test(description)) {
      best = rule.category;
      bestPriority = rule.priority;
    }
  }
  return best;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────
const sumDebits = (txns: ParsedTransaction[], pred: (t: ParsedTransaction) => boolean) =>
  txns.filter((t) => t.amount < 0 && pred(t)).reduce((s, t) => s + Math.abs(t.amount), 0);
const sumCredits = (txns: ParsedTransaction[], pred: (t: ParsedTransaction) => boolean) =>
  txns.filter((t) => t.amount > 0 && pred(t)).reduce((s, t) => s + t.amount, 0);

function hasValues(obj: Record<string, unknown> | undefined | null, keys: string[]) {
  return !!obj && keys.some((k) => Number(obj[k]) > 0);
}

export function analyzeStatement(
  txns: ParsedTransaction[],
  savedProfile: any = null,
  financialYear = "2024-25"
) {
  const fy = savedProfile?.financialYear || financialYear;
  const regime: "OLD" | "NEW" = savedProfile?.regime === "NEW" ? "NEW" : "OLD";
  const is = (cat: string) => (t: ParsedTransaction) => t.category === cat;
  const desc = (re: RegExp) => (t: ParsedTransaction) => re.test(t.description);

  // Salary profile — prefer what the user entered, otherwise derive from statement
  const salaryCredits = sumCredits(txns, is("SALARY"));
  const otherIncome = sumCredits(txns, (t) => t.category === "INTEREST" || t.category === "DIVIDEND");
  const rentPaid = sumDebits(txns, is("HRA"));
  const saved = savedProfile?.salary;
  const salary: SalaryProfile = hasValues(saved, ["annualBasic", "annualHRA", "annualOtherIncome"])
    ? saved
    : {
        annualBasic: Math.round(salaryCredits),
        monthlyBasic: Math.round(salaryCredits / 12),
        annualHRA: 0,
        monthlyHRA: 0,
        annualRent: Math.round(rentPaid),
        monthlyRent: Math.round(rentPaid / 12),
        annualOtherIncome: Math.round(otherIncome),
        isMetro: true,
      };

  // Section 80C — derived from statement unless user entered values
  const c = is("INVESTMENT_80C");
  const lifeInsurance = sumDebits(txns, (t) => c(t) && /\blic\b|life\s*insur|term\s*insur/i.test(t.description));
  const ppf = sumDebits(txns, (t) => c(t) && /\bppf\b|sukanya/i.test(t.description));
  const nsc = sumDebits(txns, (t) => c(t) && /\bnsc\b|post\s*office/i.test(t.description));
  const taxSavingFD = sumDebits(txns, (t) => c(t) && /\bfd\b|fixed\s*deposit|deposit/i.test(t.description) && !/elss|mutual|fund/i.test(t.description));
  const epf = sumDebits(txns, (t) => c(t) && /\bepf\b|provident/i.test(t.description));
  const total80c = sumDebits(txns, c);
  const elss = Math.max(0, total80c - lifeInsurance - ppf - nsc - taxSavingFD - epf);
  const tuitionFees = sumDebits(txns, (t) => is("EDUCATION")(t) && desc(/tuition|school/i)(t));
  const derived80c: Section80CProfile = {
    epf, ppf, elss, lifeInsurance, nsc, taxSavingFD, tuitionFees, homeLoanPrincipal: 0, otherInvestments: 0,
  };
  const saved80c = savedProfile?.section80c;
  const section80c: Section80CProfile = hasValues(saved80c, Object.keys(derived80c)) ? saved80c : derived80c;

  // Section 80D
  const healthPremium = sumDebits(txns, (t) => is("INVESTMENT_80D")(t) && !/preventive|check\s*up|checkup/i.test(t.description));
  const checkup = sumDebits(txns, (t) => is("INVESTMENT_80D")(t) && /preventive|check\s*up|checkup/i.test(t.description));
  const saved80d = savedProfile?.section80d;
  const section80d: Section80DProfile = hasValues(saved80d, ["selfSpouseInsurance", "childrenInsurance", "parentsInsurance", "preventiveCheckup", "selfMedicalExp", "parentsMedicalExp"])
    ? saved80d
    : {
        selfSpouseInsurance: Math.round(healthPremium),
        childrenInsurance: 0,
        parentsInsurance: 0,
        isSelfSenior: saved80d?.isSelfSenior ?? false,
        isParentsSenior: saved80d?.isParentsSenior ?? false,
        preventiveCheckup: Math.round(checkup),
        selfMedicalExp: 0,
        parentsMedicalExp: 0,
      };

  // Section 80G — assume 50% qualifying donations
  const donations = sumDebits(txns, is("DONATE"));
  const donationDeduction = Math.round(donations * 0.5);

  const a = computeFullTaxAnalysis(salary, section80d, section80c, donationDeduction, fy, regime);

  // Tagged transactions & spending summary
  const SECTION_MAP: Record<string, string> = {
    INVESTMENT_80C: "80C", INVESTMENT_80D: "80D", HRA: "HRA", DONATE: "80G",
    SALARY: "Income", MEDICAL: "80D (Medical)", EDUCATION: "80E",
  };
  const tagged_transactions = txns
    .filter((t) => SECTION_MAP[t.category])
    .map((t) => ({
      description: t.description || "Unknown",
      amount: Math.abs(t.amount),
      date: t.date,
      category: t.category,
      section: SECTION_MAP[t.category],
      is_debit: t.amount < 0,
    }));

  const spending_summary: Record<string, number> = {};
  for (const cat of ["DINING", "MEDICAL", "EDUCATION", "HRA", "INVESTMENT_80C", "INVESTMENT_80D", "DONATE", "DEDUCTIBLE_EXPENSE"]) {
    const total = sumDebits(txns, is(cat));
    if (total > 0) spending_summary[cat] = Math.round(total);
  }

  const categorized = txns.filter((t) => t.category !== "OTHER").length;
  const classificationRate = (categorized / txns.length) * 100;
  const dataCompleteness = a.grossIncome > 0 ? 100 : 40;
  const patternScore = Math.min(100, (tagged_transactions.length / txns.length) * 200);
  const confidence_score = Math.min(97, Math.max(55, Math.round((classificationRate * 0.5 + dataCompleteness * 0.3 + patternScore * 0.2) * 10) / 10));

  const risk_flags: { level: string; message: string }[] = [];
  if (a.d80d === 0) risk_flags.push({ level: "HIGH", message: "No Section 80D health insurance detected. You are missing up to ₹25,000 in deductions and may be financially unprotected." });
  if (a.d80c < 75000) risk_flags.push({ level: "HIGH", message: `Less than 50% of 80C utilised (₹${a.d80c.toLocaleString("en-IN")}/₹1,50,000). You are leaving significant tax savings on the table.` });
  const dining = spending_summary.DINING || 0;
  if (dining > 0 && a.grossIncome > 0 && dining / a.grossIncome > 0.05) risk_flags.push({ level: "MEDIUM", message: `Discretionary dining spend (₹${dining.toLocaleString("en-IN")}) is over 5% of income. Consider redirecting some to tax-saving instruments.` });
  if (rentPaid > 0 && salary.annualHRA === 0) risk_flags.push({ level: "MEDIUM", message: `₹${Math.round(rentPaid).toLocaleString("en-IN")} in rent payments detected. Add your HRA component in the salary profile to claim the HRA exemption.` });
  if (rentPaid === 0 && a.grossIncome > 300000) risk_flags.push({ level: "MEDIUM", message: "No rent payments detected. If you pay rent, submit rent receipts to your employer to claim HRA exemption." });
  if (donations === 0) risk_flags.push({ level: "LOW", message: "No charitable donations found. Section 80G donations to eligible NGOs can provide up to 100% deduction." });
  risk_flags.push({ level: "INFO", message: "Ensure all deductions match your Annual Information Statement (AIS) on the Income Tax portal to avoid mismatches." });

  const insights: string[] = [];
  if (a.grossIncome === 0) insights.push("No salary credits were detected in your statement. Enter your salary details below for an accurate calculation.");
  if (a.d80c < 150000) insights.push(`You have ₹${(150000 - a.d80c).toLocaleString("en-IN")} remaining under Section 80C. Invest in ELSS/PPF before March 31 to reduce your tax.`);
  else insights.push("Section 80C is fully maximized at ₹1,50,000.");
  insights.push(
    a.recommendedRegime === "NEW"
      ? `The New Tax Regime is better for you, saving ₹${a.taxSaved.toLocaleString("en-IN")} compared to the Old Regime.`
      : `Stick to the Old Tax Regime. Your deductions save you ₹${a.taxSaved.toLocaleString("en-IN")} vs the New Regime.`
  );
  if (a.d80d === 0) insights.push("You are missing out on Section 80D limits. Consider health insurance to protect your family and save tax.");
  insights.push(`Analyzed ${txns.length} transactions — ${tagged_transactions.length} are tax-relevant.`);

  const breakdown = {
    gross_income: a.grossIncome,
    standard_deduction: a.standardDeduction,
    new_regime_std_deduction: fy === "2023-24" ? 50000 : 75000,
    "80c_deduction": a.d80c,
    "80d_deduction": a.d80d,
    hra_deduction: a.hraExemption,
    other_deductions: a.otherDeductions,
    old_taxable_income: a.oldTaxableIncome,
    new_taxable_income: a.newTaxableIncome,
    old_regime_tax: a.oldRegimeTax,
    new_regime_tax: a.newRegimeTax,
    tax_saved: a.taxSaved,
    recommended_regime: a.recommendedRegime,
    efficiency_score: a.efficiencyScore,
    selected_regime: a.selectedRegime,
    salary_profile: salary,
    section80c_profile: a.section80c,
    section80c_detailed: a.section80cResult,
    section_80c_profile: a.section80c,
    section_80c_detailed: a.section80cResult,
    section80d_profile: section80d,
    section80d_detailed: a.section80dResult,
    section_80d_profile: section80d,
    section_80d_detailed: a.section80dResult,
    hra_detailed: a.hraResult,
    financial_year: a.financialYear,
    old_tax_before_rebate: a.oldTaxBeforeRebate,
    new_tax_before_rebate: a.newTaxBeforeRebate,
    old_rebate: a.oldRebate,
    new_rebate: a.newRebate,
    old_cess: a.oldCess,
    new_cess: a.newCess,
  };

  return {
    gross_income: a.grossIncome,
    total_deductions: a.selectedRegime === "OLD" ? a.totalOldDeductions : a.standardDeduction,
    taxable_income: a.selectedRegime === "OLD" ? a.oldTaxableIncome : a.newTaxableIncome,
    estimated_tax: a.taxPayable,
    selectedRegime: a.selectedRegime,
    financial_year: a.financialYear,
    financialYear: a.financialYear,
    salary,
    section80c: a.section80c,
    section80d,
    breakdown,
    tax_liability: {
      old_regime_tax: a.oldRegimeTax,
      new_regime_tax: a.newRegimeTax,
      tax_saved: a.taxSaved,
      recommended: a.recommendedRegime,
    },
    efficiency_score: a.efficiencyScore,
    tagged_transactions,
    spending_summary,
    confidence_score,
    risk_flags,
    transaction_count: txns.length,
    summary: {
      gross_income: a.grossIncome,
      taxable_income: a.selectedRegime === "OLD" ? a.oldTaxableIncome : a.newTaxableIncome,
      tax_payable: a.taxPayable,
      insights,
    },
  };
}
