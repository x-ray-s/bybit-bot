import { JSONFilePreset } from "lowdb/node";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type History = {
  price: number;
  qty: number;
  step: number;
};

type TokenHistory = {
  step: number;
  history: History[];
};

type Data = Record<string, TokenHistory>;

const defaultData: Data = {};
const file = path.resolve(__dirname, "./db.json");

const db = await JSONFilePreset<Data>(file, defaultData);

const getTokenHistory = async (symbol: string) => {
  await db.read();
  return db.data[symbol] || {};
};

const updateTokenStep = async (symbol: string, step: number, data: History) => {
  await db.read();
  if (!db.data[symbol]) {
    db.data[symbol] = {
      step,
      history: [data],
    };
  } else {
    db.data[symbol].step = step;
    db.data[symbol].history.push(data);
  }
  await db.write();
};

export { getTokenHistory, updateTokenStep };
