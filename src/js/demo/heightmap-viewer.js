import { PlateManager } from '../engine/world/plate/PlateManager.js';

class HeightmapViewer {
    constructor() {
        this.canvas = document.getElementById('heightmap');
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById('tooltip');
        this.plateManager = null;
        this.size = 131072;
        this.seed = 3;
        this.heightValues = []; // Store height values for tooltip
        this.valueCount = 3; // Number of additional values per point
        
        this.setupControls();
        this.setupTooltip();
        this.generate();
    }

    setupTooltip() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) * (this.canvas.width / rect.width));
            const z = Math.floor((e.clientY - rect.top) * (this.canvas.height / rect.height));
            
            if (x >= 0 && x < this.canvas.width && z >= 0 && z < this.canvas.height) {
                const data = this.heightValues[z][x];
                let tooltipText = `Worley Value: ${data.value.toFixed(3)}\n`;
                data.values.forEach((val, idx) => {
                    tooltipText += `Value ${idx + 1}: ${val.toFixed(3)}\n`;
                });
                this.tooltip.style.display = 'block';
                this.tooltip.style.left = (e.clientX + 10) + 'px';
                this.tooltip.style.top = (e.clientY - 25) + 'px';
                this.tooltip.innerHTML = tooltipText.split('\n').join('<br>');
            }
        });

        this.canvas.addEventListener('mouseout', () => {
            this.tooltip.style.display = 'none';
        });
    }

    setupControls() {
        document.getElementById('generate').addEventListener('click', () => {
            this.seed = parseInt(document.getElementById('seed').value) || 3;
            this.size = parseInt(document.getElementById('size').value) || 131072;
            this.generate();
        });
    }

    generate() {
        const CANVAS_SIZE = 512;
        this.canvas.width = CANVAS_SIZE;
        this.canvas.height = CANVAS_SIZE;
        
        this.plateManager = new PlateManager(this.seed, this.size, this.valueCount);
        const imageData = this.ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
        
        const scaleX = this.size / CANVAS_SIZE;
        const scaleZ = this.size / CANVAS_SIZE;
        
        // Initialize heightValues array
        this.heightValues = Array(CANVAS_SIZE).fill().map(() => Array(CANVAS_SIZE).fill(null));
        
        for (let z = 0; z < CANVAS_SIZE; z++) {
            for (let x = 0; x < CANVAS_SIZE; x++) {
                const worldX = x * scaleX;
                const worldZ = z * scaleZ;
                
                const result = this.plateManager.calculateWorleyValue(worldX, worldZ);
                this.heightValues[z][x] = result;
                
                const brightness = Math.floor(result.value * 255);
                
                const index = (z * CANVAS_SIZE + x) * 4;
                imageData.data[index] = brightness;
                imageData.data[index + 1] = brightness;
                imageData.data[index + 2] = brightness;
                imageData.data[index + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
}

// Initialize the viewer when the page loads
window.addEventListener('load', () => {
    new HeightmapViewer();
});