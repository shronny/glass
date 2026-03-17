interface FxRateSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function FxRateSection({ value, onChange }: FxRateSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">FX Rate</h2>
      <div className="flex items-center gap-3">
        <label htmlFor="fx-rate" className="text-sm text-gray-600">
          USD → ILS
        </label>
        <input
          id="fx-rate"
          type="number"
          step="0.0001"
          min="0"
          placeholder="3.72"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border rounded px-3 py-2 w-32 text-right"
        />
      </div>
    </section>
  );
}
