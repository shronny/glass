interface MetricsInput {
  stocks: { valueIls: string }[];
  options: { valueIls: string }[];
  savings: { balanceIls: string }[];
  pension: { balanceIls: string }[];
  liabilities: { balanceIls: string }[];
  cashflow: { freeCashIls: string }[];
}

interface ComputedMetrics {
  netWorthIls: number;
  liquidAssetsIls: number;
  illiquidAssetsIls: number;
  usdExposureIls: number;
  ilsExposureIls: number;
  monthlyFreeCash: number;
}

function sumField<T>(rows: T[], field: keyof T): number {
  return rows.reduce((acc, row) => acc + Number(row[field]), 0);
}

export function computeMetrics(data: MetricsInput): ComputedMetrics {
  const stocksValue = sumField(data.stocks, "valueIls");
  const optionsValue = sumField(data.options, "valueIls");
  const savingsValue = sumField(data.savings, "balanceIls");
  const pensionValue = sumField(data.pension, "balanceIls");
  const liabilitiesValue = sumField(data.liabilities, "balanceIls");
  const freeCash = sumField(data.cashflow, "freeCashIls");

  return {
    netWorthIls: stocksValue + optionsValue + savingsValue + pensionValue - liabilitiesValue,
    liquidAssetsIls: stocksValue,
    illiquidAssetsIls: savingsValue + pensionValue,
    usdExposureIls: stocksValue + optionsValue,
    ilsExposureIls: savingsValue + pensionValue,
    monthlyFreeCash: freeCash,
  };
}
