import { HeightMapGenerator } from './generators/HeightMapGenerator.js';
import { TerrainCalculator } from './terrain/TerrainCalculator.js';
import { ClimateGenerator } from './generators/ClimateGenerator.js';
import { RockLayerGenerator } from './generators/RockLayerGenerator.js';
import { TerrainGenerator } from './generators/TerrainGenerator.js';

export class WorldGenerator {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.chunks = new Map();
        this.chunkSize = 256;
        this.baseHeight = 0;
        
        this.heightMapGenerator = new HeightMapGenerator(seed);
        this.terrainCalculator = new TerrainCalculator(this.baseHeight);
        this.climateGenerator = new ClimateGenerator(seed);
        this.rockLayerGenerator = new RockLayerGenerator(seed);
        this.terrainGenerator = new TerrainGenerator(seed, this.baseHeight);
    }

    getChunk(x, z) {
        const chunkKey = `${x},${z}`;
        if (!this.chunks.has(chunkKey)) {
            this.chunks.set(chunkKey, this.generateChunk(x, z));
        }
        return this.chunks.get(chunkKey);
    }

    generateChunk(chunkX, chunkZ) {
        const chunk = {
            position: { x: chunkX, z: chunkZ },
            size: this.chunkSize,
            terrain: new Float32Array(this.chunkSize * this.chunkSize),
            rockLayers: [],
            climate: {
                rainfall: new Float32Array(this.chunkSize * this.chunkSize),
                temperature: new Float32Array(this.chunkSize * this.chunkSize)
            }
        };

        this.rockLayerGenerator.generateRockLayers(chunk);
        this.climateGenerator.generateClimate(chunk);
        this.terrainGenerator.generateTerrain(chunk);

        return chunk;
    }
}