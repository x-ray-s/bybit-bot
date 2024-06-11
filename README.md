# bybit-bot

1. Install [bun](https://bun.sh/) in your computer or server.
2. Git clone this repo.
3. Install dependencies.
4. Change .env file to your configure.
5. Run to start.

To install dependencies:

```bash
bun install
```

## CONFIGURE

```bash
# .env file
DEMO=1 # if you confirm to use online, remove this line
PROXY="" # if you need proxy
TOKENS="not tok" # Customize your watchlist, use spaces to separate
```

To run:

```bash
bun run start
```

## NOTICE

DON'T SHARE YOUR APIKEY AND SECRET TO ANYONE.

DON'T PUSH .env FILE TO PUBLIC RESPOSITORY.

DON'T SET ASSETS PERMISSIONS.

Please test the app on bybit demo trading. Don't use directly in production.

## STRATEGY

1. Buy 25% of the position when the price drops to 70% of the highest price.
2. Buy 25% of the position when the price bounces 10% up from bottom.
3. Buy 25% of the position When the price falls back to 65% of the highest price for the second time.
4. Sell all of the position When the profit reaches 40%.

#### Example Information

| KEY     | VALUE    |
| ------- | -------- |
| Name    | TESTOKEN |
| high    | 1.2      |
| balance | 1000     |

| step         | trigger price | qty | balance |
| ------------ | ------------- | --- | ------- |
| 0            | 1             | 0   | 1000    |
| 1            | <= 0.84       | 297 | 750     |
| 2            | >= 0.924      | 270 | 500     |
| 3            | <= 0.78       | 641 | 0       |
| Total = 1208 |
| 4            | >= 1.15       | 0   | 1400    |
