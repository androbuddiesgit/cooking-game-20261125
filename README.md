# cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/androbuddiesgit/cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/androbuddiesgit/cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Dapur Kilat** is a fast-paced warung cooking game: orders land on the ticket board, you gather ingredients from the counter, chop what needs chopping, cook it on the wok or in the pot (stop the bar in the green zone), and serve before the customer's patience runs out. Four original recipes, combo scoring, a 2.5-minute shift, and synthesized sound effects — all drawn and coded from scratch, no assets, no network.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Or serve `game/` with any static server and open `game/index.html`.

## How to play

- Click an ingredient (or press 1–8) to add it to the active order.
- Ingredients marked 🔪 go to the chopping board — click the board or press Space 3 times.
- When every ingredient is ready, click the wok/pot (or press F) to cook; click again (F) to stop inside the green zone for a perfect dish. Overcook and it burns.
- Click **HIDANGKAN** (or press Enter) to serve. Serve fast for a time bonus; consecutive serves build a combo.
- ← → switches the active ticket. P pauses, M mutes, R restarts after a shift.

## Layout

- `main.ts` — the hand-in program (Node 22): copies `game/` + `screenshots/` to `/output` and writes `dossier.json`.
- `game/index.html` + `game/src/` — the game itself, plain static files: `config.js` (recipes & tuning), `state.js` (rules), `render.js` (all canvas drawing), `input.js` (mouse + keyboard), `audio.js` (synthesized sfx), `rng.js` (seeded random), `shots.js` (deterministic screenshot setups), `main.js` (loop).
- `screenshots/` — 4 real renders of the game in a browser (kitchen, mid-assembly, ready to serve, late-shift rush).
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
