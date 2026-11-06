import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

import pandas as pd
from app.services.tax_calculator_service import TaxCalculatorService

def run_test():
    df = pd.DataFrame([
        {'category': 'SALARY', 'amount': 1200000},
        {'category': 'INVESTMENT_80C', 'amount': -95000},
        {'category': 'INVESTMENT_80D', 'amount': -18000}
    ])

    res = TaxCalculatorService.generate_tax_report(df, 1200000)
    import json
    # Print the specific breakdown the user wanted to see
    print(json.dumps(res['breakdown'], indent=2))

if __name__ == "__main__":
    run_test()
