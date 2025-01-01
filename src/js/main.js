import { WorldGenerator } from './engine/world/WorldGenerator.js';
import { WorldRenderer } from './visualisation/world-renderer.js';

class DigitalDominion {
    constructor() {
        this.worldGenerator = null;
        this.worldRenderer = null;
        this.init();
        this.startNewSimulation(); // Automatically start a simulation when loaded
    }

    init() {
        this.setupEventListeners();
        this.setupWorldView();
    }

    setupEventListeners() {
        document.getElementById('new-simulation').addEventListener('click', () => this.startNewSimulation());
        document.getElementById('load-simulation').addEventListener('click', () => this.loadSimulation());
        document.getElementById('leadership-mode').addEventListener('change', (e) => this.changeLeadershipMode(e));
    }

    setupWorldView() {
        this.worldRenderer = new WorldRenderer('world-view');
    }

    startNewSimulation() {
        const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        this.worldGenerator = new WorldGenerator(seed);
        console.log(`Starting new simulation with seed: ${seed}`);
        
        // Generate and render initial chunks around origin
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const chunk = this.worldGenerator.getChunk(x, z);
                this.worldRenderer.renderChunk(chunk);
            }
        }
    }

    loadSimulation() {
        console.log('Loading simulation');
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