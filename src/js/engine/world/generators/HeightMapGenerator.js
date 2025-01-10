import { MersenneTwister } from '../../../utils/MersenneTwister.js';
import { xyToIndex } from '../../../utils/SpiralIndexMapping.js';
import { InterpolationUtils } from '../utils/InterpolationUtils.js';

export class HeightMapGenerator {
    constructor(seed) {
        this.seed = seed;
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
                const spiralIndex = xyToIndex(worldX, worldZ);
                
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
        const h1 = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
        const h2 = Math.sin(y * 12.9898 + x * 78.233 + seed * 1.234) * 43758.5453123;
        return (h1 + h2) * 0.5;
    }

    interpolateHeight(points, x, y) {
        const sx = InterpolationUtils.smootherstep(x);
        const sy = InterpolationUtils.smootherstep(y);
        
        const nx0 = InterpolationUtils.lerp(points[0], points[1], sx);
        const nx1 = InterpolationUtils.lerp(points[2], points[3], sx);
        
        return InterpolationUtils.lerp(nx0, nx1, sy);
    }
}