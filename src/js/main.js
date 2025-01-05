import { WorldGenerator } from './engine/world/WorldGenerator.js';
import { WorldRenderer } from './visualisation/world-renderer.js';

class DigitalDominion {
    constructor() {
        this.worldGenerator = null;
        this.worldRenderer = null;
        this.seedInput = document.getElementById('seed-input');
        this.init();
        this.startNewSimulation(1); // Start with seed 1
    }

    init() {
        this.setupEventListeners();
        this.setupWorldView();
    }

    setupEventListeners() {
        document.getElementById('new-simulation').addEventListener('click', () => {
            const newSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            this.seedInput.value = newSeed;
            this.startNewSimulation(newSeed);
        });
        document.getElementById('leadership-mode').addEventListener('change', (e) => this.changeLeadershipMode(e));
        this.seedInput.addEventListener('change', () => {
            const seed = parseInt(this.seedInput.value) || 1;
            this.startNewSimulation(seed);
        });
    }

    setupWorldView() {
        this.worldRenderer = new WorldRenderer('world-view');
    }

    startNewSimulation(seed) {
        this.worldGenerator = new WorldGenerator(seed);
        console.log(`Starting new simulation with seed: ${seed}`);
        
        // Generate and render initial chunks around origin
        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                const chunk = this.worldGenerator.getChunk(x, z);
                this.worldRenderer.renderChunk(chunk);
            }
        }
    }

    changeLeadershipMode(event) {
        const mode = event.target.value;
        console.log(`Changing leadership mode to: ${mode}`);
    }
}

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
    new DigitalDominion();
});