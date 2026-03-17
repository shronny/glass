interface CashflowSectionProps {
  incomeIls: string;
  expensesIls: string;
  onIncomeChange: (value: string) => void;
  onExpensesChange: (value: string) => void;
}

export function CashflowSection({
  incomeIls,
  expensesIls,
  onIncomeChange,
  onExpensesChange,
}: CashflowSectionProps) {
  const freeCash = Number(incomeIls) - Number(expensesIls);
  const freeCashDisplay =
    incomeIls && expensesIls
      ? freeCash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Monthly Cashflow</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Income (ILS)</label>
          <input
            type="number"
            min="0"
            placeholder="35000"
            value={incomeIls}
            onChange={(e) => onIncomeChange(e.target.value)}
            className="border rounded px-3 py-2 w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Expenses (ILS)</label>
          <input
            type="number"
            min="0"
            placeholder="25000"
            value={expensesIls}
            onChange={(e) => onExpensesChange(e.target.value)}
            className="border rounded px-3 py-2 w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Free Cash (ILS)</label>
          <div className="border rounded px-3 py-2 text-right bg-gray-50 font-mono">
            {freeCashDisplay}
          </div>
        </div>
      </div>
    </section>
  );
}
