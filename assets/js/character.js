/**
 * Character Animation System for Maze Navigation
 * Handles the block figure's movement, appearance, and animation states
 */

class Character {
    constructor(x, y, size = 8) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = size;
        this.speed = 0.03; // Movement speed (0-1)
        this.animationSpeed = 0.1;

        // Animation states
        this.isMoving = false;
        this.direction = 'right';
        this.bounceOffset = 0;
        this.rotation = 0;
        this.scale = 1;
        this.walkCycle = 0;
        this.legOffset = 0;

        // Visual properties
        this.color = '#ff3d81'; // Hot magenta
        this.eyeColor = '#0b0e16';
        this.accentColor = '#b6ff2e';

        // Personality traits
        this.personality = {
            bounceIntensity: 0.3,
            rotationSpeed: 0.02,
            scaleVariation: 0.1
        };
    }

    // Update character position and animation
    update(deltaTime) {
        this.updateMovement(deltaTime);
        this.updateAnimation(deltaTime);
    }

    // Smooth movement towards target position
    updateMovement(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.5) {
            this.isMoving = true;

            // Update direction based on movement
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }

            // Smooth interpolation
            const moveSpeed = this.speed * deltaTime;
            this.x += dx * moveSpeed;
            this.y += dy * moveSpeed;
        } else {
            this.isMoving = false;
            this.x = this.targetX;
            this.y = this.targetY;
        }
    }

    // Update animation effects
    updateAnimation(deltaTime) {
        // Walking animation when moving
        if (this.isMoving) {
            this.walkCycle += this.animationSpeed * deltaTime * 0.5; // Slower walk cycle
            this.bounceOffset += this.animationSpeed * deltaTime;
            this.legOffset = Math.sin(this.walkCycle) * 4; // Increased leg movement range
        } else {
            this.bounceOffset *= 0.9; // Dampen bounce when stopped
            this.legOffset *= 0.9; // Dampen leg movement
        }

        // Subtle rotation
        // this.rotation += this.personality.rotationSpeed * deltaTime;

        // Scale variation
        this.scale = 1 + Math.sin(this.bounceOffset) * this.personality.scaleVariation;
    }

    // Set target position for movement
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    // Pixel sprite frames on an 8x8 grid, facing right.
    // '#' body, 'o' visor, '+' accent feet, '.' transparent
    static SPRITES = {
        stand: [
            '..####..',
            '.######.',
            '.###oo#.',
            '.######.',
            '..####..',
            '..#..#..',
            '..#..#..',
            '..+..+..'
        ],
        step: [
            '..####..',
            '.######.',
            '.###oo#.',
            '.######.',
            '..####..',
            '..#..#..',
            '.##..##.',
            '.+....+.'
        ]
    };

    // Draw the character on canvas
    draw(ctx) {
        const frames = Character.SPRITES;
        const useStep = this.isMoving && Math.floor(this.walkCycle / Math.PI) % 2 === 0;
        const sprite = useStep ? frames.step : frames.stand;

        const px = this.size / 8; // sprite pixel size; full 8x8 sprite spans this.size
        const flip = this.direction === 'left' ? -1 : 1;
        // Snap to the pixel grid so the sprite stays crisp
        const originX = Math.round(this.x - 4 * px);
        const originY = Math.round(this.y - 4 * px);

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = sprite[row][flip === -1 ? 7 - col : col];
                if (cell === '.') continue;
                ctx.fillStyle = cell === '#' ? this.color
                    : cell === 'o' ? this.eyeColor
                    : this.accentColor;
                ctx.fillRect(
                    originX + Math.round(col * px),
                    originY + Math.round(row * px),
                    Math.ceil(px),
                    Math.ceil(px)
                );
            }
        }
    }

    // Utility function to darken colors
    darkenColor(color, factor) {
        // Simple color darkening for hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
            const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
            const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
            return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        }
        return color;
    }

    // Get current position
    getPosition() {
        return { x: this.x, y: this.y };
    }

    // Check if character is at target
    isAtTarget() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        return Math.sqrt(dx * dx + dy * dy) < 0.5;
    }

    // Set character color
    setColor(color) {
        this.color = color;
    }

    // Set movement speed
    setSpeed(speed) {
        this.speed = Math.max(0.01, Math.min(1, speed));
    }

    // Reset character to initial state
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.bounceOffset = 0;
        this.rotation = 0;
        this.scale = 1;
        this.walkCycle = 0;
        this.legOffset = 0;
    }

    // Get character bounds for collision detection
    getBounds() {
        return {
            left: this.x - this.size/2,
            right: this.x + this.size/2,
            top: this.y - this.size/2,
            bottom: this.y + this.size/2
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Character;
}