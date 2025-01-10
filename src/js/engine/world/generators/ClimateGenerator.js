import { HeightMapGenerator } from './HeightMapGenerator.js';
import { InterpolationUtils } from '../utils/InterpolationUtils.js';

export class ClimateGenerator {
    constructor(seed) {
        this.seed = seed;
        this.heightMapGenerator = new HeightMapGenerator(seed + 1000); // Different seed for climate
    }

    generateClimate(chunk) {
        // Generate temperature variation map
        const temperatureMap = this.heightMapGenerator.generateHeightMap(
            chunk.position.x * chunk.size,
            chunk.position.z * chunk.size,
            chunk.size,
            chunk.size,
            32  // Medium scale temperature variations
        );

        // Generate rainfall variation map
        const rainfallMap = this.heightMapGenerator.generateHeightMap(
            chunk.position.x * chunk.size,
            chunk.position.z * chunk.size,
            chunk.size,
            chunk.size,
            48  // Larger scale rainfall patterns
        );

        this.calculateClimate(chunk, temperatureMap, rainfallMap);
        return chunk;
    }

    calculateClimate(chunk, temperatureMap, rainfallMap) {
        for (let x = 0; x < chunk.size; x++) {
            for (let z = 0; z < chunk.size; z++) {
                const worldX = chunk.position.x * chunk.size + x;
                const worldZ = chunk.position.z * chunk.size + z;
                
                // Generate temperature based on latitude and local variations
                const latitude = worldZ / 1000;
                const baseTemp = 20 - Math.abs(latitude) * 0.5;
                
                chunk.climate.temperature[x + z * chunk.size] = 
                    baseTemp + temperatureMap[z][x] * 10;

                // Generate rainfall with variations
                const baseRainfall = 1000 - Math.abs(latitude) * 100;
                chunk.climate.rainfall[x + z * chunk.size] = 
                    baseRainfall + rainfallMap[z][x] * 500;
            }
        }
    }
}