import * as THREE from 'three';

export class PlayerControls {
    constructor(camera, domElement, worldRenderer) {
        this.camera = camera;
        this.domElement = domElement;
        this.worldRenderer = worldRenderer;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.boost = false;
        this.topDown = false;
        
        // Movement settings
        this.baseSpeed = 300.0;
        this.boostMultiplier = 3.0;
        this.lookSpeed = 0.002;
        this.minHeight = 200;  // Minimum height from terrain
        
        // Camera state
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        
        // Bind methods
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        
        // Add event listeners
        this.domElement.addEventListener('mousemove', this.onMouseMove);
        this.domElement.addEventListener('mousedown', this.onMouseDown);
        this.domElement.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        
        // Lock pointer on click
        this.domElement.addEventListener('click', () => {
            this.domElement.requestPointerLock();
        });
    }
    
    onMouseMove(event) {
        if (document.pointerLockElement === this.domElement && !this.topDown) {
            this.euler.setFromQuaternion(this.camera.quaternion);
            
            this.euler.y -= event.movementX * this.lookSpeed;
            this.euler.x -= event.movementY * this.lookSpeed;
            
            // Limit vertical look angle
            this.euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.euler.x));
            
            this.camera.quaternion.setFromEuler(this.euler);
        }
    }

    onMouseDown() {
        this.mouseDragOn = true;
    }
    
    onMouseUp() {
        this.mouseDragOn = false;
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                this.moveUp = true;
                break;
            case 'ShiftLeft':
                this.moveDown = true;
                break;
            case 'KeyB':
                this.boost = true;
                break;
            case 'KeyT':
                this.toggleTopDown();
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'Space':
                this.moveUp = false;
                break;
            case 'ShiftLeft':
                this.moveDown = false;
                break;
            case 'KeyB':
                this.boost = false;
                break;
        }
    }
    
    toggleTopDown() {
        this.topDown = !this.topDown;
        if (this.topDown) {
            this.euler.x = -Math.PI/2;  // Look straight down
            this.euler.y = 0;
            this.camera.quaternion.setFromEuler(this.euler);
        }
    }
    
    update(deltaTime) {
        const movementSpeed = this.baseSpeed * (this.boost ? this.boostMultiplier : 1) * deltaTime;
        
        // Calculate movement direction
        const movement = new THREE.Vector3(0, 0, 0);
        
        if (this.topDown) {
            // Grid-aligned movement in top-down view
            if (this.moveForward) movement.z -= 1;
            if (this.moveBackward) movement.z += 1;
            if (this.moveRight) movement.x += 1;
            if (this.moveLeft) movement.x -= 1;
        } else {
            // Camera-relative movement in normal view
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            
            if (this.moveForward) movement.add(forward);
            if (this.moveBackward) movement.sub(forward);
            if (this.moveRight) movement.add(right);
            if (this.moveLeft) movement.sub(right);
        }
        
        // Vertical movement is always absolute
        if (this.moveUp) movement.y += 1;
        if (this.moveDown) movement.y -= 1;
        
        if (movement.length() > 0) {
            movement.normalize();
            movement.multiplyScalar(movementSpeed);
            
            const newPosition = this.camera.position.clone().add(movement);
            
            newPosition.y = Math.max(newPosition.y, this.minHeight);
            
            this.camera.position.copy(newPosition);
        }
    }
}