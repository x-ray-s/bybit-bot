import ccxt, { type OHLCV, type Ticker } from "ccxt";
enum Step {
  None,
  A,
  B,
  C,
  D,
}

const hasHitBottom = (ohlcv: OHLCV[], target: number) => {
  const lowList = ohlcv.map((i) => i[3] as number);
  return lowList.some((i) => i <= target);
};

/**
 *
 * a) 25% position size after 70% pullback
 * b) 25% after price bounces 10% up from bottom
 * c) 50% on double bottom corresponding to going back to 65% pullback
 * d) sell after 40% bounce
 */

const buyStrategy = (last: number, high: number, step: Step = Step.None) => {
  const bottomPrice = high * 0.7;
  if (step === Step.None && last <= bottomPrice) {
    // buy 25%
    return Step.A;
  }
  if (step === Step.A && last >= bottomPrice * 1.1) {
    // buy 25%
    return Step.B;
  }

  if (step === Step.B && last <= bottomPrice * 0.65) {
    // buy 50%
    return Step.C;
  }
};

const sellStrategy = (
  cost: number,
  last: number,
  qty: number,
  step: Step = Step.None
) => {
  if (Step.C === step && (last * qty) / cost >= 1.4) {
    return Step.D;
  }
};

export { buyStrategy, sellStrategy, Step };
