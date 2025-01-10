import { MersenneTwister } from '../../utils/MersenneTwister.js';
import { xyToIndex } from '../../utils/SpiralIndexMapping.js';

export class WorldGenerator {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.rng = new MersenneTwister(seed);
        this.chunks = new Map(); // Store loaded chunks
        this.chunkSize = 256; // Size of each chunk in world units
        this.baseHeight = 0; // Base terrain height
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

        this.generateBaseTerrain(chunk);
        this.generateRockFormations(chunk);
        this.generateClimate(chunk);

        return chunk;
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

    generateBaseTerrain(chunk) {

        // Generate global terrain type map (extremely large scale)
        const terrainTypeMap = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            4096 // Very large scale for global terrain types
        );
    
        // Generate various influence maps
        const oceanicMap = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            2048  // Ocean/continent boundaries
        );
    
        const plateauMap = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            1024 // Large plateaus and basins
        );
    
        // Generate terrain features at different scales
        const mountainRanges = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            512  // Mountain range scale
        );
    
        const valleySystem = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            256  // Valley system scale
        );
    
        const hillFeatures = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            128 // Rolling hills scale
        );
    
        const detailFeatures = this.generateHeightMap(
            chunk.position.x * this.chunkSize,
            chunk.position.z * this.chunkSize,
            this.chunkSize,
            this.chunkSize,
            32  // Small detail scale
        );
    
        // Process terrain type and apply appropriate features
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const terrainTypes = this.classifyTerrain(terrainTypeMap[z][x]);
                let finalHeight = 0;
                let totalWeight = 0;
    
                // Deep Ocean
                if (terrainTypes.deepOcean > 0) {
                    const height = this.generateOceanicTerrain(
                        oceanicMap[z][x],
                        valleySystem[z][x],
                        -0.8
                    );
                    finalHeight += height * terrainTypes.deepOcean;
                    totalWeight += terrainTypes.deepOcean;
                }
    
                // Archipelago
                if (terrainTypes.archipelago > 0) {
                    const height = this.generateArchipelagoTerrain(
                        oceanicMap[z][x],
                        hillFeatures[z][x],
                        mountainRanges[z][x]
                    );
                    finalHeight += height * terrainTypes.archipelago;
                    totalWeight += terrainTypes.archipelago;
                }
    
                // Coastal
                if (terrainTypes.coastal > 0) {
                    const height = this.generateCoastalTerrain(
                        oceanicMap[z][x],
                        hillFeatures[z][x],
                        valleySystem[z][x]
                    );
                    finalHeight += height * terrainTypes.coastal;
                    totalWeight += terrainTypes.coastal;
                }
    
                // Plains
                if (terrainTypes.plains > 0) {
                    const height = this.generatePlainsTerrain(
                        plateauMap[z][x],
                        hillFeatures[z][x]
                    );
                    finalHeight += height * terrainTypes.plains;
                    totalWeight += terrainTypes.plains;
                }
    
                // Hills
                if (terrainTypes.hills > 0) {
                    const height = this.generateHillyTerrain(
                        hillFeatures[z][x],
                        valleySystem[z][x],
                        plateauMap[z][x]
                    );
                    finalHeight += height * terrainTypes.hills;
                    totalWeight += terrainTypes.hills;
                }
    
                // Mountains
                if (terrainTypes.mountains > 0) {
                    const height = this.generateMountainTerrain(
                        mountainRanges[z][x],
                        valleySystem[z][x],
                        plateauMap[z][x]
                    );
                    finalHeight += height * terrainTypes.mountains;
                    totalWeight += terrainTypes.mountains;
                }
    
                // Plateau
                if (terrainTypes.plateau > 0) {
                    const height = this.generatePlateauTerrain(
                        plateauMap[z][x],
                        valleySystem[z][x],
                        hillFeatures[z][x]
                    );
                    finalHeight += height * terrainTypes.plateau;
                    totalWeight += terrainTypes.plateau;
                }
    
                // Normalize the height and add small details
                let height = finalHeight / totalWeight;
                
                // Add detail features that scale with terrain height
                const detailScale = 1 + Math.abs(height - this.baseHeight) / 100;
                height += detailFeatures[z][x] * 5 * detailScale;
    
                chunk.terrain[x + z * this.chunkSize] = height;
            }
        }
    }

    classifyTerrain(value) {
        // Convert to [0,1] range and add some noise to break up straight lines
        value = (value + 1) * 0.5;
        
        // Wider transition zones with overlapping ranges
        const transitions = {
            deepOcean: {
                start: 0,
                peak: 0.15,
                end: 0.25
            },
            archipelago: {
                start: 0.15,
                peak: 0.25,
                end: 0.35
            },
            coastal: {
                start: 0.25,
                peak: 0.35,
                end: 0.45
            },
            plains: {
                start: 0.35,
                peak: 0.45,
                end: 0.6
            },
            hills: {
                start: 0.45,
                peak: 0.6,
                end: 0.75
            },
            mountains: {
                start: 0.6,
                peak: 0.75,
                end: 0.9
            },
            plateau: {
                start: 0.75,
                peak: 0.9,
                end: 1
            }
        };
    
        // Calculate smooth weights for each terrain type
        const weights = {};
        for (const [type, range] of Object.entries(transitions)) {
            const weight = this.smoothTransition(value, range.start, range.peak, range.end);
            weights[type] = weight;
        }
    
        return weights;
    }
    
    smoothTransition(value, start, peak, end) {
        if (value < start || value > end) return 0;
        
        if (value < peak) {
            // Smooth transition from start to peak
            const t = (value - start) / (peak - start);
            return this.smootherstep(t);
        } else {
            // Smooth transition from peak to end
            const t = (end - value) / (end - peak);
            return this.smootherstep(t);
        }
    }
    
    smootherstep(t) {
        // Smoother interpolation curve
        t = Math.max(0, Math.min(1, t));
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    generateOceanicTerrain(oceanic, valley, depth) {
        const base = this.sigmoid(oceanic, 6) * depth;
        return this.baseHeight + base * 100 + valley * 10;
    }
    
    generateArchipelagoTerrain(oceanic, hills, mountains) {
        const islandFactor = this.easeInOut(oceanic * 0.5 + 0.5);
        // Make islands more distinct and taller
        const baseHeight = this.smootherstep(this.lerp(-0.4, 0.3, islandFactor));
        
        // Only apply hill variations when above water level
        const hillEffect = baseHeight > 0 ? hills * 10 : 0;
        
        // Increase mountain influence on island height
        const mountainEffect = mountains * 40;
        
        // Combine effects with stronger base height
        return this.baseHeight + baseHeight * 120 + hillEffect + mountainEffect;
    }
    
    generateCoastalTerrain(oceanic, hills, valley) {
        const coastFactor = this.easeIn(oceanic * 0.5 + 0.5);
        const height = this.lerp(-0.1, 0.15, coastFactor);
        return this.baseHeight + height * 100 + hills * 15 + valley * 10;
    }
    
    generatePlainsTerrain(plateau, hills) {
        const plainsFactor = this.easeInOut(plateau * 0.5 + 0.5);
        return this.baseHeight + plainsFactor * 20 + hills * 5;
    }
    
    generateHillyTerrain(hills, valley, plateau) {
        const baseHeight = this.easeInOut(hills);
        const valleyInfluence = this.sigmoid(valley, 3);
        return this.baseHeight + baseHeight * 100 + valley * 30 + plateau * 20;
    }
    
    generateMountainTerrain(mountains, valley, plateau) {
        const mountainHeight = this.ridgeNoise(mountains);
        const peakFactor = Math.pow(mountainHeight, 1.2); // Reduced from 1.5 for less extreme peaks
        const baseElevation = 150; // Reduced from 200
        return baseElevation + peakFactor * 200 + valley * 40 + plateau * 60; // Reduced multipliers
    }
    
    generatePlateauTerrain(plateau, valley, hills) {
        const plateauHeight = this.sigmoid(plateau, 4);
        return this.baseHeight + plateauHeight * 200 + valley * 30 + hills * 10;
    }
    
    sigmoid(x, steepness = 1) {
        return 1 / (1 + Math.exp(-steepness * x));
    }
    
    easeIn(x) {
        return x * x;
    }
    
    easeOut(x) {
        return 1 - (1 - x) * (1 - x);
    }
    
    easeInOut(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    }
    
    // Add this utility function for ridge creation
    ridgeNoise(value) {
        // Convert normal noise to ridged noise
        value = Math.abs(value);
        value = 1 - value;
        return value * value;
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
                
                // Use continuous hash function
                const hashedValue = this.hashSeed(this.seed, worldX, worldZ);
                
                // Use consistent random generation
                const pointRng = new MersenneTwister(Math.floor(Math.abs(hashedValue * 1000000)));
                controlPoints[z][x] = pointRng.random() * 2 - 1;
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

    hashSeed(seed, x, y) {
        // Use a more continuous hash function
        const h1 = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
        const h2 = Math.sin(y * 12.9898 + x * 78.233 + seed * 1.234) * 43758.5453123;
        return (h1 + h2) * 0.5;
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