"use client";

export interface StockEntry {
  ticker: string;
  quantity: string;
  priceUsd: string;
}

interface StocksSectionProps {
  rows: StockEntry[];
  fxRate: number;
  onRowsChange: (rows: StockEntry[]) => void;
}

export function StocksSection({ rows, fxRate, onRowsChange }: StocksSectionProps) {
  const addRow = () => {
    onRowsChange([...rows, { ticker: "", quantity: "", priceUsd: "" }]);
  };

  const updateRow = (index: number, field: keyof StockEntry, value: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  const calcValue = (row: StockEntry): string => {
    const qty = Number(row.quantity);
    const price = Number(row.priceUsd);
    if (!qty || !price || !fxRate) return "—";
    return (qty * price * fxRate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Stocks</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Ticker</th>
            <th className="py-2">Quantity</th>
            <th className="py-2">Price (USD)</th>
            <th className="py-2 text-right">Value (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="AAPL"
                  value={row.ticker}
                  onChange={(e) => updateRow(i, "ticker", e.target.value.toUpperCase())}
                  className="border rounded px-2 py-1 w-24"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="100"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, "quantity", e.target.value)}
                  className="border rounded px-2 py-1 w-24 text-right"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="175.50"
                  value={row.priceUsd}
                  onChange={(e) => updateRow(i, "priceUsd", e.target.value)}
                  className="border rounded px-2 py-1 w-28 text-right"
                />
              </td>
              <td className="py-1 text-right font-mono">{calcValue(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-blue-600 hover:underline"
      >
        + Add stock
      </button>
    </section>
  );
}
