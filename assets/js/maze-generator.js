/**
 * Maze Generator using Recursive Backtracking Algorithm
 * Creates a perfect maze with one unique path between any two points
 */

class MazeGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.maze = [];
        this.visited = [];
        this.stack = [];
        
        // Initialize maze with walls (1 = wall, 0 = path)
        this.initializeMaze();
    }

    initializeMaze() {
        // Create a grid where all cells are walls initially
        for (let y = 0; y < this.height; y++) {
            this.maze[y] = [];
            this.visited[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.maze[y][x] = 1; // Start with all walls
                this.visited[y][x] = false;
            }
        }
    }

    generateMaze(startX = 1, startY = 1) {
        // Ensure start position is valid (odd coordinates for proper maze structure)
        startX = Math.max(1, Math.min(startX, this.width - 2));
        startY = Math.max(1, Math.min(startY, this.height - 2));
        
        // Mark starting cell as path
        this.maze[startY][startX] = 0;
        this.visited[startY][startX] = true;
        
        // Add starting cell to stack
        this.stack.push({ x: startX, y: startY });
        
        // Generate maze using recursive backtracking
        while (this.stack.length > 0) {
            const current = this.stack[this.stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y);
            
            if (neighbors.length > 0) {
                // Choose random neighbor
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Remove wall between current and next cell
                this.removeWallBetween(current, next);
                
                // Mark next cell as visited and add to stack
                this.maze[next.y][next.x] = 0;
                this.visited[next.y][next.x] = true;
                this.stack.push(next);
            } else {
                // Backtrack
                this.stack.pop();
            }
        }
        
        // Ensure start and end points are accessible
        this.ensureStartEndAccessible();
        
        return this.maze;
    }

    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -2 }, // North
            { dx: 2, dy: 0 },  // East
            { dx: 0, dy: 2 },  // South
            { dx: -2, dy: 0 }  // West
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            // Check bounds and if unvisited
            if (nx > 0 && nx < this.width - 1 && 
                ny > 0 && ny < this.height - 1 && 
                !this.visited[ny][nx]) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        
        return neighbors;
    }

    removeWallBetween(current, next) {
        // Calculate wall position between current and next cell
        const wallX = current.x + (next.x - current.x) / 2;
        const wallY = current.y + (next.y - current.y) / 2;
        
        // Remove the wall
        this.maze[wallY][wallX] = 0;
    }

    ensureStartEndAccessible() {
        // Ensure right edge (start) has an entrance
        const rightY = Math.floor(this.height / 2);
        if (rightY > 0 && rightY < this.height - 1) {
            this.maze[rightY][this.width - 1] = 0;
            this.maze[rightY][this.width - 2] = 0;
        }
        
        // Ensure left edge (end) has an exit
        const leftY = Math.floor(this.height / 2);
        if (leftY > 0 && leftY < this.height - 1) {
            this.maze[leftY][0] = 0;
            this.maze[leftY][1] = 0;
        }
    }

    // Get maze as a 2D array (1 = wall, 0 = path)
    getMaze() {
        return this.maze;
    }

    // Get start and end positions
    getStartPosition() {
        return { x: this.width - 2, y: Math.floor(this.height / 2) };
    }

    getEndPosition() {
        return { x: 1, y: Math.floor(this.height / 2) };
    }

    // Convert maze to pixel coordinates for rendering
    getPixelMaze(cellSize = 10) {
        const pixelWidth = this.width * cellSize;
        const pixelHeight = this.height * cellSize;
        const pixelMaze = [];
        
        for (let y = 0; y < pixelHeight; y++) {
            pixelMaze[y] = [];
            for (let x = 0; x < pixelWidth; x++) {
                const cellX = Math.floor(x / cellSize);
                const cellY = Math.floor(y / cellSize);
                pixelMaze[y][x] = this.maze[cellY][cellX];
            }
        }
        
        return pixelMaze;
    }

    // Debug method to print maze to console
    printMaze() {
        let output = '';
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                output += this.maze[y][x] === 1 ? '█' : ' ';
            }
            output += '\n';
        }
        console.log(output);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeGenerator;
}