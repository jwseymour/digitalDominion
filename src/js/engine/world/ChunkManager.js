import * as THREE from 'three';

export class ChunkManager {
    constructor(worldGenerator, worldRenderer) {
        this.worldGenerator = worldGenerator;
        this.worldRenderer = worldRenderer;
        this.loadedChunks = new Map();
        this.chunkLoadQueue = [];
        this.lastPlayerChunk = { x: 0, z: 0 };
        
        // Increased LOD settings with larger distances
        this.lodLevels = {
            HIGH: { distance: 750, resolution: 255 },
            MEDIUM: { distance: 1500, resolution: 127 },
            LOW: { distance: 3000, resolution: 63 }
        };
    }

    update(playerPosition) {
        const currentChunkX = Math.floor(playerPosition.x / 256);
        const currentChunkZ = Math.floor(playerPosition.z / 256);

        if (currentChunkX !== this.lastPlayerChunk.x || 
            currentChunkZ !== this.lastPlayerChunk.z) {
            
            this.updateChunks(currentChunkX, currentChunkZ, playerPosition);
            this.lastPlayerChunk = { x: currentChunkX, z: currentChunkZ };
        }

        this.processLoadQueue();
    }

    updateChunks(centerX, centerZ, playerPosition) {
        const chunksToLoad = [];
        const viewDistance = this.lodLevels.LOW.distance;
        const chunkRadius = Math.ceil(viewDistance / 256) + 1;
        
        // Check existing chunks for LOD updates
        for (const [key, chunkData] of this.loadedChunks) {
            const [x, z] = key.split(',').map(Number);
            const chunkCenter = new THREE.Vector3(
                x * 256 + 128,
                0,
                z * 256 + 128
            );
            
            const distance = playerPosition.distanceTo(chunkCenter);
            const newLodLevel = this.getLODLevel(distance);
            
            // If distance exceeds view distance, unload the chunk
            if (distance > viewDistance) {
                this.unloadChunk(x, z);
            }
            // If LOD level changed, queue for update
            else if (newLodLevel && newLodLevel !== chunkData.lodLevel) {
                chunksToLoad.push({
                    x,
                    z,
                    distance,
                    lodLevel: newLodLevel,
                    needsUpdate: true
                });
            }
        }
    
        // Gather new chunks to load
        for (let x = -chunkRadius; x <= chunkRadius; x++) {
            for (let z = -chunkRadius; z <= chunkRadius; z++) {
                const chunkX = centerX + x;
                const chunkZ = centerZ + z;
                const chunkKey = `${chunkX},${chunkZ}`;
                
                // Skip if chunk is already queued for update
                if (chunksToLoad.some(chunk => `${chunk.x},${chunk.z}` === chunkKey)) {
                    continue;
                }
    
                const chunkCenter = new THREE.Vector3(
                    chunkX * 256 + 128,
                    0,
                    chunkZ * 256 + 128
                );
                
                const distance = playerPosition.distanceTo(chunkCenter);
                const lodLevel = this.getLODLevel(distance);
                
                if (lodLevel && !this.loadedChunks.has(chunkKey)) {
                    chunksToLoad.push({
                        x: chunkX,
                        z: chunkZ,
                        distance,
                        lodLevel,
                        needsUpdate: false
                    });
                }
            }
        }
    
        // Sort chunks by priority (updates first, then by distance and view direction)
        const viewDirection = this.worldRenderer.camera.getWorldDirection(new THREE.Vector3());
        chunksToLoad.forEach(chunk => {
            const chunkDirection = new THREE.Vector3(
                chunk.x * 256 + 128 - playerPosition.x,
                0,
                chunk.z * 256 + 128 - playerPosition.z
            ).normalize();
            chunk.viewPriority = chunkDirection.dot(viewDirection);
        });
    
        chunksToLoad.sort((a, b) => {
            // Prioritize LOD updates
            if (a.needsUpdate !== b.needsUpdate) {
                return a.needsUpdate ? -1 : 1;
            }
            // Then by view direction
            if (Math.abs(a.viewPriority - b.viewPriority) > 0.2) {
                return b.viewPriority - a.viewPriority;
            }
            // Finally by distance
            return a.distance - b.distance;
        });
    
        // Clear and refill the queue
        this.chunkLoadQueue = chunksToLoad.map(chunk => ({
            x: chunk.x,
            z: chunk.z,
            lodLevel: chunk.lodLevel
        }));
    }
    
    loadChunk(x, z, lodLevel) {
        const chunkKey = `${x},${z}`;
        const chunk = this.worldGenerator.getChunk(x, z);
        const resolution = this.lodLevels[lodLevel].resolution;
        
        // If chunk exists but LOD changed, remove old version
        if (this.loadedChunks.has(chunkKey)) {
            this.worldRenderer.removeChunk(chunkKey);
        }
        
        this.worldRenderer.renderChunk(chunk, resolution);
        this.loadedChunks.set(chunkKey, { chunk, lodLevel });
    }

    getLODLevel(distance) {
        if (distance <= this.lodLevels.HIGH.distance) return 'HIGH';
        if (distance <= this.lodLevels.MEDIUM.distance) return 'MEDIUM';
        if (distance <= this.lodLevels.LOW.distance) return 'LOW';
        return null;
    }

    queueChunkLoad(x, z, lodLevel) {
        this.chunkLoadQueue.push({ x, z, lodLevel });
    }

    processLoadQueue() {
        // Process more chunks per frame for smoother loading
        const MAX_CHUNKS_PER_FRAME = 4;
        
        for (let i = 0; i < MAX_CHUNKS_PER_FRAME && this.chunkLoadQueue.length > 0; i++) {
            const { x, z, lodLevel } = this.chunkLoadQueue.shift();
            this.loadChunk(x, z, lodLevel);
        }
    }

    unloadChunk(x, z) {
        const chunkKey = `${x},${z}`;
        if (this.loadedChunks.has(chunkKey)) {
            this.worldRenderer.removeChunk(chunkKey);
            this.loadedChunks.delete(chunkKey);
        }
    }
}