import { MersenneTwister } from '../../../utils/MersenneTwister.js';

export class RockLayerGenerator {
    constructor(seed) {
        this.seed = seed;
        this.rng = new MersenneTwister(seed);
    }

    generateRockLayers(chunk) {
        const rockLayers = [];
        const layerCount = Math.floor(this.rng.random() * 3) + 2;

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
        return chunk;
    }

    selectRockType(depth) {
        if (depth < 20) return 'sedimentary';
        if (depth < 50) return 'metamorphic';
        return 'igneous';
    }
}