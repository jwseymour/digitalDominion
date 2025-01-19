import { InterpolationUtils } from '../utils/InterpolationUtils.js';
import { TerrainCalculator } from '../terrain/TerrainCalculator.js';
import { HeightMapGenerator } from './HeightMapGenerator.js';
import { PlateManager } from '../plate/PlateManager.js';

export class TerrainGenerator {
    constructor(seed, baseHeight = 0) {
        this.seed = seed;
        this.baseHeight = baseHeight;
        this.plateManager = new PlateManager(seed);
        this.heightMapGenerator = new HeightMapGenerator(seed);
        this.terrainCalculator = new TerrainCalculator(baseHeight);
    }

    generateTerrain(chunk) {
        // Generate global terrain type map (extremely large scale)
        // const terrainTypeMap = this.heightMapGenerator.generateHeightMap(
        //     chunk.position.x * chunk.size,
        //     chunk.position.z * chunk.size,
        //     chunk.size,
        //     chunk.size,
        //     4096 // Very large scale for global terrain types
        // );
        const terrainTypeMap = Array(chunk.size).fill().map(() => Array(chunk.size).fill(0));
        
        for (let z = 0; z < chunk.size; z++) {
            for (let x = 0; x < chunk.size; x++) {
                const worldX = chunk.position.x * chunk.size + x;
                const worldZ = chunk.position.z * chunk.size + z;
                terrainTypeMap[z][x] = this.plateManager.calculateWorleyValue(worldX, worldZ);
            }
        }
        console.log(terrainTypeMap[1][1])

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
                const terrainTypes = this.terrainCalculator.classifyTerrain(terrainTypeMap[z][x]);
                let finalHeight = 0;
                let totalWeight = 0;

                // Apply each terrain type with its corresponding weight
                Object.entries(terrainTypes).forEach(([type, weight]) => {
                    if (weight > 0) {
                        const height = this.generateTerrainType(
                            type,
                            oceanicMap[z][x],
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
                let height = finalHeight / totalWeight;
                const detailScale = 1 + Math.abs(height - this.baseHeight) / 100;
                height += detailFeatures[z][x] * 5 * detailScale;

                chunk.terrain[x + z * chunk.size] = height;
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