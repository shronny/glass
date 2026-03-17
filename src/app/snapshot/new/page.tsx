"use client";

import { useState } from "react";
import { FxRateSection } from "@/components/snapshot-form/FxRateSection";
import { StocksSection, StockEntry } from "@/components/snapshot-form/StocksSection";
import { OptionsSection, OptionEntry } from "@/components/snapshot-form/OptionsSection";
import { SavingsSection, SavingsEntry } from "@/components/snapshot-form/SavingsSection";
import { PensionSection, PensionEntry } from "@/components/snapshot-form/PensionSection";
import { LiabilitiesSection, LiabilityEntry } from "@/components/snapshot-form/LiabilitiesSection";
import { CashflowSection } from "@/components/snapshot-form/CashflowSection";
import { SummaryBar } from "@/components/snapshot-form/SummaryBar";

export default function NewSnapshotPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [notes, setNotes] = useState("");
  const [fxRate, setFxRate] = useState("");
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [options, setOptions] = useState<OptionEntry[]>([]);
  const [savings, setSavings] = useState<SavingsEntry[]>([]);
  const [pension, setPension] = useState<PensionEntry[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityEntry[]>([]);
  const [incomeIls, setIncomeIls] = useState("");
  const [expensesIls, setExpensesIls] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ section: string; ok: boolean }[]>([]);

  const fxRateNum = Number(fxRate);

  const handleSave = async () => {
    setSaving(true);
    setStatus([]);
    const results: { section: string; ok: boolean }[] = [];

    try {
      // 1. Create snapshot
      const snapRes = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, notes: notes || undefined }),
      });
      const snap = await snapRes.json();
      if (!snapRes.ok) throw new Error(snap.error || "Failed to create snapshot");
      results.push({ section: "Snapshot", ok: true });
      const snapshotId = snap.id;

      // 2. FX Rate
      if (fxRate) {
        const res = await fetch(`/api/snapshots/${snapshotId}/fx`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usd_to_ils: Number(fxRate) }),
        });
        results.push({ section: "FX Rate", ok: res.ok });
      }

      // 3. Stocks
      const validStocks = stocks.filter((r) => r.ticker && r.quantity && r.priceUsd);
      if (validStocks.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/stocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validStocks.map((r) => ({
              ticker: r.ticker,
              quantity: Number(r.quantity),
              price_usd: Number(r.priceUsd),
            })),
          }),
        });
        results.push({ section: "Stocks", ok: res.ok });
      }

      // 4. Options
      const validOptions = options.filter((r) => r.label && r.quantity);
      if (validOptions.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/options`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validOptions.map((r) => ({
              label: r.label,
              quantity: Number(r.quantity),
              strike_price_usd: Number(r.strikePriceUsd),
              current_price_usd: Number(r.currentPriceUsd),
              is_vested: r.isVested,
            })),
          }),
        });
        results.push({ section: "Options", ok: res.ok });
      }

      // 5. Savings
      const validSavings = savings.filter((r) => r.accountLabel && r.balanceIls);
      if (validSavings.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/savings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validSavings.map((r) => ({
              account_label: r.accountLabel,
              balance_ils: Number(r.balanceIls),
            })),
          }),
        });
        results.push({ section: "Savings", ok: res.ok });
      }

      // 6. Pension
      const validPension = pension.filter((r) => r.provider && r.balanceIls);
      if (validPension.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/pension`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validPension.map((r) => ({
              provider: r.provider,
              balance_ils: Number(r.balanceIls),
            })),
          }),
        });
        results.push({ section: "Pension", ok: res.ok });
      }

      // 7. Liabilities
      const validLiabilities = liabilities.filter((r) => r.label && r.balanceIls);
      if (validLiabilities.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/liabilities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validLiabilities.map((r) => ({
              label: r.label,
              balance_ils: Number(r.balanceIls),
            })),
          }),
        });
        results.push({ section: "Liabilities", ok: res.ok });
      }

      // 8. Cashflow
      if (incomeIls && expensesIls) {
        const res = await fetch(`/api/snapshots/${snapshotId}/cashflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            income_ils: Number(incomeIls),
            expenses_ils: Number(expensesIls),
          }),
        });
        results.push({ section: "Cashflow", ok: res.ok });
      }
    } catch (err) {
      results.push({ section: err instanceof Error ? err.message : "Unknown error", ok: false });
    }

    setStatus(results);
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold">New Monthly Snapshot</h1>

      {/* Month/Year Picker */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Period</h2>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border rounded px-3 py-2 w-24"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. bonus month, stock split"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
        </div>
      </section>

      <hr />
      <FxRateSection value={fxRate} onChange={setFxRate} />
      <hr />
      <StocksSection rows={stocks} fxRate={fxRateNum} onRowsChange={setStocks} />
      <hr />
      <OptionsSection rows={options} fxRate={fxRateNum} onRowsChange={setOptions} />
      <hr />
      <SavingsSection rows={savings} onRowsChange={setSavings} />
      <hr />
      <PensionSection rows={pension} onRowsChange={setPension} />
      <hr />
      <LiabilitiesSection rows={liabilities} onRowsChange={setLiabilities} />
      <hr />
      <CashflowSection
        incomeIls={incomeIls}
        expensesIls={expensesIls}
        onIncomeChange={setIncomeIls}
        onExpensesChange={setExpensesIls}
      />
      <hr />

      {/* Summary Bar */}
      <SummaryBar
        stocks={stocks}
        options={options}
        savings={savings}
        pension={pension}
        liabilities={liabilities}
        incomeIls={incomeIls}
        expensesIls={expensesIls}
        fxRate={fxRateNum}
      />
      <hr />

      {/* Save */}
      <div className="space-y-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Snapshot"}
        </button>

        {status.length > 0 && (
          <div className="space-y-1">
            {status.map((s, i) => (
              <div key={i} className={`text-sm ${s.ok ? "text-green-600" : "text-red-600"}`}>
                {s.ok ? "✓" : "✗"} {s.section}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
