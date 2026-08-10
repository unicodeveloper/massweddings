# Nigeria Mass Weddings Map

Every government-sponsored mass wedding in Nigeria over the past decade, plotted on the map and set against the things that explain them: how poor each state is, how many people live there, and how much money it gets from the federation account.

In August 2026 Kano married 1,500 couples in a single two-day ceremony and the story travelled the world as a curiosity. It isn't one. Northern state governments have been running these programmes every year for a decade — Kano, Katsina, Kebbi, Sokoto, Zamfara, Bauchi, Gombe, Jigawa — usually through their Hisbah boards, usually paying the dowry, usually aimed at widows, divorcees and couples who cannot afford to marry. This map shows the whole pattern at once, and how sharply it stops at the middle belt.

## What it shows

**The map.** Each circle is one ceremony, sized by the number of couples and coloured by who paid for it — state government, Hisbah board, emirate council, philanthropist. Circles outlined in white were announced but never confirmed as held. States are filled by whichever variable you pick: ceremonies held, multidimensional poverty, median age at first marriage, household electricity, population, or FAAC allocation — each labelled with the year of its source. Switching the fill from *ceremonies* to *age at first marriage* is the whole argument in one click: the states running these programmes are the states where women marry at 15 to 17.

Flat by default, with a globe projection a click away. For a single country at this zoom the globe curves the frame without adding information, so the flat view is the honest default — the toggle is there when you want Nigeria in its regional context.

**Regions.** A breakdown across the six geopolitical zones — North West, North East, North Central (Middle Belt), South West, South East, South South — in three views: raw ceremony counts, couples married, and ceremonies per 10 million residents, which strips out the effect of zone size.

**States.** A league table sortable by ceremonies, couples, couples per 100,000 women aged 15–29, or poverty rate, with the poverty figure printed next to each state so the correlation is visible rather than asserted. The panel reports the Pearson r across all 37 states.

**A state's record.** Click any state for its population, density, poverty rate and FAAC allocation, every ceremony on record with source links, and a *Research with Valyu* button that pulls a live, cited briefing on that state's programme history — including a plain "this state has never run one" where that is the answer.

**The decade.** A year-by-year bar of ceremony counts floating over the map, doubling as the time filter. Every year in the ten-year window gets a bar, including the empty ones — a quiet year is information.

**Live Feed.** The last 90 days of Nigerian reporting on mass weddings, searched fresh rather than read from the cached dataset.

**Intel.** Free-form research on any state, Hisbah board, governor, programme or claim the map raises, with angle presets for programme history, spending, criticism and background. Answers come back cited.

**Prediction markets.** A Polymarket drawer along the bottom — Nigeria first, then Africa, then geopolitics. The story that started this map came off a Polymarket feed in the first place.

## Where the numbers come from

This is the part that matters. Nothing on this map is a figure that was invented to fill a gap.

| Layer | Source | Nature |
| --- | --- | --- |
| Population, age & sex | [UNFPA / NPC Common Operational Dataset (COD-PS)](https://data.humdata.org/dataset/cod-ps-nga), 2022 projection | Official dataset, read directly |
| Multidimensional poverty | [OPHI, University of Oxford](https://data.humdata.org/dataset/nigeria-mpi) — Nigeria MPI from the 2021 MICS | Official dataset, read directly |
| Marriage age, electricity, literacy | [Nigeria DHS 2023–24](https://data.humdata.org/dataset/dhs-subnational-data-for-nigeria) — NPC and ICF, via The DHS Program | Official dataset, read directly |
| State boundaries | [geoBoundaries](https://www.geoboundaries.org/) (GRID3 Nigeria state boundaries), CC BY 4.0 | Official dataset, read directly |
| FAAC allocations | NBS and outlets publishing NBS/BudgIT breakdowns, sourced through Valyu | Reported figures, each carrying its source URL |
| Mass wedding ceremonies | Nigerian and international news, searched through Valyu | Extracted from reporting, each carrying its sources |

Two deliberate choices:

- **Unsourced means blank, not guessed.** FAAC has no open machine-readable state-level dataset — NBS publishes monthly disbursements as report scans. Rather than estimate, the build script keeps only figures it can attach a URL to; the two states it could not source render as "no data". Same rule for couple counts: a ceremony reported without a number stays null rather than being filled in.
- **The south is searched as hard as the north.** A state with no ceremonies is a finding, and a finding is only worth anything if you looked. The query set gives every state a dedicated sweep, and the roundup pass runs over all 37. Read an empty state as *nothing surfaced in the sources searched*, not as proof nothing happened.

Population and poverty are regenerated straight from source with `npm run build:reference`, and the 2024 survey indicators with `npm run build:dhs`, so you can verify them yourself in one command.

**On data vintages.** The poverty index is from the 2021 MICS, and it is the most recent state-level MPI that exists — nobody has published one from the 2023–24 survey yet. Rather than pass a 2021 figure off as current, the map labels every layer with its year and adds three genuinely 2024 indicators from the NDHS alongside it. Population is the 2022 COD-PS for the same reason: there is no newer authoritative subnational dataset, only projections, and the projection is computed in the open rather than presented as a measurement.

## How the ceremony dataset is built

`lib/pipeline.ts`, in four stages:

1. **Recall** — ~60 Valyu searches over the ten-year window: thematic queries, one per northern state, grouped sweeps of the south, and one per year across the window. A second pass is pinned to Nigerian outlets, which cover the smaller editions the wires ignore.
2. **Extraction** — each article goes to a structured-output model that returns state, town, date, couples, cost, dowry, sponsor, beneficiary group, and crucially whether the ceremony *happened* or was merely announced. Numbers are taken exactly as reported or left null.
3. **Roundup** — article search misses editions that were covered once in 2017 and never re-indexed, so Valyu is also asked to enumerate each state's history directly, against a schema that requires a source URL per entry.
4. **Collapse** — twenty outlets covering one ceremony must land as one dot. Records are bucketed by state and year, then clustered by couple count, with a ceremony that happened outranking an announcement and a precise date outranking a vague one. Sources are unioned onto the surviving record.

One subtlety worth knowing about: some outlets report the combined number of brides and grooms rather than couples — "3,600 brides and grooms" for a ceremony of 1,800 couples. Left alone that shows up as a second ceremony and doubles the year's total. Where one cluster in a state-year is roughly 2× another, the two are folded together, and the surviving count is the better-corroborated one rather than automatically the smaller.

The result is cached in `data/weddings.json` and served from there, so the map loads instantly. Rebuilding is explicit — the button in the header, or `npm run seed`.

The rebuild runs in stages (one article pass, then state batches) rather than one long request. A single call covering the whole pipeline outlives the HTTP client's timeout, and staging means a failure late in the run keeps everything already written.

## Running it

Requires Node 22+, a Mapbox token, a Valyu API key, and — strongly recommended — an OpenAI key for the extraction step.

```bash
pnpm install
cp .env.example .env.local   # then fill in the keys
npm run dev
```

The map loads from the committed dataset. To rebuild it from scratch:

```bash
npm run seed          # with the dev server running; takes several minutes
```

To regenerate the reference data:

```bash
npm run build:reference    # population + poverty, straight from HDX
npm run build:dhs          # 2024 survey indicators, straight from The DHS Program
npm run build:faac 2024    # FAAC allocations via Valyu
npm run build:faac 2024 --fill-gaps   # retry only the states still unsourced
```

### Who pays for the live searches

The map, the charts and every cached figure are open to anyone. The two features that hit Valyu on demand — Live Feed and Intel — can be put behind a sign-in so they run on the reader's own credits rather than yours:

```env
NEXT_PUBLIC_APP_MODE=valyu     # plus the OAuth block in .env.example
```

Left as `self-hosted` (the default), those features use the server's own `VALYU_API_KEY` and no sign-in appears.

On a public deployment, set `ALLOW_REBUILD=false` so visitors cannot spend your API credits.

## Reading it honestly

- **Correlation is not cause.** The r between poverty rate and ceremony count is descriptive. These programmes cluster in poor states, and they also cluster in states with Hisbah boards and a particular set of politics. The map shows where they happen; it does not tell you why.
- **Coverage is uneven by design of the media, not of the map.** Kano's editions are covered by the BBC and AP. A 200-couple ceremony in a Kebbi LGA gets one Daily Trust story. The dataset will always know more about the big northern editions than the small ones.
- **Announced is not held.** Programmes get budgeted, screened for, and quietly dropped. Those records are kept but marked, and can be filtered out.
- **Couple counts are what was reported.** Where a state reported brides and grooms separately, or where the announced figure differed from the figure on the day, the clustering keeps the most frequently reported number and links every source so you can check.

## Stack

Next.js 16 · Mapbox GL + react-map-gl · Tailwind v4 · Zustand · [Valyu](https://www.valyu.ai) for search, structured extraction and answers · zod
