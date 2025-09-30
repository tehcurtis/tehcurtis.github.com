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
        this.color = '#000000'; // Black
        this.eyeColor = '#ffffff';
        this.shadowColor = 'rgba(0, 0, 0, 0.5)';

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

    // Draw the character on canvas
    draw(ctx) {
        ctx.save();

        // Apply transformations
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        // Draw shadow
        this.drawShadow(ctx);

        // Draw walking person
        this.drawWalkingPerson(ctx);

        ctx.restore();
    }

    // Draw character shadow
    drawShadow(ctx) {
        ctx.fillStyle = this.shadowColor;
        const shadowOffset = 3;
        const bodyWidth = this.size * 0.6;
        const bodyHeight = this.size * 0.8;
        const headSize = this.size * 0.4;

        // Body shadow
        ctx.fillRect(
            -bodyWidth/2 + shadowOffset,
            -bodyHeight/2 + shadowOffset,
            bodyWidth,
            bodyHeight
        );

        // Head shadow
        ctx.fillRect(
            -headSize/2 + shadowOffset,
            -this.size/2 + shadowOffset,
            headSize,
            headSize
        );

        // Leg shadows (with walking animation)
        const legWidth = this.size * 0.15;
        const legHeight = this.size * 0.3;
        const legSpacing = this.size * 0.2;

        const leftLegOffset = this.isMoving ? this.legOffset : 0;
        const rightLegOffset = this.isMoving ? -this.legOffset : 0;
        const leftLegSwing = this.isMoving ? Math.sin(this.walkCycle) * 2 : 0;
        const rightLegSwing = this.isMoving ? -Math.sin(this.walkCycle) * 2 : 0;

        ctx.fillRect(
            -legSpacing/2 - legWidth/2 + leftLegSwing + shadowOffset,
            bodyHeight/2 + leftLegOffset + shadowOffset,
            legWidth,
            legHeight
        );
        ctx.fillRect(
            legSpacing/2 - legWidth/2 + rightLegSwing + shadowOffset,
            bodyHeight/2 + rightLegOffset + shadowOffset,
            legWidth,
            legHeight
        );
    }

    // Draw walking person
    drawWalkingPerson(ctx) {
        const bodyWidth = this.size * 0.6;
        const bodyHeight = this.size * 0.8;
        const headSize = this.size * 0.4;
        const legWidth = this.size * 0.15;
        const legHeight = this.size * 0.3;
        const armWidth = this.size * 0.12;
        const armHeight = this.size * 0.4;

        ctx.fillStyle = this.color;

        // Draw head
        ctx.fillRect(-headSize/2, -this.size/2, headSize, headSize);

        // Draw eyes
        const eyeSize = headSize * 0.2;
        const eyeOffset = headSize * 0.25;
        ctx.fillStyle = this.eyeColor;
        ctx.fillRect(-eyeOffset, -this.size/2 + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(eyeOffset - eyeSize, -this.size/2 + eyeOffset, eyeSize, eyeSize);

        // Draw body
        ctx.fillStyle = this.color;
        ctx.fillRect(-bodyWidth/2, -bodyHeight/2, bodyWidth, bodyHeight);

        // Draw arms (with walking animation)
        const armOffset = this.isMoving ? Math.sin(this.walkCycle) * 2 : 0;
        ctx.fillRect(
            -bodyWidth/2 - armWidth,
            -bodyHeight/2 + armOffset,
            armWidth,
            armHeight
        );
        ctx.fillRect(
            bodyWidth/2,
            -bodyHeight/2 - armOffset,
            armWidth,
            armHeight
        );

        // Draw legs (with walking animation)
        const legSpacing = this.size * 0.2;
        const leftLegOffset = this.isMoving ? this.legOffset : 0;
        const rightLegOffset = this.isMoving ? -this.legOffset : 0;

        // Add horizontal leg swing for more natural walking
        const leftLegSwing = this.isMoving ? Math.sin(this.walkCycle) * 2 : 0;
        const rightLegSwing = this.isMoving ? -Math.sin(this.walkCycle) * 2 : 0;

        // Left leg
        ctx.fillRect(
            -legSpacing/2 - legWidth/2 + leftLegSwing,
            bodyHeight/2 + leftLegOffset,
            legWidth,
            legHeight
        );

        // Right leg
        ctx.fillRect(
            legSpacing/2 - legWidth/2 + rightLegSwing,
            bodyHeight/2 + rightLegOffset,
            legWidth,
            legHeight
        );

        // Draw feet
        const footWidth = legWidth * 1.5;
        const footHeight = legWidth * 0.8;
        ctx.fillRect(
            -legSpacing/2 - footWidth/2 + leftLegSwing,
            bodyHeight/2 + legHeight + leftLegOffset,
            footWidth,
            footHeight
        );
        ctx.fillRect(
            legSpacing/2 - footWidth/2 + rightLegSwing,
            bodyHeight/2 + legHeight + rightLegOffset,
            footWidth,
            footHeight
        );
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