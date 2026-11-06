"""
LLM Service — Advanced Rule-Based Tax Intelligence Chatbot
Designed to feel like a real AI — rich, contextual, natural language responses.
Works entirely offline; no OpenAI key required.
"""
import re
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


def _fmt(n):
    """Format number as Indian currency string."""
    try:
        return f"₹{float(n):,.0f}"
    except Exception:
        return str(n)


# ─────────────────────────────────────────────────────────────────────────────
# KNOWLEDGE BASE — rich, multi-paragraph answers
# ─────────────────────────────────────────────────────────────────────────────
KNOWLEDGE = {
    "80c": """**Section 80C** is the most popular tax-saving section in India, allowing a deduction of up to **₹1,50,000** from your taxable income under the **Old Regime**.

Here's what qualifies:
• **ELSS Mutual Funds** — Best option: 3-year lock-in, market-linked returns (~12–18% p.a.)
• **PPF (Public Provident Fund)** — Safe, guaranteed 7.1% p.a., 15-year tenure, EEE tax status
• **LIC/Life Insurance Premiums** — Deductible if premium ≤ 10% of sum assured
• **EPF (Employee Provident Fund)** — Your 12% salary contribution is auto-deducted
• **NSC (National Savings Certificate)** — 5-year lock-in, 7.7% p.a., post office investment
• **5-Year Tax Saver FD** — Fixed 6–7.5% returns, but no early withdrawal
• **Tuition fees** for children (up to 2 children)
• **Sukanya Samriddhi Yojana** — For girl child, exceptional 8% EEE returns

**Pro tip:** If 80C is partially filled, ELSS is the best top-up because it has the shortest lock-in and best potential returns.""",

    "80d": """**Section 80D Health Insurance Deduction Guide (FY 2024-25):**

Section 80D allows tax deductions for health insurance premiums, medical expenses, and preventive health check-ups under the **Old Tax Regime**.

### 📊 Statutory Deduction Limits:
| Category | Non-Senior Citizen (<60 yrs) | Senior Citizen (≥60 yrs) |
|---|---|---|
| **Self, Spouse & Dependent Children** | **₹25,000** | **₹50,000** |
| **Parents (Additional)** | **₹25,000** | **₹50,000** |
| **Maximum Total Deductible** | **₹50,000** | **Up to ₹1,00,000** |

---

### 🔍 Key Provisions & Rules:
1. **Preventive Health Check-up:**
   • Up to **₹5,000** within the overall category limit.
   • Cash payment is permitted **only** for preventive check-ups (all insurance premiums must be paid via non-cash modes: NetBanking, UPI, Card, Cheque).
2. **Medical Expenditure for Senior Citizens:**
   • If parents are senior citizens (≥ 60 years) and **cannot get health insurance**, actual medical expenses up to **₹50,000** can be claimed directly.
3. **Multi-Year Health Policies:**
   • Premium is allowed proportionately over the policy term.
4. **Regime Applicability:**
   • Section 80D is **strictly available only under the Old Tax Regime**. Under the New Regime (Section 115BAC), Chapter VI-A deductions including 80D are not permitted.

💡 **Pro Tip:** Having health insurance saves you up to ₹31,200 in tax (at the 30% slab with senior parents) while providing crucial emergency medical coverage!""",

    "hra": """**HRA (House Rent Allowance)** exemption lets salaried employees reduce taxable income if they pay rent. The exemption is the **least of these three:**

1. Actual HRA received from employer
2. **50%** of basic salary (if you live in Mumbai, Delhi, Kolkata, Chennai) or **40%** (other cities)
3. Rent paid minus **10% of basic salary**

**Example:** Basic salary = ₹60,000/month, HRA received = ₹20,000/month, Rent paid = ₹18,000/month (non-metro)
• Rule 1: ₹20,000
• Rule 2: ₹24,000 (40% of 60K)
• Rule 3: ₹12,000 (18K − 6K)
• **Exemption = ₹12,000/month = ₹1,44,000/year**

**Documents needed:** Rent receipts + landlord's PAN (if annual rent exceeds ₹1,00,000). Only available under the **Old Regime**.""",

    "nps": """**NPS (National Pension System)** is one of the most underutilized tax-saving instruments in India.

**Two deduction sections:**
• **80CCD(1):** Employee contribution up to 10% of salary — counted within the ₹1.5L 80C cap
• **80CCD(1B): Extra ₹50,000 deduction BEYOND the 80C cap** — this is the real benefit!

So if you maximize both: **₹1,50,000 (80C) + ₹50,000 (NPS 1B) = ₹2,00,000 total deduction**

**Returns:** NPS historically delivers 9–12% p.a. with 3 asset classes — Equity (E), Corporate Debt (C), Government Securities (G).

**Tax on withdrawal:**
• At age 60: 60% is **tax-free**, 40% must be used to buy annuity (annuity income is taxable)
• Partial withdrawal allowed after 3 years for specific purposes

Only available under the **Old Regime**.""",

    "old regime": """The **Old Tax Regime** allows you to claim all deductions available under the Income Tax Act and has been the default regime for years.

**Tax Slabs (FY 2024-25):**
| Income Slab | Tax Rate |
|---|---|
| Up to ₹2.5L | NIL |
| ₹2.5L – ₹5L | 5% |
| ₹5L – ₹10L | 20% |
| Above ₹10L | 30% |

**+ 4% Health & Education Cess on total tax**

**Key deductions you can claim:**
• Section 80C: ₹1,50,000 (ELSS, PPF, LIC, EPF, etc.)
• Section 80D: ₹25,000–₹1,00,000 (health insurance)
• HRA exemption (if you pay rent)
• NPS 80CCD(1B): extra ₹50,000
• 87A rebate: Zero tax if taxable income ≤ ₹5,00,000

**When to choose Old Regime:** When your total deductions (80C + 80D + HRA + NPS) exceed roughly ₹3.75L for a ₹10L income.""",

    "new regime": """The **New Tax Regime** (updated in Budget 2024) offers lower tax rates but **no deductions** — except the standard deduction.

**Tax Slabs (FY 2024-25 — Budget 2024):**
| Income Slab | Tax Rate |
|---|---|
| Up to ₹3L | NIL |
| ₹3L – ₹7L | 5% |
| ₹7L – ₹10L | 10% |
| ₹10L – ₹12L | 15% |
| ₹12L – ₹15L | 20% |
| Above ₹15L | 30% |

**Key benefits:**
• **Standard deduction of ₹75,000** (increased from ₹50,000 in Budget 2024)
• **87A rebate: Zero tax if income ≤ ₹7,00,000** (effectively making ₹7L tax-free!)
• Marginal relief for incomes just above ₹7L
• Lower rates benefit high-income earners with few deductions
• This is now the DEFAULT regime — you must opt out to use the Old Regime

**When to choose New Regime:** When your total deductions are less than ~₹3.75L, or your income is very high (above ₹15L) where the rate difference matters less.""",

    "87a": """**Section 87A** is a full tax rebate that makes your tax liability **zero** if income stays within limits.

**FY 2024-25 limits:**
• **New Regime:** Taxable income up to **₹7,00,000** → Zero tax
• **Old Regime:** Taxable income up to **₹5,00,000** → Zero tax

**How it works:** Even if the marginal tax calculation gives a positive number, the rebate wipes it out entirely. This is why effective tax rate is truly 0% up to these income levels.

**Important caveat:** If your income is ₹7,00,001 under the New Regime, you pay tax on the full amount — not just the extra ₹1. However, **marginal relief** ensures you never pay more tax than the income above ₹7L itself.""",

    "itr": """**ITR Filing — Key Dates for FY 2024-25:**

| Category | Deadline |
|---|---|
| Salaried individuals (not audited) | **31 July 2025** |
| Businesses requiring audit | 31 October 2025 |
| Businesses with transfer pricing | 30 November 2025 |
| Revised / Belated ITR | 31 December 2025 |

**Which ITR form to use?**
• **ITR-1 (Sahaj):** Salaried, pension, one house property, income ≤ ₹50L
• **ITR-2:** Multiple house properties, capital gains, foreign income
• **ITR-3:** Business income (non-presumptive)
• **ITR-4:** Presumptive business income (44AD/44ADA)

**File at:** [incometax.gov.in](https://incometax.gov.in) — use your PAN as login ID.

**Late filing penalty:** ₹5,000 (₹1,000 if income < ₹5L). Also, you lose the ability to carry forward capital losses if you file late.""",

    "elss": """**ELSS (Equity Linked Savings Scheme)** is the smartest 80C investment for most people under 50.

**Why ELSS is the best 80C option:**
✅ Shortest lock-in: **only 3 years** (vs 15 years for PPF or 5 years for FD)
✅ Highest potential returns: **12–18% p.a.** historically (market-linked)
✅ Tax on gains: **10% LTCG above ₹1L/year** (very low)
✅ Can SIP monthly — invest ₹5,000–₹12,500/month to fill the ₹1.5L cap
✅ No entry/exit load after 3 years

**Top ELSS funds (by 5-year performance):**
1. Mirae Asset Tax Saver Fund
2. Axis Long Term Equity Fund
3. Parag Parikh Tax Saver Fund
4. Canara Robeco Equity Tax Saver
5. DSP Tax Saver Fund

**Start ELSS SIPs early in the financial year (April) rather than rushing in March.**""",

    "capital gains": """**Capital Gains Tax in India (FY 2024-25 — Post Budget):**

**Equity (Shares / Equity Mutual Funds):**
| Type | Holding Period | Tax Rate |
|---|---|---|
| Short-term (STCG) | < 1 year | **20%** (increased from 15% in Budget 2024) |
| Long-term (LTCG) | > 1 year | **12.5%** above ₹1,25,000/year (increased from 10% above ₹1L) |

**Debt Mutual Funds:** Taxed as per **income slab** for both STCG and LTCG (no indexation benefit after April 2023).

**Real Estate:**
| Type | Tax Rate |
|---|---|
| LTCG (> 2 years) | **12.5%** without indexation (Budget 2024 removed indexation) |
| STCG | As per slab |

**Gold:** LTCG at 12.5% after 2 years; STCG at slab rate.""",

    "standard deduction": """The **Standard Deduction** is a flat, automatic deduction — no receipts or proof needed.

**FY 2024-25 amounts:**
• **Old Regime:** ₹50,000
• **New Regime:** ₹75,000 (increased in Budget 2024 from ₹50,000)

**Who gets it:** All salaried employees and pensioners. It's deducted directly from gross salary before computing tax. Even if you have no other deductions, this ₹75,000 is guaranteed under the new regime.

**History:** Standard deduction was reintroduced in Budget 2018 after being withdrawn in 2005. The ₹75,000 limit under the new regime makes the new regime significantly more attractive for low-deduction taxpayers.""",

    "salary slip": """Your salary slip is important for tax planning. Key components:

• **Basic Salary:** Base of HRA and PF calculations
• **HRA:** House Rent Allowance — can be fully/partially exempted
• **Special Allowance:** Fully taxable
• **LTA (Leave Travel Allowance):** Exempt for actual travel twice in 4 years
• **Medical Reimbursement:** Tax-free up to ₹15,000/year (Old Regime)
• **EPF Contribution:** Your 12% of basic goes to PF — gets 80C deduction

**To minimize tax:** Ask HR to restructure salary to maximize HRA, add meal coupons (₹50/day tax-free), add phone/data reimbursement (actual amount tax-free), and reduce special allowance (which is 100% taxable).""",

    "form 16": """**Form 16** is a TDS certificate issued by your employer by June 15 after the financial year ends.

**Two parts:**
• **Part A:** TDS deducted and deposited with the government (quarter-wise)
• **Part B:** Salary details, deductions claimed, taxable income computation

**You need Form 16 to:**
✓ File your ITR (pre-fills much of the data)
✓ Verify the correct TDS was deducted
✓ Apply for tax refunds if excess TDS was deducted

**If TDS exceeds actual tax liability:** You'll get a **refund** after filing ITR, typically credited in 2–6 weeks via direct bank credit.

**Multiple employers:** If you switched jobs mid-year, get Form 16 from both employers and consolidate.""",

    "ppf": """**PPF (Public Provident Fund)** is the safest long-term tax-saving instrument.

**Key facts:**
• **Interest rate:** 7.1% p.a. (government-set quarterly, tax-free)
• **Tenure:** 15 years (extendable in 5-year blocks)
• **Max deposit:** ₹1,50,000/year (minimum ₹500/year)
• **Tax status:** Triple exempt (EEE) — Investment, Interest, and Maturity all tax-free

**Partial withdrawal:** Allowed from year 7 onwards (up to 50% of balance at end of year 4 or year prior to withdrawal, whichever is less)

**Loan against PPF:** Available from year 3 to year 6 at 2% above PPF rate

**Best for:** Conservative investors, those who want guaranteed returns, retirement corpus building

**Downside:** 15-year lock-in makes it illiquid. For tax saving with better returns, ELSS is typically better.""",

    "tds": """**TDS (Tax Deducted at Source)** is tax deducted by the payer before paying you.

**Common TDS scenarios:**
| Source | TDS Rate | Threshold |
|---|---|---|
| Salary | As per slab | After deductions |
| FD interest | 10% | Interest > ₹40,000/year |
| Rent received | 10% | Rent > ₹50,000/month |
| Professional fees | 10% | Fees > ₹30,000/year |
| Winnings (lottery/game) | 30% | Any amount |

**To avoid excess TDS on salary:**
• Submit your investment declarations in April
• Submit actual proofs in January–February
• File Form 15G/15H (if income < taxable limit) for FD interest

**TDS refund:** If total TDS > actual tax liability, claim refund by filing ITR. It typically arrives in 2–6 weeks.""",

    "80e": """**Section 80E** allows deduction for interest paid on **education loans**.

• **What's deductible:** Interest paid on loan taken for higher education (self, spouse, children, or student for whom you are legal guardian)
• **How much:** 100% of interest paid — **no upper limit!**
• **Duration:** Maximum 8 consecutive years starting from the year repayment begins
• **Eligible courses:** Graduation, post-graduation (full-time and vocational), in India or abroad

**Example:** If you pay ₹1,20,000/year as education loan interest, you can deduct the entire amount — potentially saving ₹37,200 in tax at the 30% slab.

**Only the interest component qualifies — not the principal repayment.** Only available under the **Old Regime**.""",

    "80g": """**Section 80G** allows deductions for donations to eligible charitable organizations.

**Deduction rates:**
• **100% deduction (no limit):** PM National Relief Fund, PM CARES, National Defence Fund
• **100% deduction (with 10% of adjusted gross income limit):** Donations to approved institutions
• **50% deduction (no limit):** Jawaharlal Nehru Memorial Fund, Rajiv Gandhi Foundation
• **50% deduction (with 10% limit):** Most other registered NGOs

**How to claim:** Get a receipt with the organization's 80G registration number. Cash donations above ₹2,000 are not deductible — pay by cheque/UPI.

**Check 80G registration:** Verify on incometax.gov.in before donating.""",

    "tax refund": """**Tax Refund** is money the government returns when you have paid more tax than you owe.

**How to get your refund:**
1. File your ITR accurately with all deductions
2. Verify your ITR (via Aadhaar OTP, bank EVC, or digital signature)
3. Refund is processed and credited to your **pre-validated bank account**
4. Typically takes **15–45 days** for e-verified returns

**Track refund status:** Income Tax portal → e-File → Income Tax Returns → View Filed Returns, or NSDL's TIN website.

**Common reasons for refund delay:**
• Bank account not pre-validated on IT portal
• Outstanding demand from previous years being adjusted
• ITR under scrutiny

**If refund is delayed beyond 6 months**, you're entitled to **interest at 6% p.a.** on the refund amount under Section 244A.""",

    "home loan": """**Section 24b — Home Loan Interest Deduction:**

• **Self-occupied property:** Deduct up to **₹2,00,000/year** on interest paid
• **Let-out property:** Entire interest paid is deductible (no cap) — but set-off against rental income/other heads is limited

**Section 80C — Principal Repayment:**
• Principal repaid counts under 80C up to ₹1,50,000/year

**Additional benefit — Section 80EE / 80EEA:**
• First-time homebuyers: Extra ₹50,000 deduction on interest (80EE — for loans < ₹35L on property < ₹50L, sanctioned before April 2022)

**Documents needed:** Home loan certificate from your bank showing interest and principal breakup for the year.""",
}

# ─────────────────────────────────────────────────────────────────────────────
# INTENT PATTERNS — maps regex to knowledge base keys
# ─────────────────────────────────────────────────────────────────────────────
INTENT_PATTERNS = [
    (r'80\s*c\b|section 80c|elss|ppf|lic|life insur|tax.sav|invest.*tax', "80c"),
    (r'80\s*d\b|section 80d|health insur|medic(al|laim|ine)|health prem', "80d"),
    (r'\bhra\b|house rent|rent.*allow|pay.*rent|rent.*pay', "hra"),
    (r'\bnps\b|national pension|80ccd|pension fund', "nps"),
    (r'old\s+regime|old.*tax\s+regime|old\s+vs|switch.*regime', "old regime"),
    (r'new\s+regime|new.*tax\s+regime|budget\s+202[34]|section 87a|zero.*tax', "new regime"),
    (r'87\s*a\b|rebate|zero.*tax|tax.*zero|no.*tax', "87a"),
    (r'\bitr\b|file.*return|income.*tax.*return|filing.*deadline|due.*date', "itr"),
    (r'\belss\b|mutual.*fund.*tax|tax.*mutual|equity.*linked.*sav', "elss"),
    (r'capital\s*gain|ltcg|stcg|shares.*tax|equity.*sold|mf.*tax', "capital gains"),
    (r'standard\s+deduction|flat.*deduction|75.?000|auto.*deduct', "standard deduction"),
    (r'salary\s+slip|pay\s+slip|ctc|cost to company|restructur.*salary', "salary slip"),
    (r'form\s*16|tds\s+cert|employer.*cert', "form 16"),
    (r'\bppf\b|public\s+provident|provident\s+fund\b', "ppf"),
    (r'\btds\b|tax\s+deduc.*source|form\s*26as|tds.*refund', "tds"),
    (r'80\s*e\b|education\s+loan|student\s+loan|interest.*educat', "80e"),
    (r'80\s*g\b|donat|charity|ngo|pm\s*cares|pmrf', "80g"),
    (r'refund|money\s+back|excess\s+tax|over.*paid.*tax', "tax refund"),
    (r'home\s+loan|house\s+loan|section\s+24|mortgag|principal.*repay', "home loan"),
]


class LLMService:
    def __init__(self, api_key=None, model=None):
        self.api_key = api_key
        self.model = model

    # ─────────────────────────────────────────────────────────────────────────
    def _get_user_summary(self, context: dict) -> str:
        """Build a personalized 'your profile' string from context."""
        if not context:
            return ""
        gross = context.get("gross_income", 0)
        regime = context.get("recommended_regime", "")
        tax = context.get("tax_payable", 0)
        ded = context.get("total_deductions", 0)
        if not gross:
            return ""
        lines = [f"\n\n---\n*📊 Your profile: Income {_fmt(gross)}"]
        if tax:
            lines.append(f", Tax {_fmt(tax)}")
        if regime:
            lines.append(f", Recommended: {regime} Regime")
        if ded:
            lines.append(f", Deductions: {_fmt(ded)}")
        lines.append("*")
        return "".join(lines)

    # ─────────────────────────────────────────────────────────────────────────
    def _personalized_snapshot(self, context: dict) -> str:
        """Detailed snapshot when user asks about their own tax."""
        gross = context.get("gross_income", 0)
        regime = context.get("recommended_regime", "N/A")
        tax = context.get("tax_payable", 0)
        ded = context.get("total_deductions", 0)
        taxable = context.get("taxable_income", 0)
        fy = context.get("financial_year", "2024-25")

        reply = f"""Here's your complete tax profile for **FY {fy}**:

**Income & Tax Summary**
• Gross Income: **{_fmt(gross)}**
• Total Deductions Claimed: **{_fmt(ded)}**
• Taxable Income: **{_fmt(taxable)}**
• Tax Payable: **{_fmt(tax)}**
• Recommended Regime: **{regime} Regime**

**What this means for you:**"""

        if not gross:
            return "I don't have your tax data yet. Please upload your bank statement first and then come back to ask me about your specific numbers!"

        if regime == "NEW":
            reply += f"\nThe **New Tax Regime** is mathematically optimal for you. With your deduction level of {_fmt(ded)}, the New Regime's lower slab rates give you a better outcome."
        else:
            reply += f"\nThe **Old Tax Regime** is better for you because your deductions ({_fmt(ded)}) are high enough to offset the higher tax rates."

        reply += f"\n\nWould you like to know how to reduce your tax further, which regime to choose, or get a breakdown of available deductions?"
        return reply

    # ─────────────────────────────────────────────────────────────────────────
    def _rule_chat(self, message: str, context: dict) -> str:
        msg = message.strip()
        msg_lower = msg.lower()

        # ── Greetings ────────────────────────────────────────────────────────
        if re.search(r'^(hi|hello|hey|namaste|good\s*(morning|evening|afternoon)|howdy)', msg_lower):
            has_data = bool(context and context.get("gross_income"))
            if has_data:
                gross = context.get("gross_income", 0)
                regime = context.get("recommended_regime", "")
                tax = context.get("tax_payable", 0)
                return (
                    f"Hello! 👋 I'm TaxMind AI — your personal Indian tax advisor.\n\n"
                    f"I can see your analysis is loaded: you earned **{_fmt(gross)}** this year "
                    f"with a tax liability of **{_fmt(tax)}** under the **{regime} Regime**.\n\n"
                    f"Ask me anything — how to reduce your tax, which deductions to claim, ELSS vs PPF, "
                    f"HRA exemption, NPS benefits, ITR filing, capital gains, or anything else about Indian taxation. I'm here to help! 🚀"
                )
            return (
                "Hello! 👋 I'm **TaxMind AI** — an intelligent Indian tax advisor.\n\n"
                "I can help you with:\n"
                "• 📊 **Section 80C, 80D, HRA, NPS** deductions explained\n"
                "• ⚖️ **Old vs New Regime** comparison for your income\n"
                "• 💡 **ELSS, PPF, NPS** — which investment maximizes savings\n"
                "• 📅 **ITR filing deadlines** and which form to use\n"
                "• 💰 **Capital gains tax** on stocks, mutual funds, real estate\n"
                "• 🏠 **Home loan** and education loan deductions\n\n"
                "Upload your bank statement to get personalized advice, or just ask me any tax question!"
            )

        # ── Thanks / positive feedback ────────────────────────────────────────
        if re.search(r'\b(thank|thanks|great|awesome|perfect|helpful|nice|superb|excellent|good one|well done)\b', msg_lower):
            return "You're very welcome! 😊 Tax planning can get complex, but that's exactly what I'm here for. Feel free to ask anything else — whether it's about specific sections, investment strategies, or your numbers."

        # ── Personal tax questions ────────────────────────────────────────────
        if re.search(r'\bmy (tax|income|deduction|saving|regime|80c|80d|hra|data|analys|result|number)\b|\bhow much (do i|did i|will i|am i)\b|\bwhat (is|was|are) my\b|my profile|my total|i (owe|paid|saved)', msg_lower):
            if context and context.get("gross_income"):
                return self._personalized_snapshot(context)
            return "I don't have your tax data loaded yet. Please go to the **Upload page**, upload your bank statement CSV, and then come back — I'll have all your personalized numbers ready!"

        # ── "How to reduce / save tax" ────────────────────────────────────────
        if re.search(r'(how\s+to\s+(reduce|save|lower|cut|minimize|decrease)\s+tax|tax\s+(saving|reduction|tips|planning|hack|strategies|advice))', msg_lower):
            gross = context.get("gross_income", 0) if context else 0
            base = f"""Here are the **most effective tax-saving strategies** for Indian salaried professionals:

**🥇 Tier 1 — Must Do (High Impact)**
1. **Max out Section 80C** (₹1,50,000): Invest in ELSS, PPF, or ensure your LIC + EPF + home loan principal adds up. Saves up to ₹46,800 at 30% slab.
2. **Buy Health Insurance — Section 80D** (₹25,000–₹1,00,000): Saves ₹7,800–₹31,200 AND gives you coverage.
3. **Claim HRA** if you're paying rent — submit rent receipts to HR.

**🥈 Tier 2 — Smart Moves**
4. **NPS 80CCD(1B)**: Extra ₹50,000 deduction beyond 80C cap. Saves ₹15,600 at 30%.
5. **Home loan interest (Section 24b)**: Up to ₹2,00,000 deduction on interest.
6. **Education loan interest (80E)**: 100% of interest, no cap, for 8 years.

**🥉 Tier 3 — Don't Forget**
7. **Charitable donations (80G)**: Donate to PM Relief Fund — 100% deductible.
8. **LTA**: Claim Leave Travel Allowance for actual travel (2 times in 4 years).
9. **Choose the right regime**: Compare Old vs New — one can save you ₹20K–₹50K annually."""
            if gross:
                base += f"\n\n*Based on your income of {_fmt(gross)}, the right combination could save you significantly. Ask me to calculate the exact impact for any of these!*"
            return base

        # ── Old vs New regime comparison ──────────────────────────────────────
        if re.search(r'(which\s+(regime|is\s+better)|old\s+(or|vs|versus)\s+new|compare.*regime|regime.*comparison|should\s+i\s+(choose|pick|go|switch)|better\s+(regime|option))', msg_lower):
            gross = context.get("gross_income", 0) if context else 0
            rec = context.get("recommended_regime", "") if context else ""
            base = """**Old vs New Regime — Decision Framework:**

The break-even point depends on your income. As a rule:

| Income Level | Break-Even Deduction Needed for Old Regime |
|---|---|
| ₹7L–₹10L | ~₹2.5L+ in deductions |
| ₹10L–₹15L | ~₹3.5L+ in deductions |
| Above ₹15L | ~₹4L+ in deductions |

**Old Regime wins if:** You have 80C maxed (₹1.5L) + health insurance (₹25K) + HRA + NPS (₹50K) + home loan.

**New Regime wins if:** You're young, just started working, live with parents (no HRA), have no LIC/PPF, and prefer simplicity.

**Quick test:** Add your 80C + 80D + HRA + NPS. If the total deductions minus ₹75K (new regime std ded) × your marginal rate > the regime tax difference, choose Old Regime."""

            if gross and rec:
                base += f"\n\n**Your verdict:** Based on your income ({_fmt(gross)}) and deductions, the **{rec} Regime is recommended for you** — as shown in your dashboard analysis."
            return base

        # ── Knowledge base keyword match ────────────────────────────────────
        for pattern, key in INTENT_PATTERNS:
            if re.search(pattern, msg_lower):
                answer = KNOWLEDGE.get(key, "")
                if answer:
                    # Add personalization suffix if context available
                    suffix = ""
                    if context and context.get("gross_income"):
                        regime = context.get("recommended_regime", "")
                        if key in ("80c", "80d", "hra", "nps", "80e", "80g", "home loan") and regime == "NEW":
                            suffix = "\n\n> ⚠️ **Note for you:** Based on your analysis, the **New Regime is recommended**, which means this deduction won't apply unless you switch to the Old Regime. Run the 'What-If' simulator on your dashboard to see if switching would save you money."
                        elif key in ("80c", "80d", "nps", "hra") and regime == "OLD":
                            suffix = f"\n\n> ✅ **Good news:** You're already on the **Old Regime** — this deduction applies to you. Check your Dashboard for how much of this you've already utilized."
                    return answer + suffix + self._get_user_summary(context)

        # ── General "what is tax" type questions ─────────────────────────────
        if re.search(r'what\s+is\s+(income\s+tax|tax\s+slab|direct\s+tax|indirect\s+tax|gst)', msg_lower):
            return """**Income Tax in India** is a direct tax levied by the central government on income earned in a financial year.

**Key facts:**
• Administered by the **Income Tax Department** under the Ministry of Finance
• Governed by the **Income Tax Act, 1961**
• Financial Year: **April 1 to March 31** (FY 2024-25 = April 2024 to March 2025)
• Assessment Year (AY): The year following FY — AY 2025-26 for income earned in FY 2024-25

**Types of taxable income:**
1. Salaries and wages
2. House property rental income
3. Profits from business or profession
4. Capital gains (sale of assets)
5. Other sources (interest, dividends, winnings)

The tax you pay depends on your applicable regime (Old or New) and the deductions you're eligible to claim. Filing your ITR is mandatory if your income exceeds ₹3,00,000."""

        # ── Investment advice ────────────────────────────────────────────────
        if re.search(r'invest|where\s+to\s+(put|invest)|best\s+(invest|fund|option|scheme)', msg_lower):
            return """**Best tax-saving investments for Indian taxpayers (ranked by returns vs liquidity):**

| Rank | Instrument | Lock-in | Expected Return | Tax on Returns |
|---|---|---|---|---|
| 🥇 | **ELSS Mutual Fund** | 3 years | 12–18% p.a. | 10% LTCG above ₹1.25L |
| 🥈 | **NPS** | Till 60 | 9–12% p.a. | 60% tax-free at maturity |
| 🥉 | **PPF** | 15 years | 7.1% p.a. | 100% tax-free (EEE) |
| 4 | **NSC** | 5 years | 7.7% p.a. | Interest taxable |
| 5 | **Tax Saver FD** | 5 years | 6–7.5% p.a. | Interest taxable |
| 6 | **Sukanya Samriddhi** | Till daughter's 21st birthday | 8% p.a. | 100% tax-free |

**My recommendation:** Fill 80C with ELSS SIPs first (best returns, shortest lock-in), then open NPS for the extra ₹50,000 80CCD(1B) benefit, then buy health insurance for 80D. This trio alone can save ₹70,000+ in taxes."""

        # ── AIS / Form 26AS ──────────────────────────────────────────────────
        if re.search(r'\bais\b|annual\s+information|form\s*26as|26\s*as', msg_lower):
            return """**AIS (Annual Information Statement)** is a comprehensive view of all your financial transactions as reported to the Income Tax Department.

**What it contains:**
• TDS on salary, interest, rent, securities
• Sale/purchase of securities & mutual funds
• Real estate transactions
• Foreign remittances
• GST turnover
• Bank interest received

**Why it matters:**
⚠️ The IT department uses AIS to cross-verify your ITR. Any mismatch between what you report and what's in AIS can trigger a **tax notice**.

**How to view:** Login to incometax.gov.in → Services → Annual Information Statement (AIS)

**Best practice:** Before filing ITR, download your AIS and Form 26AS, and ensure your ITR matches these figures — especially for bank interest, capital gains, and rent income."""

        # ── Fallback — still useful ──────────────────────────────────────────
        topics = ["80C investments (ELSS, PPF, LIC)", "80D health insurance", "HRA exemption",
                  "NPS (extra ₹50,000 deduction)", "Old vs New Regime comparison",
                  "ITR filing deadlines and forms", "Capital gains tax (stocks, MF, real estate)",
                  "Home loan and education loan deductions", "TDS and tax refunds",
                  "Form 16 and AIS verification"]
        return (
            f"I couldn't find a specific answer for: *\"{msg}\"*\n\n"
            "Here's what I can help you with:\n"
            + "\n".join(f"• {t}" for t in topics)
            + "\n\nTry rephrasing your question, or ask something like:\n"
            "*\"How much can I save with 80C?\"* or *\"Should I choose Old or New Regime?\"* or *\"What is ELSS?\"*"
        )

    # ─────────────────────────────────────────────────────────────────────────
    def chat(self, message: str, context: dict, history: list = None,
             max_tokens: int = 400, temperature: float = 0.5) -> str:
        try:
            return self._rule_chat(message, context or {})
        except Exception as e:
            logger.exception("Chat error")
            return "I encountered an unexpected error. Please try asking again!"

    def generate_tax_recommendations(self, financial_summary: dict, **kwargs) -> str:
        return self._rule_chat("how to reduce tax", financial_summary)
