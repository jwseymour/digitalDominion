import { MersenneTwister } from '../../utils/MersenneTwister.js';
import { xyToIndex } from '../../utils/SpiralIndexMapping.js';

export class WorldGenerator {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.rng = new MersenneTwister(seed);
        this.chunks = new Map(); // Store loaded chunks
        this.chunkSize = 256; // Size of each chunk in world units
        this.baseHeight = 100; // Base terrain height
    }

    // Get or generate a chunk at specified coordinates
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
            terrain: new Float32Array(this.chunkSize * this.chunkSize),
            rockLayers: [],
            climate: {
                rainfall: new Float32Array(this.chunkSize * this.chunkSize),
                temperature: new Float32Array(this.chunkSize * this.chunkSize)
            }
        };

        // Generate base terrain using multiple octaves of noise
        this.generateBaseTerrain(chunk);
        this.generateRockFormations(chunk);
        this.generateClimate(chunk);

        return chunk;
    }

    generateBaseTerrain(chunk) {
        // Generate height maps at different scales for multiple octaves of detail
        const largeFeatures = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            64  // Large scale features
        );
        
        const mediumFeatures = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            16  // Medium scale features
        );
        
        const smallFeatures = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            4   // Small scale features
        );
    
        // Combine the different scales into final terrain
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                let height = this.baseHeight;
                
                // Add features at different scales with different weights
                height += largeFeatures[z][x] * 50;    // Large features have most impact
                height += mediumFeatures[z][x] * 10;   // Medium features add some variation
                height += smallFeatures[z][x] * 2;     // Small features add fine detail
                
                chunk.terrain[x + z * this.chunkSize] = height;
            }
        }
    }

    generateRockFormations(chunk) {
        // Generate major geological features
        const rockLayers = [];
        const layerCount = Math.floor(this.rng.random() * 3) + 2; // 2-4 rock layers

        let currentDepth = 0;
        for (let i = 0; i < layerCount; i++) {
            const layer = {
                type: this.selectRockType(currentDepth),
                depth: currentDepth,
                thickness: 20 + this.rng.random() * 30
            };
            rockLayers.push(layer);
            currentDepth += layer.thickness;
        }

        chunk.rockLayers = rockLayers;
    }

    generateClimate(chunk) {
        // Generate temperature variation map
        const temperatureMap = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            32  // Medium scale temperature variations
        );
    
        // Generate rainfall variation map
        const rainfallMap = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            48  // Larger scale rainfall patterns
        );
    
        // Generate basic climate data
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = chunk.position.x * this.chunkSize + x;
                const worldZ = chunk.position.z * this.chunkSize + z;
                
                // Generate temperature based on latitude (z coordinate) and local variations
                const latitude = worldZ / 1000; // Arbitrary scale
                const baseTemp = 20 - Math.abs(latitude) * 0.5; // Temperature decreases away from equator
                
                // Add temperature variations from height map
                chunk.climate.temperature[x + z * this.chunkSize] = 
                    baseTemp + temperatureMap[z][x] * 10; // ±10 degrees variation
    
                // Generate rainfall with height map variations
                // Base rainfall decreases away from equator
                const baseRainfall = 1000 - Math.abs(latitude) * 100;
                chunk.climate.rainfall[x + z * this.chunkSize] = 
                    baseRainfall + rainfallMap[z][x] * 500; // ±500mm variation
            }
        }
    }

    selectRockType(depth) {
        // Simplified rock type selection based on depth
        if (depth < 20) return 'sedimentary';
        if (depth < 50) return 'metamorphic';
        return 'igneous';
    }

    generateHeightMap(startX, startZ, width, height, scale) {
        // Create the output height array
        const heightMap = Array(height).fill().map(() => Array(width).fill(0));
        
        // Calculate the grid size needed for the control points (add 2 for edges)
        const gridWidth = Math.ceil(width / scale) + 2;
        const gridHeight = Math.ceil(height / scale) + 2;
        
        // Create control points grid with random values
        const controlPoints = Array(gridHeight).fill().map(() => Array(gridWidth).fill(0));
        
        // Fill control points using spiral mapping
        for (let z = 0; z < gridHeight; z++) {
            for (let x = 0; x < gridWidth; x++) {
                // Convert grid position to world position
                const worldX = Math.floor(startX / scale) - 1 + x;
                const worldZ = Math.floor(startZ / scale) - 1 + z;
                
                // Get spiral index for these coordinates
                const spiralIndex = this.xyToIndex(worldX, worldZ);
                
                // Use spiral index as seed for this point
                const pointRng = new MersenneTwister(this.seed + spiralIndex);
                controlPoints[z][x] = pointRng.random() * 2 - 1; // Value between -1 and 1
            }
        }
        
        // Generate height values using control points
        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                // Convert to control point space
                const xPos = (x + startX) / scale;
                const zPos = (z + startZ) / scale;
                
                // Get grid cell coordinates
                const x0 = Math.floor(xPos);
                const z0 = Math.floor(zPos);
                
                // Get local coordinates within the grid cell
                const xf = xPos - x0;
                const zf = zPos - z0;
                
                // Get control point indices (offset by 1 due to the extra edge layer)
                const gridX = x0 - Math.floor(startX / scale) + 1;
                const gridZ = z0 - Math.floor(startZ / scale) + 1;
                
                // Get the four corner values
                const points = [
                    controlPoints[gridZ][gridX],
                    controlPoints[gridZ][gridX + 1],
                    controlPoints[gridZ + 1][gridX],
                    controlPoints[gridZ + 1][gridX + 1]
                ];
                
                // Interpolate to get final height
                heightMap[z][x] = this.interpolateHeight(points, xf, zf);
            }
        }
        
        return heightMap;
    }
    
    interpolateHeight(points, x, y) {
        // Smooth interpolation using existing smootherstep function
        const sx = this.smootherstep(x);
        const sy = this.smootherstep(y);
        
        // Bilinear interpolation
        const nx0 = this.lerp(points[0], points[1], sx);
        const nx1 = this.lerp(points[2], points[3], sx);
        
        return this.lerp(nx0, nx1, sy);
    }
    
    xyToIndex(x, y) {
        // Reference the existing spiral mapping function
        return xyToIndex(x, y);
    }
    
    dot(g, x, y) {
        return g.x * x + g.y * y;
    }
    
    lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    smootherstep(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
}