export class VoronoiPlateChunk {
    constructor(position, size) {
        this.position = position;
        this.size = size;
        this.regions = new Map(); // Map of regions keyed by cell coordinates
    }

    addRegion(x, z, nearestPoint, adjacentPoints) {
        const key = `${x},${z}`;
        this.regions.set(key, {
            nearestPoint,
            adjacentPoints
        });
    }

    getRegionForPosition(x, z) {
        // Convert world coordinates to local cell coordinates
        const localX = Math.floor((x - this.position.x * this.size) / 256);
        const localZ = Math.floor((z - this.position.z * this.size) / 256);
        return this.regions.get(`${localX},${localZ}`);
    }
}