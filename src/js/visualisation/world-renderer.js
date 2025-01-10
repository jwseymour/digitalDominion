import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PlayerControls } from '../controls/PlayerControls.js';

export class WorldRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.chunks = new Map();
        this.clock = new THREE.Clock();
        
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        
        // Start render loop
        this.animate();
    }

    setupCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 20000);
        this.camera.position.set(500, 500, 500);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', () => {
            const aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    setupLights() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Directional light for shadows
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(500, 1000, 500);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
    }

    setupControls() {
        this.controls = new PlayerControls(this.camera, this.renderer.domElement);
    }

    renderChunk(chunk, resolution = 255) {
        const chunkKey = `${chunk.position.x},${chunk.position.z}`;
        if (this.chunks.has(chunkKey)) {
            this.scene.remove(this.chunks.get(chunkKey));
        }
    
        // Create geometry with specified resolution
        const geometry = new THREE.PlaneGeometry(
            chunk.size, // chunk size
            chunk.size,
            resolution,
            resolution
        );
    
        // Update vertices based on terrain height
        const positions = geometry.attributes.position.array;
        const stepSize = 256 / resolution;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = Math.floor((i / 3) % (resolution + 1)) * stepSize;
            const z = Math.floor((i / 3) / (resolution + 1)) * stepSize;
            
            // Sample terrain height
            const terrainX = Math.min(Math.floor(x), 255);
            const terrainZ = Math.min(Math.floor(z), 255);
            
            positions[i] = x - 128;     // Center the chunk around origin
            positions[i + 1] = chunk.terrain[terrainX + terrainZ * 256];
            positions[i + 2] = z - 128; // Center the chunk around origin
        }
        
        geometry.computeVertexNormals();
    
        // Create material and add colors
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: true
        });
    
        // Add colors based on height and climate
        const colors = new Float32Array(positions.length);
        for (let i = 0; i < positions.length; i += 3) {
            const x = Math.floor((i / 3) % (resolution + 1)) * stepSize;
            const z = Math.floor((i / 3) / (resolution + 1)) * stepSize;
            
            const terrainX = Math.min(Math.floor(x), 255);
            const terrainZ = Math.min(Math.floor(z), 255);
            
            const height = chunk.terrain[terrainX + terrainZ * 256];
            const temperature = chunk.climate.temperature[terrainX + terrainZ * 256];
            const rainfall = chunk.climate.rainfall[terrainX + terrainZ * 256];
    
            const color = this.calculateTerrainColor(height, temperature, rainfall);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
        // Create and position mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (chunk.position.x * 256) - 128,
            0,
            (chunk.position.z * 256) - 128
        );
        mesh.receiveShadow = true;
        mesh.castShadow = true;
    
        this.scene.add(mesh);
        this.chunks.set(chunkKey, mesh);
    }
    
    removeChunk(chunkKey) {
        if (this.chunks.has(chunkKey)) {
            const mesh = this.chunks.get(chunkKey);
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.chunks.delete(chunkKey);
        }
    }

    clearChunks() {
        for (const [chunkKey, mesh] of this.chunks) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        this.chunks.clear();
    }

    calculateTerrainColor(height, temperature, rainfall) {
        // Base colors
        const deepWaterColor = new THREE.Color(0x000033);  // Deep ocean blue
        const shallowWaterColor = new THREE.Color(0x0066ff);  // Shallow water blue
        const sandColor = new THREE.Color(0xc2b280);     // Beige for beaches
        const grassColor = new THREE.Color(0x567d46);    // Green for lowlands
        const forestColor = new THREE.Color(0x2d4c1e);   // Dark green for forests
        const rockColor = new THREE.Color(0x8b8b7a);     // Warm grey for hills
        const brownRockColor = new THREE.Color(0x3d2b23); // Darker brown for mountains
        const snowColor = new THREE.Color(0xffffff);     // White for peaks
    
        // Water depth coloring
        if (height < 0) {
            const depthFactor = Math.min(1, Math.abs(height) / 100);
            return new THREE.Color().lerpColors(
                shallowWaterColor,
                deepWaterColor,
                depthFactor
            );
        }
    
        if (height < 2) return sandColor;
    
        // For lower elevations (grass/forest to rocky hills)
        let baseColor = new THREE.Color().lerpColors(
            grassColor,
            rockColor,
            Math.min(1, height / 80)
        );
    
        // Forest coverage based on climate
        if (height > 2 && height < 100) {
            const forestSuitability = (rainfall - 500) / 1500;
            const temperatureSuitability = Math.max(0, (temperature - 0) / 20);
            const forestFactor = Math.min(1, Math.max(0, forestSuitability * temperatureSuitability));
            
            if (forestFactor > 0.2) {
                baseColor.lerp(forestColor, forestFactor);
            }
        }
    
        // For higher elevations (rocky hills to mountains to snow)
        if (height > 120) {
            const mountainProgress = (height - 120) / 180;
            
            // Calculate snow line based on temperature and rainfall
            const snowLine = Math.max(0.6,  // Lowered from 0.7 to allow more snow
                0.7 + (temperature / 40) +   // Reduced from 0.8 for more snow coverage
                (rainfall / 4000)
            );
            
            if (mountainProgress < snowLine) {
                // Hills to darker mountain rock
                baseColor = new THREE.Color().lerpColors(
                    rockColor,
                    brownRockColor,
                    mountainProgress / snowLine
                );
            } else {
                // Ensure peaks get snowy
                const snowProgress = (mountainProgress - snowLine) / (1 - snowLine);
                const snowIntensity = Math.max(0.3,  // Minimum snow intensity for high peaks
                    1 - (temperature / 20) -
                    (rainfall / 2000)
                );
                
                // Force more snow at very high elevations
                const heightSnowBoost = Math.max(0, (height - 250) / 50);
                const finalSnowIntensity = Math.min(1, snowIntensity + heightSnowBoost);
                
                baseColor = new THREE.Color().lerpColors(
                    brownRockColor,
                    snowColor,
                    Math.min(1, snowProgress * finalSnowIntensity)
                );
            }
        }
    
        // Additional climate-based snow for very cold regions
        if (temperature < 0 && height > 150) {
            const coldSnowFactor = Math.min(
                Math.abs(temperature) / 15,  // Increased from 20 for more snow
                (height - 150) / 100
            );
            baseColor = new THREE.Color().lerpColors(
                baseColor,
                snowColor,
                Math.min(0.9, coldSnowFactor)  // Increased from 0.8 for whiter snow
            );
        }
    
        return baseColor;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update(this.clock.getDelta());
        
        // Notify about camera position changes
        if (this.onCameraMove) {
            this.onCameraMove(this.camera.position);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}