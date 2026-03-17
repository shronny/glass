export interface LiabilityEntry {
  label: string;
  balanceIls: string;
}

interface LiabilitiesSectionProps {
  rows: LiabilityEntry[];
  onRowsChange: (rows: LiabilityEntry[]) => void;
}

export function LiabilitiesSection({ rows, onRowsChange }: LiabilitiesSectionProps) {
  const addRow = () => {
    onRowsChange([...rows, { label: "", balanceIls: "" }]);
  };

  const updateRow = (index: number, field: keyof LiabilityEntry, value: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Liabilities</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Label</th>
            <th className="py-2 text-right">Balance (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="Car loan"
                  value={row.label}
                  onChange={(e) => updateRow(i, "label", e.target.value)}
                  className="border rounded px-2 py-1 w-40"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="45000"
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
        + Add liability
      </button>
    </section>
  );
}
