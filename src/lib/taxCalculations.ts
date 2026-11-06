/**
 * Comprehensive Indian Tax Calculations Engine
 * Supports Financial Years 2023-24, 2024-25, 2025-26
 * Implements Section 10(13A) HRA, Section 80D, Section 80C, and Old vs New Regime rules.
 */

export interface FinancialYearConfig {
  fy: string;
  oldRegimeStdDeduction: number;
  newRegimeStdDeduction: number;
  max80C: number;
  oldRegimeRebateThreshold: number;
  oldRegimeRebateMax: number;
  newRegimeRebateThreshold: number;
  newRegimeRebateMax: number;
  oldRegimeSlabs: { upto: number; rate: number }[];
  newRegimeSlabs: { upto: number; rate: number }[];
  section80D: {
    selfNonSeniorLimit: number;
    selfSeniorLimit: number;
    parentsNonSeniorLimit: number;
    parentsSeniorLimit: number;
    preventiveCheckupSublimit: number;
  };
}

export const FY_CONFIGS: Record<string, FinancialYearConfig> = {
  "2023-24": {
    fy: "2023-24",
    oldRegimeStdDeduction: 50000,
    newRegimeStdDeduction: 50000,
    max80C: 150000,
    oldRegimeRebateThreshold: 500000,
    oldRegimeRebateMax: 12500,
    newRegimeRebateThreshold: 700000,
    newRegimeRebateMax: 25000,
    oldRegimeSlabs: [{ upto: 250000, rate: 0 }, { upto: 500000, rate: 0.05 }, { upto: 1000000, rate: 0.2 }, { upto: Infinity, rate: 0.3 }],
    newRegimeSlabs: [{ upto: 300000, rate: 0 }, { upto: 600000, rate: 0.05 }, { upto: 900000, rate: 0.1 }, { upto: 1200000, rate: 0.15 }, { upto: 1500000, rate: 0.2 }, { upto: Infinity, rate: 0.3 }],
    section80D: {
      selfNonSeniorLimit: 25000,
      selfSeniorLimit: 50000,
      parentsNonSeniorLimit: 25000,
      parentsSeniorLimit: 50000,
      preventiveCheckupSublimit: 5000,
    },
  },
  "2024-25": {
    fy: "2024-25",
    oldRegimeStdDeduction: 50000,
    newRegimeStdDeduction: 75000, // Budget 2024 revised standard deduction
    max80C: 150000,
    oldRegimeRebateThreshold: 500000,
    oldRegimeRebateMax: 12500,
    newRegimeRebateThreshold: 700000,
    newRegimeRebateMax: 25000,
    oldRegimeSlabs: [{ upto: 250000, rate: 0 }, { upto: 500000, rate: 0.05 }, { upto: 1000000, rate: 0.2 }, { upto: Infinity, rate: 0.3 }],
    newRegimeSlabs: [{ upto: 300000, rate: 0 }, { upto: 700000, rate: 0.05 }, { upto: 1000000, rate: 0.1 }, { upto: 1200000, rate: 0.15 }, { upto: 1500000, rate: 0.2 }, { upto: Infinity, rate: 0.3 }],
    section80D: {
      selfNonSeniorLimit: 25000,
      selfSeniorLimit: 50000,
      parentsNonSeniorLimit: 25000,
      parentsSeniorLimit: 50000,
      preventiveCheckupSublimit: 5000,
    },
  },
  "2025-26": {
    fy: "2025-26",
    oldRegimeStdDeduction: 50000,
    newRegimeStdDeduction: 75000,
    max80C: 150000,
    oldRegimeRebateThreshold: 500000,
    oldRegimeRebateMax: 12500,
    newRegimeRebateThreshold: 1200000,
    newRegimeRebateMax: 60000,
    oldRegimeSlabs: [{ upto: 250000, rate: 0 }, { upto: 500000, rate: 0.05 }, { upto: 1000000, rate: 0.2 }, { upto: Infinity, rate: 0.3 }],
    newRegimeSlabs: [{ upto: 400000, rate: 0 }, { upto: 800000, rate: 0.05 }, { upto: 1200000, rate: 0.1 }, { upto: 1600000, rate: 0.15 }, { upto: 2000000, rate: 0.2 }, { upto: 2400000, rate: 0.25 }, { upto: Infinity, rate: 0.3 }],
    section80D: {
      selfNonSeniorLimit: 25000,
      selfSeniorLimit: 50000,
      parentsNonSeniorLimit: 25000,
      parentsSeniorLimit: 50000,
      preventiveCheckupSublimit: 5000,
    },
  },
  "2026-27": {
    fy: "2026-27",
    oldRegimeStdDeduction: 50000,
    newRegimeStdDeduction: 75000,
    max80C: 150000,
    oldRegimeRebateThreshold: 500000,
    oldRegimeRebateMax: 12500,
    newRegimeRebateThreshold: 1200000,
    newRegimeRebateMax: 60000,
    oldRegimeSlabs: [{ upto: 250000, rate: 0 }, { upto: 500000, rate: 0.05 }, { upto: 1000000, rate: 0.2 }, { upto: Infinity, rate: 0.3 }],
    newRegimeSlabs: [{ upto: 400000, rate: 0 }, { upto: 800000, rate: 0.05 }, { upto: 1200000, rate: 0.1 }, { upto: 1600000, rate: 0.15 }, { upto: 2000000, rate: 0.2 }, { upto: 2400000, rate: 0.25 }, { upto: Infinity, rate: 0.3 }],
    section80D: {
      selfNonSeniorLimit: 25000,
      selfSeniorLimit: 50000,
      parentsNonSeniorLimit: 25000,
      parentsSeniorLimit: 50000,
      preventiveCheckupSublimit: 5000,
    },
  },
};

export interface SalaryProfile {
  monthlyBasic: number;
  annualBasic: number;
  monthlyHRA: number;
  annualHRA: number;
  monthlyRent: number;
  annualRent: number;
  annualOtherIncome: number;
  isMetro: boolean;
}

export interface Section80DProfile {
  selfSpouseInsurance: number;
  childrenInsurance: number;
  parentsInsurance: number;
  isSelfSenior: boolean;
  isParentsSenior: boolean;
  preventiveCheckup: number;
  parentsPreventiveCheckup?: number;
  selfMedicalExp: number;
  parentsMedicalExp: number;
  parentsUninsured?: boolean;
}

export interface HRACalculationResult {
  annualBasic: number;
  annualHra: number;
  annualRent: number;
  isMetro: boolean;
  exemption: number;
  remainingTaxableHra: number;
  ruleApplied: string;
  breakdown: {
    actualHra: number;
    percentageOfBasic: number;
    rentMinus10pctBasic: number;
  };
}
export interface Section80CProfile {
  epf: number; // Employee Provident Fund
  ppf: number; // Public Provident Fund
  elss: number; // ELSS Mutual Funds
  lifeInsurance: number; // Life Insurance Premium
  nsc: number; // National Savings Certificate
  taxSavingFD: number; // Tax-saving 5-yr Fixed Deposits
  tuitionFees: number; // Eligible children's tuition fees
  homeLoanPrincipal: number; // Home Loan Principal Repayment
  otherInvestments: number; // Other eligible investments (SSY, SCSS, etc.)
}

export interface Section80CResult {
  financialYear: string;
  regime: "OLD" | "NEW";
  isAllowedUnderRegime: boolean;
  totalInvested: number;
  eligibleDeduction: number;
  excessInvestments: number;
  unusedLimit: number;
  limit: number;
  items: Section80CProfile;
  explanation: string;
}

export interface Section80DResult {
  financialYear: string;
  regime: "OLD" | "NEW";
  isAllowedUnderRegime: boolean;
  selfFamilyClaimed: number;
  parentsClaimed: number;
  preventiveClaimed: number;
  totalLimit: number;
  selfFamilyLimit: number;
  parentsLimit: number;
  preventiveSublimit: number;
  eligibleSelfFamily: number;
  eligibleParents: number;
  totalEligible80D: number;
  totalClaimed80D: number;
  disallowedAmount: number;
  preventiveDeductionUsed: number;
  explanation: string;
}

export interface FullTaxCalculationResult {
  financialYear: string;
  selectedRegime: "OLD" | "NEW";
  salary: SalaryProfile;
  section80c: Section80CProfile;
  section80cResult: Section80CResult;
  section80d: Section80DProfile;
  section80dResult: Section80DResult;
  hraResult: HRACalculationResult;
  grossIncome: number;
  standardDeduction: number;
  d80c: number;
  d80d: number;
  hraExemption: number;
  otherDeductions: number;
  totalOldDeductions: number;
  oldTaxableIncome: number;
  newTaxableIncome: number;
  oldRegimeTax: number;
  newRegimeTax: number;
  oldTaxBeforeRebate: number;
  newTaxBeforeRebate: number;
  oldRebate: number;
  newRebate: number;
  oldCess: number;
  newCess: number;
  taxPayable: number;
  taxSaved: number;
  recommendedRegime: "OLD" | "NEW";
  efficiencyScore: number;
}

/**
 * Bidirectional salary synchronizers
 */
export function monthlyToAnnual(monthly: number): number {
  if (isNaN(monthly) || monthly < 0) return 0;
  return Math.round(monthly * 12);
}

export function annualToMonthly(annual: number): number {
  if (isNaN(annual) || annual < 0) return 0;
  return Math.round(annual / 12);
}

/**
 * Section 10(13A) Smart HRA Optimizer
 */
export function calculateHRAExemption(
  basicSalary: number,
  hraReceived: number,
  rentPaid: number,
  isMetro: boolean = true
): HRACalculationResult {
  const safeBasic = Math.max(0, Number(basicSalary) || 0);
  const safeHra = Math.max(0, Number(hraReceived) || 0);
  const safeRent = Math.max(0, Number(rentPaid) || 0);

  if (safeBasic <= 0 || safeHra <= 0 || safeRent <= 0) {
    return {
      annualBasic: safeBasic,
      annualHra: safeHra,
      annualRent: safeRent,
      isMetro,
      exemption: 0,
      remainingTaxableHra: safeHra,
      ruleApplied: "Inputs required (Basic, HRA, and Rent must be > 0)",
      breakdown: {
        actualHra: safeHra,
        percentageOfBasic: safeBasic * (isMetro ? 0.5 : 0.4),
        rentMinus10pctBasic: Math.max(0, safeRent - safeBasic * 0.1),
      },
    };
  }

  // Rule 1: Actual HRA received
  const rule1ActualHra = safeHra;

  // Rule 2: 50% for Metro, 40% for Non-Metro of Basic
  const percentage = isMetro ? 0.5 : 0.4;
  const rule2PctBasic = safeBasic * percentage;

  // Rule 3: Actual rent paid minus 10% of basic
  const rule3RentMinusTenPct = Math.max(0, safeRent - safeBasic * 0.1);

  // Exemption is the lowest of the 3 rules
  const eligibleExemption = Math.max(
    0,
    Math.min(rule1ActualHra, rule2PctBasic, rule3RentMinusTenPct)
  );

  let ruleApplied = "";
  if (eligibleExemption === rule1ActualHra) {
    ruleApplied = "Rule 1: Actual HRA Received";
  } else if (eligibleExemption === rule2PctBasic) {
    ruleApplied = `Rule 2: ${isMetro ? "50%" : "40%"} of Annual Basic Salary`;
  } else {
    ruleApplied = "Rule 3: Rent Paid minus 10% of Basic Salary";
  }

  const remainingTaxableHra = Math.max(0, safeHra - eligibleExemption);

  return {
    annualBasic: safeBasic,
    annualHra: safeHra,
    annualRent: safeRent,
    isMetro,
    exemption: Math.round(eligibleExemption),
    remainingTaxableHra: Math.round(remainingTaxableHra),
    ruleApplied,
    breakdown: {
      actualHra: Math.round(rule1ActualHra),
      percentageOfBasic: Math.round(rule2PctBasic),
      rentMinus10pctBasic: Math.round(rule3RentMinusTenPct),
    },
  };
}

/**
 * Section 80C Investment Deductions Calculator
 * Maximum Statutory Cap: ₹1,50,000 per financial year (Old Regime)
 */
export function calculateSection80C(
  profile: Section80CProfile,
  financialYear: string = "2024-25",
  regime: "OLD" | "NEW" = "OLD"
): Section80CResult {
  const config = FY_CONFIGS[financialYear] || FY_CONFIGS["2024-25"];
  const limit = config.max80C;

  const epf = Math.max(0, Number(profile.epf) || 0);
  const ppf = Math.max(0, Number(profile.ppf) || 0);
  const elss = Math.max(0, Number(profile.elss) || 0);
  const lifeInsurance = Math.max(0, Number(profile.lifeInsurance) || 0);
  const nsc = Math.max(0, Number(profile.nsc) || 0);
  const taxSavingFD = Math.max(0, Number(profile.taxSavingFD) || 0);
  const tuitionFees = Math.max(0, Number(profile.tuitionFees) || 0);
  const homeLoanPrincipal = Math.max(0, Number(profile.homeLoanPrincipal) || 0);
  const otherInvestments = Math.max(0, Number(profile.otherInvestments) || 0);

  const totalInvested =
    epf +
    ppf +
    elss +
    lifeInsurance +
    nsc +
    taxSavingFD +
    tuitionFees +
    homeLoanPrincipal +
    otherInvestments;

  if (regime === "NEW") {
    return {
      financialYear,
      regime: "NEW",
      isAllowedUnderRegime: false,
      totalInvested: Math.round(totalInvested),
      eligibleDeduction: 0,
      excessInvestments: Math.round(totalInvested),
      unusedLimit: limit,
      limit,
      items: {
        epf,
        ppf,
        elss,
        lifeInsurance,
        nsc,
        taxSavingFD,
        tuitionFees,
        homeLoanPrincipal,
        otherInvestments,
      },
      explanation:
        "Section 80C investment deductions are NOT permitted under the New Tax Regime (Section 115BAC). Under the New Regime, standard deduction of ₹75,000 is permitted, but Chapter VI-A deductions (80C, 80D, 80G) are excluded.",
    };
  }

  const eligibleDeduction = Math.min(limit, totalInvested);
  const excessInvestments = Math.max(0, totalInvested - limit);
  const unusedLimit = Math.max(0, limit - totalInvested);

  let explanation = `Total declared 80C investments: ₹${totalInvested.toLocaleString("en-IN")}. Eligible tax deduction: ₹${eligibleDeduction.toLocaleString("en-IN")} (capped at statutory limit of ₹${limit.toLocaleString("en-IN")}).`;
  if (excessInvestments > 0) {
    explanation += ` Excess investment of ₹${excessInvestments.toLocaleString("en-IN")} does not qualify for additional tax relief.`;
  } else if (unusedLimit > 0) {
    explanation += ` You have ₹${unusedLimit.toLocaleString("en-IN")} unused capacity remaining to reach the maximum ₹${limit.toLocaleString("en-IN")} limit.`;
  }

  return {
    financialYear,
    regime: "OLD",
    isAllowedUnderRegime: true,
    totalInvested: Math.round(totalInvested),
    eligibleDeduction: Math.round(eligibleDeduction),
    excessInvestments: Math.round(excessInvestments),
    unusedLimit: Math.round(unusedLimit),
    limit,
    items: {
      epf,
      ppf,
      elss,
      lifeInsurance,
      nsc,
      taxSavingFD,
      tuitionFees,
      homeLoanPrincipal,
      otherInvestments,
    },
    explanation,
  };
}

/**
 * Section 80D Comprehensive Medical Insurance Calculator
 */
export function calculateSection80D(
  profile: Section80DProfile,
  financialYear: string = "2024-25",
  regime: "OLD" | "NEW" = "OLD"
): Section80DResult {
  const config = FY_CONFIGS[financialYear] || FY_CONFIGS["2024-25"];
  const { section80D } = config;

  const selfSpouse = Math.max(0, Number(profile.selfSpouseInsurance) || 0);
  const children = Math.max(0, Number(profile.childrenInsurance) || 0);
  const parents = Math.max(0, Number(profile.parentsInsurance) || 0);
  const selfPreventive = Math.max(0, Number(profile.preventiveCheckup) || 0);
  const parentsPreventive = Math.max(0, Number(profile.parentsPreventiveCheckup) || 0);
  const preventive = selfPreventive + parentsPreventive;
  const selfMedExp = Math.max(0, Number(profile.selfMedicalExp) || 0);
  const parentsMedExp = Math.max(0, Number(profile.parentsMedicalExp) || 0);

  // Applicable limits based on senior citizen status
  const selfFamilyLimit = profile.isSelfSenior
    ? section80D.selfSeniorLimit
    : section80D.selfNonSeniorLimit;

  const parentsLimit = profile.isParentsSenior
    ? section80D.parentsSeniorLimit
    : section80D.parentsNonSeniorLimit;

  const preventiveSublimit = section80D.preventiveCheckupSublimit;

  // Medical expenditure is legally eligible only for senior citizens
  const eligibleSelfMed = profile.isSelfSenior && selfSpouse + children === 0 ? selfMedExp : 0;
  const eligibleParentsMed = profile.isParentsSenior && parents === 0 ? parentsMedExp : 0;
  const allowedPreventive = Math.min(preventive, preventiveSublimit);
  const selfPreventiveInput = Math.min(selfPreventive, allowedPreventive);
  const parentsPreventiveInput = Math.max(0, allowedPreventive - selfPreventiveInput);
  const rawSelfFamily = selfSpouse + children + eligibleSelfMed;
  const rawParents = parents + eligibleParentsMed;

  // Total claimed by user
  const totalClaimed80D = selfSpouse + children + parents + preventive + eligibleSelfMed + eligibleParentsMed;

  // In New Regime, Section 80D is strictly disallowed
  if (regime === "NEW") {
    return {
      financialYear,
      regime: "NEW",
      isAllowedUnderRegime: false,
      selfFamilyClaimed: rawSelfFamily,
      parentsClaimed: rawParents,
      preventiveClaimed: preventive,
      totalLimit: selfFamilyLimit + parentsLimit,
      selfFamilyLimit,
      parentsLimit,
      preventiveSublimit,
      eligibleSelfFamily: 0,
      eligibleParents: 0,
      totalEligible80D: 0,
      totalClaimed80D,
      disallowedAmount: totalClaimed80D,
      preventiveDeductionUsed: 0,
      explanation:
        "Section 80D health insurance deductions are NOT available under the New Tax Regime (Section 115BAC). Under the New Regime, standard deduction of ₹75,000 is permitted, but Chapter VI-A deductions (80C, 80D, 80G) are excluded.",
    };
  }

  // Preventive check-ups have a ₹5,000 combined sublimit and count within category caps.
  const selfHeadroom = Math.max(0, selfFamilyLimit - rawSelfFamily);
  const selfPreventiveUsed = Math.min(allowedPreventive, selfHeadroom);

  const remPreventive = allowedPreventive - selfPreventiveUsed;
  const parentsHeadroom = Math.max(0, parentsLimit - rawParents);
  const parentsPreventiveUsed = Math.min(remPreventive, parentsHeadroom);

  const totalPreventiveUsed = selfPreventiveUsed + parentsPreventiveUsed;
  const eligibleSelfFamily = Math.min(selfFamilyLimit, rawSelfFamily + selfPreventiveUsed);
  const eligibleParents = Math.min(parentsLimit, rawParents + parentsPreventiveUsed);

  const totalEligible80D = eligibleSelfFamily + eligibleParents;
  const disallowedAmount = Math.max(0, totalClaimed80D - totalEligible80D);

  let explanation = `Self & Family eligible: ₹${eligibleSelfFamily.toLocaleString("en-IN")} (limit ₹${selfFamilyLimit.toLocaleString("en-IN")}). Parents eligible: ₹${eligibleParents.toLocaleString("en-IN")} (limit ₹${parentsLimit.toLocaleString("en-IN")}).`;
  if (preventive > 0) {
    explanation += ` Preventive check-up claim of ₹${preventive.toLocaleString("en-IN")} capped at ₹${totalPreventiveUsed.toLocaleString("en-IN")} within category limits.`;
  }
  if (disallowedAmount > 0) {
    explanation += ` Disallowed amount: ₹${disallowedAmount.toLocaleString("en-IN")} due to statutory ceilings or eligibility limits.`;
  }

  return {
    financialYear,
    regime: "OLD",
    isAllowedUnderRegime: true,
    selfFamilyClaimed: rawSelfFamily,
    parentsClaimed: rawParents,
    preventiveClaimed: preventive,
    totalLimit: selfFamilyLimit + parentsLimit,
    selfFamilyLimit,
    parentsLimit,
    preventiveSublimit,
    eligibleSelfFamily: Math.round(eligibleSelfFamily),
    eligibleParents: Math.round(eligibleParents),
    totalEligible80D: Math.round(totalEligible80D),
    totalClaimed80D: Math.round(totalClaimed80D),
    disallowedAmount: Math.round(disallowedAmount),
    preventiveDeductionUsed: Math.round(totalPreventiveUsed),
    explanation,
  };
}

/**
 * Old Regime Tax Calculation with 87A rebate and 4% Health & Education Cess
 */
export function calculateTaxBeforeCess(taxableIncome: number, slabs: { upto: number; rate: number }[]): number {
  const taxable = Math.max(0, Number(taxableIncome) || 0);
  let tax = 0;
  let lower = 0;
  for (const slab of slabs) {
    tax += Math.max(0, Math.min(taxable, slab.upto) - lower) * slab.rate;
    if (taxable <= slab.upto) break;
    lower = slab.upto;
  }
  return Math.round(tax);
}

export function calculateOldRegimeTax(taxableIncome: number, financialYear = "2024-25"): number {
  const config = FY_CONFIGS[financialYear] || FY_CONFIGS["2024-25"];
  const taxable = Math.max(0, Number(taxableIncome) || 0);
  const beforeRebate = calculateTaxBeforeCess(taxable, config.oldRegimeSlabs);
  const rebate = taxable <= config.oldRegimeRebateThreshold ? Math.min(beforeRebate, config.oldRegimeRebateMax) : 0;
  return Math.round((beforeRebate - rebate) * 1.04);
}

/**
 * New Regime Tax Calculation (Budget 2024 / Section 115BAC) with 87A rebate, marginal relief, and 4% Cess
 */
export function calculateNewRegimeTax(taxableIncome: number, financialYear = "2024-25"): number {
  const config = FY_CONFIGS[financialYear] || FY_CONFIGS["2024-25"];
  const taxable = Math.max(0, Number(taxableIncome) || 0);
  const beforeRebate = calculateTaxBeforeCess(taxable, config.newRegimeSlabs);
  let rebate = taxable <= config.newRegimeRebateThreshold
    ? Math.min(beforeRebate, config.newRegimeRebateMax)
    : 0;
  if (taxable > config.newRegimeRebateThreshold) {
    rebate = Math.max(rebate, beforeRebate - (taxable - config.newRegimeRebateThreshold));
  }
  return Math.round((beforeRebate - rebate) * 1.04);
}

/**
 * Integrated Tax Computation combining Salary, HRA, 80D, 80C, and other deductions
 */
export function computeFullTaxAnalysis(
  salary: SalaryProfile,
  section80d: Section80DProfile,
  d80cClaimed: number | Section80CProfile = 0,
  otherDeductionsClaimed: number = 0,
  financialYear: string = "2024-25",
  selectedRegime: "OLD" | "NEW" = "OLD"
): FullTaxCalculationResult {
  const config = FY_CONFIGS[financialYear] || FY_CONFIGS["2024-25"];

  // Gross Salary = Annual Basic + Annual HRA + Other Income
  const grossIncome = Math.max(
    0,
    salary.annualBasic + salary.annualHRA + salary.annualOtherIncome
  );

  // HRA Exemption
  const hraResult = calculateHRAExemption(
    salary.annualBasic,
    salary.annualHRA,
    salary.annualRent,
    salary.isMetro
  );

  // Section 80D under Old Regime (for comparison) and under selected regime
  const section80dOldResult = calculateSection80D(
    section80d,
    financialYear,
    "OLD"
  );
  const section80dResult = calculateSection80D(
    section80d,
    financialYear,
    selectedRegime
  );

  const section80cProfile: Section80CProfile = typeof d80cClaimed === "number"
    ? { epf: Math.max(0, d80cClaimed), ppf: 0, elss: 0, lifeInsurance: 0, nsc: 0, taxSavingFD: 0, tuitionFees: 0, homeLoanPrincipal: 0, otherInvestments: 0 }
    : d80cClaimed;
  const section80cOldResult = calculateSection80C(section80cProfile, financialYear, "OLD");
  const section80cResult = calculateSection80C(section80cProfile, financialYear, selectedRegime);
  const d80cEligible = section80cOldResult.eligibleDeduction;
  const { epf, ppf, elss, lifeInsurance, nsc, taxSavingFD, tuitionFees, homeLoanPrincipal, otherInvestments } = section80cProfile;
  const normalizedSection80c = { epf, ppf, elss, lifeInsurance, nsc, taxSavingFD, tuitionFees, homeLoanPrincipal, otherInvestments };

  // Other deductions (80G donations, 80E, etc.)
  const otherDeds = Math.max(0, Number(otherDeductionsClaimed) || 0);

  // Old Regime Taxable Income
  const oldStandardDeduction = config.oldRegimeStdDeduction;
  const oldDeductionsTotal =
    oldStandardDeduction +
    d80cEligible +
    section80dOldResult.totalEligible80D +
    hraResult.exemption +
    otherDeds;

  const oldTaxableIncome = Math.max(0, grossIncome - oldDeductionsTotal);

  // New Regime Taxable Income
  const newStandardDeduction = config.newRegimeStdDeduction;
  const newTaxableIncome = Math.max(0, grossIncome - newStandardDeduction);

  // Tax Liabilities
  const oldTaxBeforeRebate = calculateTaxBeforeCess(oldTaxableIncome, config.oldRegimeSlabs);
  const newTaxBeforeRebate = calculateTaxBeforeCess(newTaxableIncome, config.newRegimeSlabs);
  const oldRebate = oldTaxableIncome <= config.oldRegimeRebateThreshold ? Math.min(oldTaxBeforeRebate, config.oldRegimeRebateMax) : 0;
  const newRebate = newTaxableIncome <= config.newRegimeRebateThreshold
    ? Math.min(newTaxBeforeRebate, config.newRegimeRebateMax)
    : Math.max(0, newTaxBeforeRebate - (newTaxableIncome - config.newRegimeRebateThreshold));
  const oldCess = Math.round((oldTaxBeforeRebate - oldRebate) * 0.04);
  const newCess = Math.round((newTaxBeforeRebate - newRebate) * 0.04);
  const oldRegimeTax = Math.round(oldTaxBeforeRebate - oldRebate + oldCess);
  const newRegimeTax = Math.round(newTaxBeforeRebate - newRebate + newCess);

  const recommendedRegime: "OLD" | "NEW" =
    oldRegimeTax <= newRegimeTax ? "OLD" : "NEW";
  const taxSaved = Math.abs(newRegimeTax - oldRegimeTax);
  const taxPayable = selectedRegime === "OLD" ? oldRegimeTax : newRegimeTax;

  // Efficiency score
  const score80C = Math.min(1.0, d80cEligible / config.max80C);
  const maxPotential80D =
    section80dOldResult.selfFamilyLimit + section80dOldResult.parentsLimit;
  const score80D = Math.min(
    1.0,
    section80dOldResult.totalEligible80D / maxPotential80D
  );
  const scoreHra =
    salary.annualHRA > 0 ? hraResult.exemption / salary.annualHRA : 0.8;
  const efficiencyScore = Math.round(
    (score80C * 0.4 + score80D * 0.4 + scoreHra * 0.2) * 100
  );

  return {
    financialYear,
    selectedRegime,
    salary,
    section80c: normalizedSection80c,
    section80cResult,
    section80d,
    hraResult,
    section80dResult,
    grossIncome,
    standardDeduction:
      selectedRegime === "OLD" ? oldStandardDeduction : newStandardDeduction,
    d80c: d80cEligible,
    d80d: section80dResult.totalEligible80D,
    hraExemption: selectedRegime === "OLD" ? hraResult.exemption : 0,
    otherDeductions: selectedRegime === "OLD" ? otherDeds : 0,
    totalOldDeductions: oldDeductionsTotal,
    oldTaxableIncome,
    newTaxableIncome,
    oldRegimeTax,
    newRegimeTax,
    oldTaxBeforeRebate,
    newTaxBeforeRebate,
    oldRebate,
    newRebate,
    oldCess,
    newCess,
    taxPayable,
    taxSaved,
    recommendedRegime,
    efficiencyScore: Math.min(100, Math.max(10, efficiencyScore)),
  };
}
