# Fayra Herbs — Orders Backend

A small API that saves customers and orders to a local database (SQLite).
It does **not** process payments — you handle that separately (e.g. send a
payment link by email after the order comes in).

## What it does

- `POST /api/orders` — saves the customer (or updates them if the email
  already exists) and saves the order + line items.
- `GET /api/orders` — lists every order, newest first, so you can see what's
  come in. Open this in a browser to check.
- `GET /api/health` — quick check that the server is running.

Data is stored in a file called `fayra.db` that appears in this folder the
first time you run the server. That file *is* your database — back it up
like any other important file.

## Setup (one-time)

1. Install [Node.js](https://nodejs.org) (the LTS version) if you don't have it.
2. Open a terminal in this `backend` folder.
3. Run:
   ```
   npm install
   ```
   This downloads the three packages the server needs.

## Running it

```
npm start
```

You should see:
```
Fayra Herbs backend running at http://localhost:4000
```

Leave that terminal window open while you use the site — closing it stops
the server. The website's "Buy Now" / cart checkout is already set up to
send orders to `http://localhost:4000`.

## Viewing orders

With the server running, open `http://localhost:4000/api/orders` in a
browser tab. It's plain JSON, but it's enough to see every order, who
placed it, and what they ordered.

If you'd like a nicer admin page instead of raw JSON, or you want this
deployed online (e.g. on Render or Railway) so it works for real customers
instead of just your own laptop, let me know and I can set that up too.

## Changing the port

If port 4000 is already used by something else on your machine, set a
different one:

```
PORT=4500 npm start
```

...and update `API_BASE` near the top of the site's `script.js` to match.
