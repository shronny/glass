import type { StockEntry } from "./StocksSection";
import type { OptionEntry } from "./OptionsSection";
import type { SavingsEntry } from "./SavingsSection";
import type { PensionEntry } from "./PensionSection";
import type { LiabilityEntry } from "./LiabilitiesSection";

interface SummaryBarProps {
  stocks: StockEntry[];
  options: OptionEntry[];
  savings: SavingsEntry[];
  pension: PensionEntry[];
  liabilities: LiabilityEntry[];
  incomeIls: string;
  expensesIls: string;
  fxRate: number;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SummaryBar({
  stocks,
  options,
  savings,
  pension,
  liabilities,
  incomeIls,
  expensesIls,
  fxRate,
}: SummaryBarProps) {
  const stocksVal = stocks.reduce((sum, r) => {
    const v = Number(r.quantity) * Number(r.priceUsd) * fxRate;
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
  const optionsVal = options.reduce((sum, r) => {
    const v = Number(r.quantity) * (Number(r.currentPriceUsd) - Number(r.strikePriceUsd)) * fxRate;
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
  const savingsVal = savings.reduce((sum, r) => sum + (Number(r.balanceIls) || 0), 0);
  const pensionVal = pension.reduce((sum, r) => sum + (Number(r.balanceIls) || 0), 0);
  const liabilitiesVal = liabilities.reduce((sum, r) => sum + (Number(r.balanceIls) || 0), 0);
  const freeCash = (Number(incomeIls) || 0) - (Number(expensesIls) || 0);
  const netWorth = stocksVal + optionsVal + savingsVal + pensionVal - liabilitiesVal;

  return (
    <section className="bg-gray-50 rounded-lg p-4 space-y-2">
      <h2 className="text-lg font-semibold">Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div><span className="text-gray-500">Net Worth:</span> <span className="font-mono font-semibold">{fmt(netWorth)} ILS</span></div>
        <div><span className="text-gray-500">Liquid (Stocks):</span> <span className="font-mono">{fmt(stocksVal)} ILS</span></div>
        <div><span className="text-gray-500">Illiquid:</span> <span className="font-mono">{fmt(savingsVal + pensionVal)} ILS</span></div>
        <div><span className="text-gray-500">USD Exposure:</span> <span className="font-mono">{fmt(stocksVal + optionsVal)} ILS</span></div>
        <div><span className="text-gray-500">ILS Exposure:</span> <span className="font-mono">{fmt(savingsVal + pensionVal)} ILS</span></div>
        <div><span className="text-gray-500">Free Cash:</span> <span className="font-mono">{fmt(freeCash)} ILS</span></div>
      </div>
    </section>
  );
}
