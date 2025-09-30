/**
 * Main Maze Animation Controller
 * Orchestrates maze generation, pathfinding, and character animation
 */

class MazeAnimation {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with id "${canvasId}" not found`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            cellSize: 20,
            mazeWidth: 80,
            mazeHeight: 10,
            animationSpeed: 1,
            showPath: false,
            autoRestart: true,
            restartDelay: 3000,
            ...options
        };
        
        // Animation state
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.animationId = null;
        
        // Components
        this.mazeGenerator = null;
        this.pathfinder = null;
        this.character = null;
        this.path = [];
        this.currentPathIndex = 0;
        
        // Visual settings
        this.colors = {
            wall: '#2c3e50',
            path: '#ecf0f1',
            character: '#000000',
            pathTrail: '#3498db',
            background: '#34495e'
        };
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFpsTime = 0;
        this.fps = 0;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.generateNewMaze();
        this.setupEventListeners();
        this.start();
    }

    setupCanvas() {
        // Set canvas size based on maze dimensions
        const width = this.options.mazeWidth * this.options.cellSize;
        const height = this.options.mazeHeight * this.options.cellSize;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Set CSS size for responsive design
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
    }

    generateNewMaze() {
        // Generate maze
        this.mazeGenerator = new MazeGenerator(
            this.options.mazeWidth, 
            this.options.mazeHeight
        );
        this.maze = this.mazeGenerator.generateMaze();
        
        // Create pathfinder
        this.pathfinder = new Pathfinder(this.maze);
        
        // Get start and end positions
        const start = this.mazeGenerator.getStartPosition();
        const end = this.mazeGenerator.getEndPosition();
        
        // Find path
        this.path = this.pathfinder.findPath(start, end);
        this.path = this.pathfinder.smoothPath(this.path);
        this.path = this.pathfinder.pathToPixels(this.path, this.options.cellSize);
        
        // Create character at start position
        this.character = new Character(
            this.path[0].x, 
            this.path[0].y, 
            this.options.cellSize * 0.8
        );
        this.character.setColor(this.colors.character);
        this.character.setSpeed(this.options.animationSpeed * 0.02);
        
        // Reset path index
        this.currentPathIndex = 0;
        
        console.log(`Generated maze with ${this.path.length} path points`);
    }

    setupEventListeners() {
        // Pause on visibility change (battery saving)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Respect user's motion preferences
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.options.animationSpeed *= 0.5;
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        if (this.isRunning) {
            this.lastTime = performance.now();
        }
    }

    restart() {
        this.stop();
        setTimeout(() => {
            this.generateNewMaze();
            this.start();
        }, 100);
    }

    animate(currentTime = 0) {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
        
        if (this.isPaused) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        // Update character
        this.updateCharacter(deltaTime);
        
        // Draw everything
        this.draw();
        
        // Check if character reached the end
        if (this.currentPathIndex >= this.path.length - 1 && 
            this.character.isAtTarget()) {
            this.handleMazeComplete();
        }
    }

    updateCharacter(deltaTime) {
        if (!this.character || this.path.length === 0) return;
        
        // Update character animation
        this.character.update(deltaTime);
        
        // Check if character needs to move to next path point
        if (this.character.isAtTarget() && 
            this.currentPathIndex < this.path.length - 1) {
            this.currentPathIndex++;
            const nextPoint = this.path[this.currentPathIndex];
            this.character.setTarget(nextPoint.x, nextPoint.y);
        }
    }

    handleMazeComplete() {
        console.log('Maze completed!');
        
        if (this.options.autoRestart) {
            setTimeout(() => {
                this.restart();
            }, this.options.restartDelay);
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        this.drawMaze();
        
        // Draw path trail (optional)
        if (this.options.showPath) {
            this.drawPathTrail();
        }
        
        // Draw character
        if (this.character) {
            this.character.draw(this.ctx);
        }
        
        // Draw debug info (optional)
        if (this.options.debug) {
            this.drawDebugInfo();
        }
    }

    drawMaze() {
        const cellSize = this.options.cellSize;
        
        for (let y = 0; y < this.options.mazeHeight; y++) {
            for (let x = 0; x < this.options.mazeWidth; x++) {
                if (this.maze[y][x] === 1) { // Wall
                    this.ctx.fillStyle = this.colors.wall;
                    this.ctx.fillRect(
                        x * cellSize, 
                        y * cellSize, 
                        cellSize, 
                        cellSize
                    );
                }
            }
        }
    }

    drawPathTrail() {
        if (this.path.length < 2) return;
        
        this.ctx.strokeStyle = this.colors.pathTrail;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        
        for (let i = 1; i <= this.currentPathIndex; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        
        this.ctx.stroke();
    }

    drawDebugInfo() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        this.ctx.fillText(`Path: ${this.currentPathIndex}/${this.path.length}`, 10, 35);
        this.ctx.fillText(`Position: ${Math.round(this.character.x)}, ${Math.round(this.character.y)}`, 10, 50);
    }

    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsTime));
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
    }

    // Public API methods
    setAnimationSpeed(speed) {
        this.options.animationSpeed = speed;
        if (this.character) {
            this.character.setSpeed(speed * 0.02);
        }
    }

    setShowPath(show) {
        this.options.showPath = show;
    }

    setAutoRestart(autoRestart) {
        this.options.autoRestart = autoRestart;
    }

    setCharacterColor(color) {
        this.colors.character = color;
        if (this.character) {
            this.character.setColor(color);
        }
    }

    // Cleanup method
    destroy() {
        this.stop();
        // Remove event listeners if needed
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('maze-canvas');
    if (canvas) {
        window.mazeAnimation = new MazeAnimation('maze-canvas', {
            cellSize: 20,
            mazeWidth: 80,
            mazeHeight: 10,
            animationSpeed: 0.6,
            showPath: false,
            autoRestart: true,
            restartDelay: 3000
        });
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeAnimation;
}