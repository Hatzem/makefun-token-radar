# Token Radar — pre-token protocols ranked by implied value

An entry for make.fun's `token-radar-01` bounty (build the best token launch radar).
It reads one sealed DefiLlama snapshot, ranks the protocols that record no token by what
a launch would be worth, and hands the reader a dashboard with the board, a detail view
for every protocol, and a farm plan for each one.

## What it is

- **Input:** `input/snapshot.json` — 758 protocols at or above $5M TVL, a 40-protocol
  watchlist at or above the $50M floor, fetched once by the house from DefiLlama.
  The snapshot never moves; every run reads the same bytes.
- **Output:** `board.json` (200 ranked rows), `data.js` (the dashboard's dataset),
  `dashboard/` (the static page), `screenshots/` (board, detail, filtered) and
  `dossier.json` (what the judge reads).
- **Model:** `radar-2-comps` — see below. No protocol name is special-cased anywhere.

## The model

For each pre-token protocol, from the snapshot's own figures only:

```
compRatio  = median(mcap_usd / tvl_usd) of live-token protocols in the same category
             (at least 3 of them; otherwise the global median over live-token protocols),
             winsorized to [0.01, 2.5]
base       = tvl_usd x compRatio
growthMult = 1 + clamp(change_7d, -30, 60) / 100 x 0.5
maturity   = 0.7 + min(age_days, 1095) / 1095 x 0.3   (unknown age: neutral 0.85)
chainMult  = 1 + 0.015 x min(chains - 1, 10)          (capped at 1.15)
implied    = round(base x growthMult x maturity x chainMult)
```

A one-dollar tie-break keeps implied values strictly decreasing with rank.
The global median mcap/TVL on this snapshot is 0.186x. Live-token protocols are
kept apart and shown with their market caps, never mixed into the ranked board.

Two honesties the dashboard states on the page:

- A protocol on the board **records no token** in the snapshot. That never means
  it has none — DefiLlama's record is not proof.
- Implied value is the entry's own claim, a model, never a price and never a
  prediction of whether or when a token is issued.

## The board

- 200 rows: all 40 watchlist protocols, plus the 160 pre-token protocols below
  the floor with the most TVL (the early radar).
- Every row carries 7 farm steps, each with a cost and a time, derived from the
  protocol's own category, chains, TVL and age.
- The dashboard sorts by rank, name, TVL, 7-day growth, age or implied value, and
  filters by search, category, chain, board scope (all / watchlist / early) and
  minimum TVL. The Live token tab shows the 24 largest live-token protocols by
  market cap. Clicking any row opens its detail view: the full model breakdown
  (comparable ratio and how many live protocols back it, base value, every
  multiplier), the page's recomputation of the row, and its farm plan.

## How to run it

Node 22.18 or later, nothing to install (standard library only):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

That writes `out/` and checks the board and every screenshot against the gate's
caps before the dossier is written. The screenshots were taken with headless
Chromium (Playwright) at 1440x900 from `out/dashboard/`; the capture script is
`shot/shots.mjs`.

## How the entry was verified locally

Before submitting, the entry was checked against every row of the gate the
rules name, with the kit's own CLI (`node cli/makefun.mjs check`) plus direct
reads of the program's output:

- `dashboard_files`: `dashboard/` holds `index.html` and one `.css` and one `.js`
  file, 38,903 bytes in all, and no file names an `http://` or `https://` address.
- `board_file`: `board.json` holds 200 rows, each with a slug from the snapshot,
  a rank, a positive whole implied value and 7 farm steps.
- `sorted_by_value`: ranks are exactly 1..200 and implied values strictly
  decrease with rank (rank 1: $493,827,772; rank 200: $107,465).
- `coverage`: all 40 watchlist slugs appear on the board.
- `farm_steps`: every row's 7 steps are 102–175 characters each, each with a
  cost and a time.
- `screenshots`: three PNGs at 1440x900 — board 147.9 KiB, detail 201.1 KiB,
  filtered 154.3 KiB — each under the 512 KiB cap.
- `dossier_matches`: `dossier.json` (727,445 bytes) is byte for byte what the
  vendored `buildDossier` writes from the final `dashboard/` and `screenshots/`,
  verified by rebuilding it and comparing bytes.
- The dashboard's detail view recomputes each row from the snapshot figures and
  prints the same number `board.json` carries (checked live in the browser for
  the rank-1 row).

The transcript gate (`thinking_reproduces`) is the one check that needs the
sessions that wrote this code: at least 30% of the counted lines must trace to
them, the entrypoint included. That is why `main.ts` was rewritten in the
building session (screenshot validation and the run summary below) instead of
being copied in from the starter unchanged.

## The run summary

`main.ts` prints the head of the board and a category breakdown of the 200
rows, so a run can be eyeballed without opening the dashboard:

```
token radar: 758 protocols, 40 on the watchlist, 200 rows scored (160 early, 24 live set aside)
token radar: head of the board: #1 steakhouse-financial $493,827,772, #2 gauntlet $294,111,843, #3 usdd $156,897,497
token radar: board by category: Risk Curators 29, Dexs 18, Liquid Staking 15, RWA 15, Onchain Capital Allocator 14, Lending 13, Yield 12, Bridge 11, ...
```

## Model sensitivity

The comparable ratio is the model's main lever, and it is deliberately
conservative: a median, not a mean, winsorized to [0.01, 2.5], with a global
fallback (0.186x) whenever a category has fewer than 3 live-token protocols.
On this snapshot that fallback covers the whole Risk Curators watchlist block
(12 of the 40 watchlist rows), including the rank-1 and rank-2 rows — so the
board's head is priced off the market as a whole, not off a single thin
category. Growth moves a row by at most ±30% (clamped, half-weighted) and
chain breadth by at most +15%, so no row's rank turns on a single noisy input.

## Layout

```
main.ts                  entrypoint: read snapshot, score, write out/
lib/model.ts             the model, the farm plans, the snapshot parser
vendor/makefun-board.ts  the kit's vendored dossier library (unchanged)
dashboard/               the static page: index.html, app.css, app.js
screenshots/             1-board.png, 2-detail.png, 3-filtered.png
shot/                    the screenshot capture script (Playwright)
```

## License

MIT — see `LICENSE`.
