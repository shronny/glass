"use client";

export interface SavingsEntry {
  accountLabel: string;
  balanceIls: string;
}

interface SavingsSectionProps {
  rows: SavingsEntry[];
  onRowsChange: (rows: SavingsEntry[]) => void;
}

export function SavingsSection({ rows, onRowsChange }: SavingsSectionProps) {
  const addRow = () => {
    onRowsChange([...rows, { accountLabel: "", balanceIls: "" }]);
  };

  const updateRow = (index: number, field: keyof SavingsEntry, value: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Keren Hishtalmut</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Account</th>
            <th className="py-2 text-right">Balance (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="Migdal"
                  value={row.accountLabel}
                  onChange={(e) => updateRow(i, "accountLabel", e.target.value)}
                  className="border rounded px-2 py-1 w-40"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="150000"
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
        + Add account
      </button>
    </section>
  );
}
