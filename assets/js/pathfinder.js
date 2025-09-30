/**
 * A* Pathfinding Algorithm for Maze Navigation
 * Finds the optimal path from start to goal through the maze
 */

class Pathfinder {
    constructor(maze) {
        this.maze = maze;
        this.width = maze[0].length;
        this.height = maze.length;
    }

    // A* pathfinding algorithm
    findPath(start, goal) {
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        // Initialize scores
        const startKey = this.getKey(start);
        const goalKey = this.getKey(goal);
        
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, goal));
        
        openSet.push({ ...start, key: startKey });

        while (openSet.length > 0) {
            // Find node with lowest fScore
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(openSet[i].key) < fScore.get(openSet[currentIndex].key)) {
                    currentIndex = i;
                }
            }

            const current = openSet.splice(currentIndex, 1)[0];
            closedSet.add(current.key);

            // Check if we reached the goal
            if (current.key === goalKey) {
                return this.reconstructPath(cameFrom, current);
            }

            // Check all neighbors
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = this.getKey(neighbor);
                
                if (closedSet.has(neighborKey)) {
                    continue;
                }

                // Calculate tentative gScore
                const tentativeGScore = gScore.get(current.key) + 1;

                // Check if this path to neighbor is better
                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, goal));

                    // Add to open set if not already there
                    if (!openSet.find(node => node.key === neighborKey)) {
                        openSet.push({ ...neighbor, key: neighborKey });
                    }
                }
            }
        }

        // No path found
        return [];
    }

    // Get valid neighbors (not walls)
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 }, // North
            { dx: 1, dy: 0 },  // East
            { dx: 0, dy: 1 },  // South
            { dx: -1, dy: 0 }  // West
        ];

        for (const dir of directions) {
            const x = node.x + dir.dx;
            const y = node.y + dir.dy;

            // Check bounds and if it's a path (not a wall)
            if (x >= 0 && x < this.width && 
                y >= 0 && y < this.height && 
                this.maze[y][x] === 0) {
                neighbors.push({ x, y });
            }
        }

        return neighbors;
    }

    // Heuristic function (Manhattan distance)
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // Reconstruct path from cameFrom map
    reconstructPath(cameFrom, current) {
        const path = [current];
        
        while (cameFrom.has(current.key)) {
            current = cameFrom.get(current.key);
            path.unshift(current);
        }
        
        return path;
    }

    // Create unique key for a position
    getKey(node) {
        return `${node.x},${node.y}`;
    }

    // Smooth the path for better animation
    smoothPath(path) {
        if (path.length <= 2) return path;

        const smoothed = [path[0]];
        
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const current = path[i];
            const next = path[i + 1];
            
            // Check if we can skip the middle point (diagonal movement)
            const dx1 = current.x - prev.x;
            const dy1 = current.y - prev.y;
            const dx2 = next.x - current.x;
            const dy2 = next.y - current.y;
            
            // If directions are different, keep the point
            if (dx1 !== dx2 || dy1 !== dy2) {
                smoothed.push(current);
            }
        }
        
        smoothed.push(path[path.length - 1]);
        return smoothed;
    }

    // Convert path to pixel coordinates
    pathToPixels(path, cellSize = 10) {
        return path.map(point => ({
            x: point.x * cellSize + cellSize / 2,
            y: point.y * cellSize + cellSize / 2
        }));
    }

    // Find alternative paths (for variety)
    findAlternativePath(start, goal, avoidPath = []) {
        // Temporarily mark avoided path as walls
        const originalMaze = this.maze.map(row => [...row]);
        
        for (const point of avoidPath) {
            if (point.x >= 0 && point.x < this.width && 
                point.y >= 0 && point.y < this.height) {
                this.maze[point.y][point.x] = 1;
            }
        }
        
        const path = this.findPath(start, goal);
        
        // Restore original maze
        this.maze = originalMaze;
        
        return path;
    }

    // Debug method to visualize path
    visualizePath(path) {
        const mazeCopy = this.maze.map(row => [...row]);
        
        for (const point of path) {
            if (point.x >= 0 && point.x < this.width && 
                point.y >= 0 && point.y < this.height) {
                mazeCopy[point.y][point.x] = 2; // Mark path
            }
        }
        
        let output = '';
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (mazeCopy[y][x] === 1) {
                    output += '█'; // Wall
                } else if (mazeCopy[y][x] === 2) {
                    output += '·'; // Path
                } else {
                    output += ' '; // Empty space
                }
            }
            output += '\n';
        }
        console.log(output);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pathfinder;
}