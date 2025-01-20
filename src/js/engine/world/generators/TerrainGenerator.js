import { InterpolationUtils } from '../utils/InterpolationUtils.js';
import { TerrainCalculator } from '../terrain/TerrainCalculator.js';
import { HeightMapGenerator } from './HeightMapGenerator.js';
import { PlateManager } from '../plate/PlateManager.js';

export class TerrainGenerator {
    constructor(seed, baseHeight = 0) {
        this.seed = seed;
        this.baseHeight = baseHeight;
        this.plateManager = new PlateManager(seed, 131072, 1);
        this.heightMapGenerator = new HeightMapGenerator(seed);
        this.terrainCalculator = new TerrainCalculator(baseHeight);
    }

    generateTerrain(chunk) {
        // Generate global terrain type map (extremely large scale)
        const terrainTypeMap = Array(chunk.size).fill().map(() => Array(chunk.size).fill(0));
        
        for (let z = 0; z < chunk.size; z++) {
            for (let x = 0; x < chunk.size; x++) {
                const worldX = chunk.position.x * chunk.size + x;
                const worldZ = chunk.position.z * chunk.size + z;
                const result = this.plateManager.calculateWorleyValue(worldX, worldZ);
                terrainTypeMap[z][x] = {
                    value: result.value,
                    additionalValue: result.values[0] || 0
                };
            }
        }

        // Generate various influence maps
        const oceanicMap = this.heightMapGenerator.generateHeightMap(
            chunk.position.x * chunk.size,
            chunk.position.z * chunk.size,
            chunk.size,
            chunk.size,
            2048  // Ocean/continent boundaries
        );

        const plateauMap = this.heightMapGenerator.generateHeightMap(
            chunk.position.x * chunk.size,
            chunk.position.z * chunk.size,
            chunk.size,
            chunk.size,
            1024 // Large plateaus and basins
        );

        const mountainRanges = this.heightMapGenerator.generateHeightMap(
            chunk.position.x * chunk.size,
            chunk.position.z * chunk.size,
            chunk.size,
            chunk.size,
            512  // Mountain range scale
        );

        const valleySystem = this.heightMapGenerator.generateHeightMap(
            chunk.position.x * chunk.size,
            chunk.position.z * chunk.size,
            chunk.size,
            chunk.size,
            256  // Valley system scale
        );

        const hillFeatures = this.heightMapGenerator.generateHeightMap(
            chunk.position.x * chunk.size,
            chunk.position.z * chunk.size,
            chunk.size,
            chunk.size,
            128  // Rolling hills scale
        );

        const detailFeatures = this.heightMapGenerator.generateHeightMap(
            chunk.position.x * chunk.size,
            chunk.position.z * chunk.size,
            chunk.size,
            chunk.size,
            32  // Small detail scale
        );

        return this.combineTerrain(
            chunk,
            terrainTypeMap,
            oceanicMap,
            plateauMap,
            mountainRanges,
            valleySystem,
            hillFeatures,
            detailFeatures
        );
    }

    combineTerrain(chunk, terrainTypeMap, oceanicMap, plateauMap, mountainRanges, valleySystem, hillFeatures, detailFeatures) {
    for (let x = 0; x < chunk.size; x++) {
        for (let z = 0; z < chunk.size; z++) {
            // Extract the value from the new terrainTypeMap structure
            const terrainData = terrainTypeMap[z][x];
            const terrainTypes = this.terrainCalculator.classifyTerrain(terrainData.value);
            
            let finalHeight = 0;
            let totalWeight = 0;

            // Apply each terrain type with its corresponding weight
            Object.entries(terrainTypes).forEach(([type, weight]) => {
                if (weight > 0) {
                    // Use the additional value as a modifier for terrain generation
                    const modifier = terrainData.additionalValue * 0.5; // Scale the influence
                    const height = this.generateTerrainType(
                        type,
                        oceanicMap[z][x] + modifier,
                        hillFeatures[z][x],
                        valleySystem[z][x],
                        plateauMap[z][x],
                        mountainRanges[z][x]
                    );
                    finalHeight += height * weight;
                    totalWeight += weight;
                }
            });

            // Normalize height and add details
            if (totalWeight > 0) {
                let height = finalHeight / totalWeight;
                const detailScale = 1 + Math.abs(height - this.baseHeight) / 100;
                height += detailFeatures[z][x] * 5 * detailScale;
                chunk.terrain[x + z * chunk.size] = height;
            } else {
                chunk.terrain[x + z * chunk.size] = this.baseHeight;
            }
        }
    }
    return chunk;
}

    generateTerrainType(type, oceanic, hills, valley, plateau, mountains) {
        switch (type) {
            case 'deepOcean':
                return this.terrainCalculator.generateOceanicTerrain(oceanic, valley, -0.8);
            case 'archipelago':
                return this.terrainCalculator.generateArchipelagoTerrain(oceanic, hills, mountains);
            case 'coastal':
                return this.terrainCalculator.generateCoastalTerrain(oceanic, hills, valley);
            case 'plains':
                return this.terrainCalculator.generatePlainsTerrain(plateau, hills);
            case 'hills':
                return this.terrainCalculator.generateHillyTerrain(hills, valley, plateau);
            case 'mountains':
                return this.terrainCalculator.generateMountainTerrain(mountains, valley, plateau);
            case 'plateau':
                return this.terrainCalculator.generatePlateauTerrain(plateau, valley, hills);
            default:
                return this.baseHeight;
        }
    }
}