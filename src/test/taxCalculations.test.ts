import { describe, it, expect } from "vitest";
import {
  monthlyToAnnual,
  annualToMonthly,
  calculateHRAExemption,
  calculateSection80D,
  calculateOldRegimeTax,
  calculateNewRegimeTax,
  computeFullTaxAnalysis,
} from "../lib/taxCalculations";

describe("Salary Inputs Bidirectional Sync", () => {
  it("converts monthly basic to annual correctly", () => {
    expect(monthlyToAnnual(50000)).toBe(600000);
    expect(monthlyToAnnual(85000)).toBe(1020000);
  });

  it("converts annual basic to monthly correctly", () => {
    expect(annualToMonthly(600000)).toBe(50000);
    expect(annualToMonthly(1200000)).toBe(100000);
  });

  it("handles 0 and negative inputs safely", () => {
    expect(monthlyToAnnual(0)).toBe(0);
    expect(monthlyToAnnual(-5000)).toBe(0);
    expect(annualToMonthly(-120000)).toBe(0);
  });
});

describe("Smart HRA Optimizer Section 10(13A)", () => {
  it("calculates HRA exemption correctly for Metro (50%)", () => {
    // Annual Basic: 6,00,000; HRA Received: 2,40,000; Rent Paid: 1,80,000
    // Rule 1: Actual HRA = 2,40,000
    // Rule 2: 50% of Basic = 3,00,000
    // Rule 3: Rent - 10% of Basic = 1,80,000 - 60,000 = 1,20,000
    // Lowest = 1,20,000
    const res = calculateHRAExemption(600000, 240000, 180000, true);
    expect(res.exemption).toBe(120000);
    expect(res.remainingTaxableHra).toBe(120000);
    expect(res.breakdown.actualHra).toBe(240000);
    expect(res.breakdown.percentageOfBasic).toBe(300000);
    expect(res.breakdown.rentMinus10pctBasic).toBe(120000);
  });

  it("calculates HRA exemption correctly for Non-Metro (40%)", () => {
    // Annual Basic: 6,00,000; HRA Received: 2,40,000; Rent Paid: 3,50,000
    // Rule 1: Actual HRA = 2,40,000
    // Rule 2: 40% of Basic = 2,40,000
    // Rule 3: Rent - 10% of Basic = 3,50,000 - 60,000 = 2,90,000
    // Lowest = 2,40,000
    const res = calculateHRAExemption(600000, 240000, 350000, false);
    expect(res.exemption).toBe(240000);
    expect(res.remainingTaxableHra).toBe(0);
    expect(res.breakdown.percentageOfBasic).toBe(240000);
  });

  it("prevents negative HRA exemptions when rent is low", () => {
    // Rent is 30,000; 10% of 6,00,000 is 60,000 -> Rent - 10% Basic = -30,000 -> 0
    const res = calculateHRAExemption(600000, 240000, 30000, true);
    expect(res.exemption).toBe(0);
    expect(res.remainingTaxableHra).toBe(240000);
  });
});

describe("Section 80D Comprehensive Medical Insurance", () => {
  it("caps non-senior parents insurance at ₹25,000", () => {
    const res = calculateSection80D(
      {
        selfSpouseInsurance: 20000,
        childrenInsurance: 0,
        parentsInsurance: 35000,
        isSelfSenior: false,
        isParentsSenior: false,
        preventiveCheckup: 0,
        selfMedicalExp: 0,
        parentsMedicalExp: 0,
      },
      "2024-25",
      "OLD"
    );

    expect(res.eligibleSelfFamily).toBe(20000);
    expect(res.eligibleParents).toBe(25000); // capped at 25,000
    expect(res.totalEligible80D).toBe(45000);
    expect(res.disallowedAmount).toBe(10000); // 55,000 - 45,000
  });

  it("increases limit to ₹50,000 for senior-citizen parents", () => {
    const res = calculateSection80D(
      {
        selfSpouseInsurance: 20000,
        childrenInsurance: 0,
        parentsInsurance: 45000,
        isSelfSenior: false,
        isParentsSenior: true, // Senior parents!
        preventiveCheckup: 0,
        selfMedicalExp: 0,
        parentsMedicalExp: 0,
      },
      "2024-25",
      "OLD"
    );

    expect(res.eligibleSelfFamily).toBe(20000);
    expect(res.eligibleParents).toBe(45000); // up to 50,000 allowed
    expect(res.totalEligible80D).toBe(65000);
    expect(res.disallowedAmount).toBe(0);
  });

  it("caps preventive health check-up at ₹5,000 within category limits", () => {
    const res = calculateSection80D(
      {
        selfSpouseInsurance: 22000,
        childrenInsurance: 0,
        parentsInsurance: 20000,
        isSelfSenior: false,
        isParentsSenior: false,
        preventiveCheckup: 8000, // Claiming 8,000
        selfMedicalExp: 0,
        parentsMedicalExp: 0,
      },
      "2024-25",
      "OLD"
    );

    // Max preventive allowed across categories = 5000
    // Self headroom = 25000 - 22000 = 3000 -> gets 3000 of preventive
    // Parents headroom = 25000 - 20000 = 5000 -> gets remaining 2000 of preventive
    // Total preventive used = 5000
    expect(res.preventiveDeductionUsed).toBe(5000);
    expect(res.eligibleSelfFamily).toBe(25000);
    expect(res.eligibleParents).toBe(22000);
    expect(res.totalEligible80D).toBe(47000);
    expect(res.disallowedAmount).toBe(3000); // 50,000 total claimed - 47,000 allowed
  });

  it("excludes Section 80D completely under the New Regime", () => {
    const res = calculateSection80D(
      {
        selfSpouseInsurance: 25000,
        childrenInsurance: 10000,
        parentsInsurance: 50000,
        isSelfSenior: true,
        isParentsSenior: true,
        preventiveCheckup: 5000,
        selfMedicalExp: 0,
        parentsMedicalExp: 0,
      },
      "2024-25",
      "NEW"
    );

    expect(res.isAllowedUnderRegime).toBe(false);
    expect(res.totalEligible80D).toBe(0);
    expect(res.disallowedAmount).toBe(res.totalClaimed80D);
  });
});

describe("Old vs New Regime Tax Calculations", () => {
  it("calculates correct old regime tax with 87A rebate", () => {
    expect(calculateOldRegimeTax(500000)).toBe(0);
    // Taxable 6,00,000:
    // 2.5L to 5L = 12,500
    // 5L to 6L = 20,000
    // Subtotal = 32,500 + 4% cess = 33,800
    expect(calculateOldRegimeTax(600000)).toBe(33800);
  });

  it("calculates correct new regime tax (Budget 2024) with 87A rebate", () => {
    expect(calculateNewRegimeTax(700000, "2024-25")).toBe(0);
    // Taxable 8,00,000:
    // 3L to 7L @ 5% = 20,000
    // 7L to 8L @ 10% = 10,000
    // Subtotal = 30,000 + 4% cess = 31,200
    expect(calculateNewRegimeTax(800000, "2024-25")).toBe(31200);
  });

  it("integrates salary, 80D, 80C and HRA into full tax computation", () => {
    const salary = {
      monthlyBasic: 80000,
      annualBasic: 960000,
      monthlyHRA: 30000,
      annualHRA: 360000,
      monthlyRent: 25000,
      annualRent: 300000,
      annualOtherIncome: 40000,
      isMetro: true,
    };

    const section80d = {
      selfSpouseInsurance: 25000,
      childrenInsurance: 0,
      parentsInsurance: 40000,
      isSelfSenior: false,
      isParentsSenior: true, // Senior parents limit: 50,000
      preventiveCheckup: 5000,
      selfMedicalExp: 0,
      parentsMedicalExp: 0,
    };

    const result = computeFullTaxAnalysis(
      salary,
      section80d,
      150000, // 80C
      0, // other
      "2024-25",
      "OLD"
    );

    expect(result.grossIncome).toBe(1360000); // 9.6L + 3.6L + 40k
    expect(result.d80c).toBe(150000);
    // 80D: Self: 25k, Parents: 40k + 5k preventive = 45k -> total 70k
    expect(result.d80d).toBe(70000);
    // HRA: Basic 9.6L, HRA 3.6L, Rent 3L.
    // Rule 1: 3.6L
    // Rule 2: 50% of 9.6L = 4.8L
    // Rule 3: Rent (3L) - 10% of Basic (96k) = 2.04L
    // Exemption = 2.04L
    expect(result.hraExemption).toBe(204000);
    expect(result.oldTaxableIncome).toBe(
      1360000 - (50000 + 150000 + 70000 + 204000)
    ); // 886000
    expect(result.oldRegimeTax).toBeGreaterThan(0);
    expect(result.newRegimeTax).toBeGreaterThan(0);
  });
});
