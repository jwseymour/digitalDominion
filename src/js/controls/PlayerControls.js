import * as THREE from 'three';

export class PlayerControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        
        // Movement settings
        this.movementSpeed = 100.0;
        this.lookSpeed = 0.002;
        
        // Camera state
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.velocity = new THREE.Vector3();
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDragOn = false;
        
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
        if (document.pointerLockElement === this.domElement) {
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
        }
    }
    
    update(deltaTime) {
        const actualMoveSpeed = this.movementSpeed * deltaTime;
        
        // Calculate movement direction
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        
        // Reset velocity
        this.velocity.set(0, 0, 0);
        
        // Add movement vectors
        if (this.moveForward) this.velocity.add(forward);
        if (this.moveBackward) this.velocity.sub(forward);
        if (this.moveRight) this.velocity.add(right);
        if (this.moveLeft) this.velocity.sub(right);
        if (this.moveUp) this.velocity.y += 1;
        if (this.moveDown) this.velocity.y -= 1;
        
        // Normalize and scale velocity
        if (this.velocity.length() > 0) {
            this.velocity.normalize();
            this.velocity.multiplyScalar(actualMoveSpeed);
            
            // Update camera position
            this.camera.position.add(this.velocity);
        }
    }
    
    dispose() {
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.domElement.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }
}