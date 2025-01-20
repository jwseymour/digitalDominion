import { MersenneTwister } from "../../../utils/MersenneTwister";

export class PlateChunk {
    constructor(position, seed, size, valueCount = 0) {
        this.position = position;
        this.size = size;
        this.seed = seed;
        this.valueCount = valueCount;
        this.points = [];
    }

    generatePoints() {
        const rng = new MersenneTwister(this.seed + 
            this.position.x * 16777259 + 
            this.position.z * 48611);
        
        // Generate 8-12 points per plate chunk
        const pointCount = 20 + Math.floor(rng.random() * 5);
        
        for (let i = 0; i < pointCount; i++) {
            const point = {
                x: this.position.x * this.size + rng.random() * this.size,
                z: this.position.z * this.size + rng.random() * this.size,
                values: []
            };

            // Generate additional random values if requested
            for (let j = 0; j < this.valueCount; j++) {
                point.values.push(rng.random());
            }

            this.points.push(point);
        }
    }
}