import { WorldGenerator } from './engine/world/WorldGenerator.js';
import { WorldRenderer } from './visualisation/world-renderer.js';
import { ChunkManager } from './engine/world/ChunkManager.js';
import * as THREE from 'three';

class DigitalDominion {
    constructor() {
        this.worldGenerator = null;
        this.worldRenderer = null;
        this.chunkManager = null;
        this.seedInput = document.getElementById('seed-input');
        this.init();
        this.startNewSimulation(3);
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
            const seed = parseInt(this.seedInput.value) || 3;
            this.startNewSimulation(seed);
        });
    }

    setupWorldView() {
        this.worldRenderer = new WorldRenderer('world-view');
        
        // Add update callback for chunk loading
        this.worldRenderer.onCameraMove = (position) => {
            if (this.chunkManager) {
                this.chunkManager.update(position);
            }
        };
    }

    startNewSimulation(seed) {
        // Clear existing chunks if any
        if (this.worldRenderer) {
            this.worldRenderer.clearChunks();
        }
        
        this.worldGenerator = new WorldGenerator(seed);
        this.chunkManager = new ChunkManager(this.worldGenerator, this.worldRenderer);
        console.log(`Starting new simulation with seed: ${seed}`);
        
        // Initial chunk load around origin
        this.chunkManager.update(new THREE.Vector3(0, 0, 0));
    }

    changeLeadershipMode(event) {
        const mode = event.target.value;
        console.log(`Changing leadership mode to: ${mode}`);
    }
}

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
    window.app = new DigitalDominion();
});