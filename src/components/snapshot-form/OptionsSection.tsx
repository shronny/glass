"use client";

export interface OptionEntry {
  label: string;
  quantity: string;
  strikePriceUsd: string;
  currentPriceUsd: string;
  isVested: boolean;
}

interface OptionsSectionProps {
  rows: OptionEntry[];
  fxRate: number;
  onRowsChange: (rows: OptionEntry[]) => void;
}

export function OptionsSection({ rows, fxRate, onRowsChange }: OptionsSectionProps) {
  const addRow = () => {
    onRowsChange([
      ...rows,
      { label: "", quantity: "", strikePriceUsd: "", currentPriceUsd: "", isVested: false },
    ]);
  };

  const updateRow = (index: number, field: keyof OptionEntry, value: string | boolean) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  const calcValue = (row: OptionEntry): string => {
    const qty = Number(row.quantity);
    const strike = Number(row.strikePriceUsd);
    const current = Number(row.currentPriceUsd);
    if (!qty || !current || !fxRate) return "—";
    const val = qty * (current - strike) * fxRate;
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Stock Options</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Label</th>
            <th className="py-2">Quantity</th>
            <th className="py-2">Strike (USD)</th>
            <th className="py-2">Current (USD)</th>
            <th className="py-2">Vested</th>
            <th className="py-2 text-right">Value (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="Grant A"
                  value={row.label}
                  onChange={(e) => updateRow(i, "label", e.target.value)}
                  className="border rounded px-2 py-1 w-32"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, "quantity", e.target.value)}
                  className="border rounded px-2 py-1 w-20 text-right"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.strikePriceUsd}
                  onChange={(e) => updateRow(i, "strikePriceUsd", e.target.value)}
                  className="border rounded px-2 py-1 w-24 text-right"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.currentPriceUsd}
                  onChange={(e) => updateRow(i, "currentPriceUsd", e.target.value)}
                  className="border rounded px-2 py-1 w-24 text-right"
                />
              </td>
              <td className="py-1 text-center">
                <input
                  type="checkbox"
                  checked={row.isVested}
                  onChange={(e) => updateRow(i, "isVested", e.target.checked)}
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
        + Add option grant
      </button>
    </section>
  );
}
