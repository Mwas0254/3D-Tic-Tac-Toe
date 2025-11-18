// ai-player.js - Dumb AI that picks random available tiles

export class AIPlayer {
    constructor(difficulty = 'random') {
        this.difficulty = difficulty;
    }

    // Get a random move from available tiles
    getRandomMove(occupiedTiles, tilePositionMap) {
        // Get all possible tile names
        const allTiles = Object.keys(tilePositionMap);
        
        // Filter out occupied tiles
        const availableTiles = allTiles.filter(tileName => !occupiedTiles.has(tileName));
        
        if (availableTiles.length === 0) {
            console.log("AI: No available moves!");
            return null;
        }
        
        // Pick a random available tile
        const randomIndex = Math.floor(Math.random() * availableTiles.length);
        const selectedTile = availableTiles[randomIndex];
        
        console.log(`AI selected tile: ${selectedTile} from ${availableTiles.length} available tiles`);
        return selectedTile;
    }

    // Main method to get AI move
    getMove(gameState, tilePositionMap) {
        // For now, just use random moves
        // Later you can add different difficulty levels here
        return this.getRandomMove(gameState.occupiedTiles, tilePositionMap);
    }

    // Optional: Add a method to simulate "thinking" delay
    async getMoveWithDelay(gameState, tilePositionMap, delayMs = 500) {
        // Simulate AI "thinking" time
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.getMove(gameState, tilePositionMap);
    }
}