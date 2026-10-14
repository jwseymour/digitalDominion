# Digital Dominion

An in-browser, infinite, procedurally generated 3D world, built as the foundation for a civilisation-building game where you guide mortals as a disembodied god, with LLM-driven characters reacting to your choices.

Built with **JavaScript (ES modules)**, **Three.js** and **Vite**. No pre-made assets or terrain libraries: the terrain, noise and chunk streaming are all written from scratch.

<!-- Add a screenshot: save it as docs/screenshot.png and uncomment the next line -->
<!-- ![Digital Dominion terrain](docs/screenshot.png) -->

## Highlights

- **Infinite, seeded terrain.** The same seed always produces the same world, generated on demand as you move.
- **Chunk streaming with multi-level LOD.** Chunks near the camera render at high resolution and distant ones at progressively lower resolution, under a fixed memory budget (`ChunkManager`).
- **Tectonic-plate-style terrain (in progress).** Large-scale structure comes from Worley/Voronoi noise over a plate grid (`PlateManager`, `PlateChunk`), layered with interpolated height maps.
- **Climate and rock-layer generators** that feed terrain colouring now and will drive wildlife and resources later.
- **Custom utilities.** Mersenne Twister PRNG, spiral coordinate indexing for deterministic per-cell hashing, and interpolation helpers.
- **Free-flight camera** with boost and top-down view.

## Getting started

Requires [Node.js](https://nodejs.org/) 18+.

```bash
git clone https://github.com/jwseymour/digitalDominion.git
cd digitalDominion
npm install
npm run dev
```

Vite opens the app in your browser. Use **New Simulation** for a random seed, or type a seed in the box.

| Key | Action |
| --- | --- |
| `W A S D` / arrows | Move |
| `Space` / `Shift` | Up / down |
| `B` | Speed boost |
| `T` | Toggle top-down view |
| Click, then move mouse | Look around (pointer lock) |

Other scripts: `npm run build` (production bundle in `dist/`) and `npm run preview`.

## Project structure

```
src/
├── index.html
├── js/
│   ├── main.js                    # App entry point and UI wiring
│   ├── controls/PlayerControls.js # Free-flight camera controls
│   ├── visualisation/             # Three.js renderer and chunk meshes
│   ├── engine/world/
│   │   ├── WorldGenerator.js      # Combines all generators into a chunk
│   │   ├── ChunkManager.js        # Streaming, LOD levels, memory budgets
│   │   ├── generators/            # Height map, terrain, climate, rock layers
│   │   ├── plate/                 # Worley/Voronoi plate generation
│   │   └── terrain/               # Terrain types and height calculation
│   └── utils/                     # PRNG, spiral indexing
└── heightmap-viewer.html          # Standalone height-map debugging view
docs/
├── roadmap.md                     # Development plan
└── design-notes.md                # Game concept and design thinking
```

## Roadmap

- [x] Seeded infinite terrain with chunk streaming and LOD
- [x] Worley-noise plate chunks
- [ ] Smoother, more realistic terrain from plate boundaries
- [ ] Climate and rock-type maps driving biomes
- [ ] Wildlife and features placed on terrain
- [ ] LLM-driven mortals and a "game keeper" AI using structured JSON output
- [ ] Civilisation state model and gameplay loop

See [docs/roadmap.md](docs/roadmap.md) and [docs/design-notes.md](docs/design-notes.md) for details on the game concept.

## License

[MIT](LICENSE) © Jack Seymour
