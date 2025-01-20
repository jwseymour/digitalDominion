export class VoronoiPlateChunk {
    constructor(position, size, cellSize) {
        this.position = position;
        this.size = size;
        this.cellSize = cellSize;
        this.regions = new Map();
    }

    addRegion(x, z, nearestPoint, adjacentPoints) {
        const key = `${x},${z}`;
        this.regions.set(key, {
            nearestPoint,
            adjacentPoints
        });
    }

    getRegionForPosition(x, z) {
        const localX = Math.floor((x - this.position.x * this.size) / this.cellSize);
        const localZ = Math.floor((z - this.position.z * this.size) / this.cellSize);
        return this.regions.get(`${localX},${localZ}`);
    }
}