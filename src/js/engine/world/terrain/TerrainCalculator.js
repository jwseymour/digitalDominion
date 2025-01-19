import { InterpolationUtils } from '../utils/InterpolationUtils.js';
import { TERRAIN_TRANSITIONS } from './TerrainTypes.js';

export class TerrainCalculator {
    constructor(baseHeight) {
        this.baseHeight = baseHeight;
    }

    classifyTerrain(value) {
        // Calculate smooth weights for each terrain type
        const weights = {};
        for (const [type, range] of Object.entries(TERRAIN_TRANSITIONS)) {
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
            return InterpolationUtils.smootherstep(t);
        } else {
            // Smooth transition from peak to end
            const t = (end - value) / (end - peak);
            return InterpolationUtils.smootherstep(t);
        }
    }

    generateOceanicTerrain(oceanic, valley, depth) {
        const base = InterpolationUtils.sigmoid(oceanic, 6) * depth;
        return this.baseHeight + base * 100 + valley * 10;
    }

    generateArchipelagoTerrain(oceanic, hills, mountains) {
        const islandFactor = InterpolationUtils.easeInOut(oceanic * 0.5 + 0.5);
        const baseHeight = InterpolationUtils.smootherstep(InterpolationUtils.lerp(-0.4, 0.3, islandFactor));
        const hillEffect = baseHeight > 0 ? hills * 10 : 0;
        const mountainEffect = mountains * 40;
        return this.baseHeight + baseHeight * 120 + hillEffect + mountainEffect;
    }

    generateCoastalTerrain(oceanic, hills, valley) {
        const coastFactor = InterpolationUtils.easeIn(oceanic * 0.5 + 0.5);
        const height = InterpolationUtils.lerp(-0.1, 0.15, coastFactor);
        return this.baseHeight + height * 100 + hills * 15 + valley * 10;
    }

    generatePlainsTerrain(plateau, hills) {
        const plainsFactor = InterpolationUtils.easeInOut(plateau * 0.5 + 0.5);
        return this.baseHeight + plainsFactor * 20 + hills * 5;
    }

    generateHillyTerrain(hills, valley, plateau) {
        const baseHeight = InterpolationUtils.easeInOut(hills);
        const valleyInfluence = InterpolationUtils.sigmoid(valley, 3);
        return this.baseHeight + baseHeight * 100 + valley * 30 + plateau * 20;
    }

    generateMountainTerrain(mountains, valley, plateau) {
        const mountainHeight = InterpolationUtils.ridgeNoise(mountains);
        const peakFactor = Math.pow(mountainHeight, 1.2);
        const baseElevation = 150;
        return baseElevation + peakFactor * 200 + valley * 40 + plateau * 60;
    }

    generatePlateauTerrain(plateau, valley, hills) {
        const plateauHeight = InterpolationUtils.sigmoid(plateau, 4);
        return this.baseHeight + plateauHeight * 200 + valley * 30 + hills * 10;
    }
}