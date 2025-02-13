import { PlateChunk } from "./PlateChunk";
import { VoronoiPlateChunk } from "./VoronoiPlateChunk";

export class PlateManager {
    constructor(seed, plateSize = 131072, valueCount = 0) {
        this.seed = seed;
        this.plateChunks = new Map();
        this.voronoiChunks = new Map();
        this.plateSize = plateSize;
        this.valueCount = valueCount;
        this.cellSize = this.calculateCellSize(plateSize);
    }

    calculateCellSize(plateSize) {
        // Find the largest power of 2 that divides plateSize into at least 256 cells
        const minCells = 256;
        let cellSize = plateSize;
        while (cellSize > plateSize / minCells) {
            cellSize = cellSize >> 1;
        }
        return cellSize;
    }

    getPlateChunkForPosition(x, z, preCalculatedPlateX = null, preCalculatedPlateZ = null) {
        const plateX = preCalculatedPlateX !== null ? preCalculatedPlateX : Math.floor(x / this.plateSize);
        const plateZ = preCalculatedPlateZ !== null ? preCalculatedPlateZ : Math.floor(z / this.plateSize);
        const key = `${plateX},${plateZ}`;
    
        if (!this.plateChunks.has(key)) {
            const plateChunk = new PlateChunk(
                {x: plateX, z: plateZ}, 
                this.seed, 
                this.plateSize,
                this.valueCount
            );
            plateChunk.generatePoints();
            this.plateChunks.set(key, plateChunk);
        }
    
        return this.plateChunks.get(key);
    }

    getVoronoiChunkForPosition(x, z) {
        const plateX = Math.floor(x / this.plateSize);
        const plateZ = Math.floor(z / this.plateSize);
        const key = `${plateX},${plateZ}`;

        if (!this.voronoiChunks.has(key)) {
            this.generateVoronoiChunk(plateX, plateZ);
        }

        return this.voronoiChunks.get(key);
    }

    generateVoronoiChunk(plateX, plateZ) {
        const points = [];
        
        // Gather points from 3x3 grid of plate chunks
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const plateChunk = this.getPlateChunkForPosition(
                    0, 0,  // These values won't be used
                    plateX + dx,
                    plateZ + dz
                );
                points.push(...plateChunk.points);
            }
        }
    
        // Create and populate VoronoiPlateChunk
        const voronoiChunk = new VoronoiPlateChunk(
            {x: plateX, z: plateZ},
            this.plateSize,
            this.cellSize
        );
    
        this.calculateVoronoiRegions(voronoiChunk, points);
        
        this.voronoiChunks.set(`${plateX},${plateZ}`, voronoiChunk);
    }

    findNearestAndAdjacentPoints(x, z, points) {
        // Sort points by distance
        const sortedPoints = points.map(point => ({
            point,
            distSq: Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2)
        })).sort((a, b) => a.distSq - b.distSq);

        // Get nearest point
        const nearest = sortedPoints[0].point;

        // Get adjacent points (next closest points)
        const adjacent = sortedPoints.slice(1, 4).map(p => p.point);

        return { nearest, adjacent };
    }

    calculateVoronoiRegions(voronoiChunk, points) {
        const cellsPerSide = this.plateSize / voronoiChunk.cellSize;

        for (let cellX = 0; cellX < cellsPerSide; cellX++) {
            for (let cellZ = 0; cellZ < cellsPerSide; cellZ++) {
                const worldX = voronoiChunk.position.x * this.plateSize + cellX * voronoiChunk.cellSize;
                const worldZ = voronoiChunk.position.z * this.plateSize + cellZ * voronoiChunk.cellSize;

                const { nearest, adjacent } = this.findNearestAndAdjacentPoints(
                    worldX + voronoiChunk.cellSize / 2,
                    worldZ + voronoiChunk.cellSize / 2,
                    points
                );

                voronoiChunk.addRegion(cellX, cellZ, nearest, adjacent);
            }
        }
    }

    calculateWorleyValue(x, z) {
        const voronoiChunk = this.getVoronoiChunkForPosition(x, z);
        const region = voronoiChunk.getRegionForPosition(x, z);
        
        if (!region) return { value: 0, nearestPoint: null, values: [] };
    
        // Calculate distance to nearest point (F1)
        const distF1 = Math.sqrt(
            Math.pow(x - region.nearestPoint.x, 2) + 
            Math.pow(z - region.nearestPoint.z, 2)
        );
    
        // Calculate distance to second nearest point (F2)
        // const distF2 = Math.sqrt(
        //     Math.pow(x - region.adjacentPoints[0].x, 2) + 
        //     Math.pow(z - region.adjacentPoints[0].z, 2)
        // );
    
        // Calculate F2-F1
        // const diff = (distF2 - distF1) / (this.plateSize * 0.15);
    
        const a = 4;
        const b = 0.3;
        const c = 1;
    
        const value = c / (1 + Math.exp(-a * (distF1 / (this.plateSize * 0.15) - b)));
    
        return {
            value: 1 - value,
            nearestPoint: region.nearestPoint,
            values: region.nearestPoint.values || []
        };
    }
}