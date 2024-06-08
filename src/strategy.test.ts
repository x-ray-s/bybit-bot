import { describe, it, expect } from "bun:test";
import { type OHLCV, type Ticker } from "ccxt";
import { buyStrategy, Step, sellStrategy } from "./strategy";

const ticker = {
  symbol: "NOT/USDT",
  timestamp: undefined,
  datetime: undefined,
  high: 0.02258,
  low: 0.020617,
  bid: 0.0223279,
  bidVolume: 20295.93,
  ask: 0.0223381,
  askVolume: 17579.6,
  vwap: 0.02159399021696893,
  open: 0.0213134,
  close: 0.0223279,
  last: 0.0223279,
  previousClose: undefined,
  change: 0.0010145,
  percentage: 4.76,
  average: 0.02182065,
  baseVolume: 3288989384.82,
  quoteVolume: 71022404.59951773,
  info: {
    symbol: "NOTUSDT",
    bid1Price: "0.0223279",
    bid1Size: "20295.93",
    ask1Price: "0.0223381",
    ask1Size: "17579.6",
    lastPrice: "0.0223279",
    prevPrice24h: "0.0213134",
    price24hPcnt: "0.0476",
    highPrice24h: "0.02258",
    lowPrice24h: "0.020617",
    turnover24h: "71022404.599517736",
    volume24h: "3288989384.82",
  },
};

const mockOHLCV = (): OHLCV[] => {
  return Array.from({
    length: 10,
  }).map((_, i) => {
    return [
      1633036800000 + i * 60000,
      0.0223279,
      0.0223279,
      0.0223279,
      0.0223279,
      0.0223279,
    ];
  });
};

const mockTicker = (params: Partial<Ticker>) => {
  return Object.assign(ticker, params);
};

describe("Test buy strategy", () => {
  it("should return Step.A, when current price is less than 70% of the highest price", () => {
    const high = 1;
    expect(buyStrategy(high * 0.7, high)).toBe(Step.A);
  });

  it("should not return Step.A, when current price is more than 70% of the highest price", () => {
    const high = 1;
    expect(buyStrategy(high * 0.8, high)).not.toBe(Step.A);
  });

  it("should return Step.B, when current price bounces 10% up from bottom", () => {
    const high = 1;
    // target price = high * 0.7 * 1.1
    expect(buyStrategy(high * 0.7 * 1.1, high, Step.A)).toBe(Step.B);
  });

  it("should not return Step.B, when current price bounces less than 10% up from bottom", () => {
    const high = 1;
    // target price = high * 0.7 * 1.1
    expect(buyStrategy(high * 0.7 * 1, high, Step.A)).not.toBe(Step.B);
  });
});

describe("Test sell strategy", () => {
  it("should return Step.D, when bounce 40%", () => {
    expect(sellStrategy(1 * 1000, 1.4, 1000, Step.C)).toBe(Step.D);
  });

  it("should not return Step.D, when bounce less than 40%", () => {
    expect(sellStrategy(1 * 1000, 1.3, 1000, Step.C)).not.toBe(Step.D);
  });
});
