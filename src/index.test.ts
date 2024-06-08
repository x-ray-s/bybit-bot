import { describe, it, expect } from "bun:test";
import { buyStrategyExec } from "./index";
import { getTokenHistory } from "./db";
import { Step } from "./strategy";

describe("Test buy strategy flow", () => {
  const symbol = "NOT";
  let balance = 1000; // USDT
  const high = 1;
  it("should buy 25% NOT when current price is less than 70% of the highest price", async () => {
    const last = 1 * 0.6;
    await buyStrategyExec(symbol, last, balance, high, Step.None);
    const tokenHistory = await getTokenHistory(symbol);
    expect(tokenHistory.step).toBe(Step.A);
    const history = tokenHistory.history[0];
    const position = balance * 0.25;
    expect(history.qty).toBe(Math.floor(position / last));
  });

  it("should buy 25% NOT when current price bounces 10% up from bottom", async () => {
    const last = 1 * 0.7 * 1.2;
    await buyStrategyExec(symbol, last, balance, high, Step.A);
    const tokenHistory = await getTokenHistory(symbol);
    expect(tokenHistory.step).toBe(Step.B);
    const history = tokenHistory.history[1];
    const position = balance * 0.25;
    expect(history.qty).toBe(Math.floor(position / last));
  });

  it("should buy 50% NOT when current price is less than 65% of the highest price", async () => {
    const last = 1 * 0.7 * 0.6;
    await buyStrategyExec(symbol, last, balance, high, Step.B);
    const tokenHistory = await getTokenHistory(symbol);
    expect(tokenHistory.step).toBe(Step.C);
    const history = tokenHistory.history[2];
    const position = balance * 0.5;
    expect(history.qty).toBe(Math.floor(position / last));
  });
});
