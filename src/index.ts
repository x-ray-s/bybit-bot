import ccxt, { type Market, type OHLCV, type Ticker } from "ccxt";
import { buyStrategy, Step, sellStrategy } from "./strategy";
import { updateTokenStep, getTokenHistory } from "./db";
import { mapLimit } from "async";

const log = (...args: any[]) => {
  if (process.env.SLIENT) {
    return;
  }
  console.info(...args);
};

const exchange = new ccxt.bybit({
  apiKey: process.env.KEY,
  secret: process.env.SECRET,
});
if (process.env.DEMO) {
  exchange.enableDemoTrading(true); // demo trading
}

if (process.env.PROXY) {
  exchange.httpProxy = process.env.PROXY;
}

const baseToken = "USDT";

const tokens = (process.env.TOKENS || "").split(" ");

const watchList = tokens.map((i) => {
  return i.toUpperCase();
});

const getHistoryHigh = (ohlcv: OHLCV[]) => {
  const highList = ohlcv.map((i) => i[2] as number);
  return Math.max(...highList);
};

const buyOrder = async (symbol: string, amount: number, price: number) => {
  await exchange.createOrder(symbol, "market", "buy", amount, price);
};

const sellOrder = async (symbol: string, amount: number, price: number) => {
  await exchange.createOrder(symbol, "limit", "sell", amount, price);
};

type Precision = {
  amount: number;
  price: number;
};

const buyStrategyExec = async (
  symbol: string,
  last: number,
  balance: number,
  high: number,
  step: Step,
  precision: Precision = {
    amount: 1,
    price: 1,
  }
) => {
  const strategy = buyStrategy(last, high, step);
  const { amount } = precision;
  switch (strategy) {
    case Step.A:
      {
        const qty = formatPrecision(
          Math.floor((balance * 0.25) / last),
          amount
        );
        log(
          `A STEP buy 25% position ${symbol} ${last} x ${qty}, cost: ${Math.ceil(
            last * qty
          )}`
        );
        await buyOrder(symbol, qty, last);
        await updateTokenStep(symbol, Step.A, {
          price: last,
          qty,
          step: Step.A,
        });
      }
      break;
    case Step.B:
      {
        const qty = formatPrecision(
          Math.floor((balance * 0.25) / last),
          amount
        );
        log(
          `B STEP buy 25% position ${symbol} ${last} x ${qty}, cost: ${Math.ceil(
            last * qty
          )}`
        );
        await buyOrder(symbol, qty, last);
        await updateTokenStep(symbol, Step.B, {
          price: last,
          qty,
          step: Step.B,
        });
      }

      break;
    case Step.C:
      {
        const qty = formatPrecision(Math.floor((balance * 0.5) / last), amount);
        log(
          `C STEP buy 50% position ${symbol} ${last} x ${qty}, cost: ${Math.ceil(
            last * qty
          )}`
        );
        await buyOrder(symbol, qty, last);
        await updateTokenStep(symbol, Step.C, {
          price: last,
          qty,
          step: Step.C,
        });
      }

      break;
  }
};

export { buyStrategyExec };

const singleTokenExec = async (
  symbol: string,
  maxPosition: number,
  currentPosition: number,
  precision: Precision = {
    amount: 1,
    price: 1,
  }
) => {
  const ticker = await exchange.fetchTicker(symbol);
  const ohlcv = await exchange.fetchOHLCV(symbol, "1d");
  const high = getHistoryHigh(ohlcv);

  if (maxPosition <= 0) {
    console.error("No balance");
    return;
  }

  const last = ticker.last as number;

  if (!last) {
    console.error("No last price");
    return;
  }

  const { step } = await getTokenHistory(symbol);
  const { amount, price } = precision;

  if (step === Step.C) {
    const takeProfitPrice = (maxPosition * 1.4) / currentPosition;

    const qty = formatPrecision(currentPosition, amount);

    log(`D STEP sell 100% position ${symbol} ${takeProfitPrice} x ${qty} `);
    await sellOrder(symbol, qty, takeProfitPrice);
    await updateTokenStep(symbol, Step.D, {
      price: last,
      qty,
      step: Step.D,
    });
    return;
  }

  await buyStrategyExec(symbol, last, maxPosition, high, step, precision);
};

function getDecimalPlaces(n: number) {
  const str = n.toString();

  if (str.indexOf(".") === -1) {
    return 0;
  } else {
    return str.split(".")[1].length;
  }
}

function formatPrecision(n: number, config: number) {
  const multiplier = Math.pow(10, getDecimalPlaces(config));
  return Math.floor(n * multiplier) / multiplier;
}

const main = async () => {
  const balances = await exchange.fetchBalance();

  const baseBalance = balances[baseToken];
  const maxPosition = 1000;
  if (baseBalance.free && baseBalance.free < maxPosition) {
    console.error("No balance");
    return;
  }
  // https://bybit-exchange.github.io/docs/v5/market/instrument
  const markets = await exchange.fetchSpotMarkets({
    baseToken,
  });

  const watchMarkets = markets.filter((market) => {
    return watchList.includes(market.base);
  });

  mapLimit(watchMarkets, 3, async (market: Market) => {
    if (market) {
      const symbol = market.symbol;
      const base = market.base;
      await singleTokenExec(
        symbol,
        maxPosition,
        balances[base]?.free || 0,
        market.precision as Precision
      );
    }
  });
};

main();
setInterval(() => main(), 1000 * 60);
