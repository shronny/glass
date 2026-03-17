"use client";

export interface PensionEntry {
  provider: string;
  balanceIls: string;
}

interface PensionSectionProps {
  rows: PensionEntry[];
  onRowsChange: (rows: PensionEntry[]) => void;
}

export function PensionSection({ rows, onRowsChange }: PensionSectionProps) {
  const addRow = () => {
    onRowsChange([...rows, { provider: "", balanceIls: "" }]);
  };

  const updateRow = (index: number, field: keyof PensionEntry, value: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Kupat Hisachon (Pension)</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Provider</th>
            <th className="py-2 text-right">Balance (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="Meitav"
                  value={row.provider}
                  onChange={(e) => updateRow(i, "provider", e.target.value)}
                  className="border rounded px-2 py-1 w-40"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="200000"
                  value={row.balanceIls}
                  onChange={(e) => updateRow(i, "balanceIls", e.target.value)}
                  className="border rounded px-2 py-1 w-36 text-right"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:underline">
        + Add provider
      </button>
    </section>
  );
}
