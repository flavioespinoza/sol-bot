# Turn 7 — Next.js API Route

Now wire up the Next.js API. Run `npm install --prefix engine-backtest-platform` and make sure the build passes. Do not cd into any directory.

Create or update an `/api/backtest` route that calls the Python engine (whichever engine path you built — custom Python or LEAN). It should accept `ema` and `percent` as query params, shell out to the Python script (or LEAN CLI), and return the results as JSON.

Test it — start the dev server and show me the response from `/api/backtest?ema=40&percent=0.04`.
