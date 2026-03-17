import { describe, it, expect } from "vitest";
import { computeMetrics } from "../computedMetrics";

describe("computeMetrics", () => {
  it("returns zeros for empty data", () => {
    const result = computeMetrics({
      stocks: [],
      options: [],
      savings: [],
      pension: [],
      liabilities: [],
      cashflow: [],
    });
    expect(result.netWorthIls).toBe(0);
    expect(result.liquidAssetsIls).toBe(0);
    expect(result.illiquidAssetsIls).toBe(0);
    expect(result.usdExposureIls).toBe(0);
    expect(result.ilsExposureIls).toBe(0);
    expect(result.monthlyFreeCash).toBe(0);
  });

  it("computes net worth from all asset types minus liabilities", () => {
    const result = computeMetrics({
      stocks: [{ valueIls: "100000" }],
      options: [{ valueIls: "50000" }],
      savings: [{ balanceIls: "200000" }],
      pension: [{ balanceIls: "300000" }],
      liabilities: [{ balanceIls: "80000" }],
      cashflow: [{ freeCashIls: "10000" }],
    });
    expect(result.netWorthIls).toBe(570000);
    expect(result.liquidAssetsIls).toBe(100000);
    expect(result.illiquidAssetsIls).toBe(500000);
    expect(result.usdExposureIls).toBe(150000);
    expect(result.ilsExposureIls).toBe(500000);
    expect(result.monthlyFreeCash).toBe(10000);
  });

  it("handles multiple rows per category", () => {
    const result = computeMetrics({
      stocks: [{ valueIls: "50000" }, { valueIls: "30000" }],
      options: [],
      savings: [{ balanceIls: "100000" }, { balanceIls: "150000" }],
      pension: [],
      liabilities: [{ balanceIls: "20000" }, { balanceIls: "10000" }],
      cashflow: [],
    });
    expect(result.netWorthIls).toBe(300000);
    expect(result.liquidAssetsIls).toBe(80000);
  });

  it("handles negative option values (underwater)", () => {
    const result = computeMetrics({
      stocks: [],
      options: [{ valueIls: "-5000" }],
      savings: [],
      pension: [],
      liabilities: [],
      cashflow: [],
    });
    expect(result.netWorthIls).toBe(-5000);
    expect(result.usdExposureIls).toBe(-5000);
  });
});
