import { MersenneTwister } from "../../../utils/MersenneTwister";

export class PlateChunk {
    constructor(position, seed) {
        this.position = position;
        this.size = 131072; // Increased from 4096
        this.seed = seed;
        this.points = [];
    }

    generatePoints() {
        const rng = new MersenneTwister(this.seed + 
            this.position.x * 16777259 + 
            this.position.z * 48611);
        
        // Generate 8-12 points per plate chunk
        const pointCount = 20 + Math.floor(rng.random() * 5);
        
        for (let i = 0; i < pointCount; i++) {
            this.points.push({
                x: this.position.x * this.size + rng.random() * this.size,
                z: this.position.z * this.size + rng.random() * this.size
            });
        }
    }
}