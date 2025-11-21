import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { AIPlayer } from './ai.js';
import { SkinManager } from './skinmanager.js';

// Scene setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100);
camera.position.z = 20;

const container = document.getElementById('gameContainer');

const renderer = new THREE.WebGLRenderer();
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Handle window resize
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener('resize', onWindowResize);

RectAreaLightUniformsLib.init();

const lightcolor1n2 = 0xE8FCFF;
const lightcolor3n4 = 0xFFF5E8;
const lightcolor5 = 0xFFFFFF;
const lightintensity = 100;
const width = 12;
const height = 4;
const light1 = new THREE.PointLight(lightcolor1n2, lightintensity);
const light2 = new THREE.PointLight(lightcolor1n2, lightintensity);
const light3 = new THREE.PointLight(lightcolor3n4, lightintensity);
const light4 = new THREE.PointLight(lightcolor3n4, lightintensity);
const light5 = new THREE.RectAreaLight(lightcolor5, lightintensity, width, height);;
light1.position.set(-5, 5, 10);
light2.position.set(-5, -5, 10);
light3.position.set(5, 5, 10);
light4.position.set(5, -5, 10);
light5.position.set(0, 25, 20);
light5.rotation.x = THREE.MathUtils.degToRad(-90);
scene.add(light1, light2, light3, light4, light5);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxDistance = 25;
controls.minDistance = 20;
controls.enableRotate = true;
controls.enableZoom = true;
controls.minPolarAngle = Math.PI / 2.4;
controls.maxPolarAngle = Math.PI / 1.8;
controls.minAzimuthAngle = -Math.PI / 16;
controls.maxAzimuthAngle = Math.PI / 16;

// Load Bounds GLTF model
/* 
const boundsGltfLoader = new GLTFLoader();
boundsGltfLoader.load('assets/3D models/Bounds (GN).glb', (gltf) => {
    if (!gltf.scene) {
        console.warn('Bounds GLTF model not found or failed to load.');
    }
    const boundsModel = gltf.scene;
    scene.add(boundsModel);
});
*/

// Game state object
const gameState = {
    isPaused: false,
    currentPlayer: 'player1',
    gameActive: true,
    occupiedTiles: new Map(),
    movesCount: 0,
    canPlacePieces: true,
    gameMode: 'pvp', // 'pvp' for player vs player, 'pvc' for player vs computer
    aiThinking: false // Track if AI is currently "thinking"
};

const skinmanager = new SkinManager();
const aiPlayer = new AIPlayer('random');

// Global variables for models
let boundsModel = null;
let tileObjs = [];
let xPieceModel = null;
let oPieceModel = null;
let placedPieces = [];

// GLTF Loader instance
const gltfLoader = new GLTFLoader();

// Load a specific skin
async function loadSkin(skinName) {
    const skin = skinmanager.getSkin(skinName);
    gameState.currentSkin = skinName;
    
    console.log(`Loading skin: ${skin.name}`);
    
    // Clear existing models
    if (boundsModel) scene.remove(boundsModel);
    tileObjs.forEach(tile => scene.remove(tile));
    placedPieces.forEach(piece => scene.remove(piece));
    if (xPieceModel) scene.remove(xPieceModel);
    if (oPieceModel) scene.remove(oPieceModel);
    
    // Reset arrays
    tileObjs = [];
    placedPieces = [];
    
    // Load new models
    await loadBounds(skin.bounds);
    await loadTiles(skin.tiles);
    await loadXPieces(skin.xPiece);
    await loadOPieces(skin.oPiece);
    
    console.log(`Skin "${skin.name}" loaded successfully`);
}

// Individual load functions
function loadBounds(path) {
    return new Promise((resolve) => {
        gltfLoader.load(path, (gltf) => {
            boundsModel = gltf.scene;
            scene.add(boundsModel);
            resolve();
        });
    });
}

function loadTiles(path) {
    return new Promise((resolve) => {
        gltfLoader.load(path, (gltf) => {
            const playTiles = gltf.scene;
            scene.add(playTiles);

            playTiles.traverse((child) => {
                if (child.isMesh) {
                    tileObjs.push(child);
                }
            });
            resolve();
        });
    });
}

function loadXPieces(path) {
    return new Promise((resolve) => {
        gltfLoader.load(path, (gltf) => {
            xPieceModel = gltf.scene;
            scene.add(xPieceModel);
            xPieceModel.position.set(-1, -20, 0); // Hide off-screen
            resolve();
        });
    });
}

function loadOPieces(path) {
    return new Promise((resolve) => {
        gltfLoader.load(path, (gltf) => {
            oPieceModel = gltf.scene;
            scene.add(oPieceModel);
            oPieceModel.position.set(1, -20, 0); // Hide off-screen
            resolve();
        });
    });
}

// Load BG model
/*
const bgGltfLoader = new GLTFLoader();
bgGltfLoader.load('assets/3D models/BG mesh (GN).glb', (gltf) => {
    if (!gltf.scene) {
        console.warn('BG GLTF model not found or failed to load.');
    }
    const bgModel = gltf.scene;
    scene.add(bgModel);
})
*/

// Define updateTurnIndicator BEFORE calling it
function updateTurnIndicator() {
    const player1 = document.getElementById('P1');
    const player2 = document.getElementById('P2');
    
    if (gameState.currentPlayer === 'player1') {
        // Player 1's turn - highlight P1
        player1.style.scale = "1.3";
        player1.style.color = "#71E700FF"; // Bright green
        player1.style.transition = "scale 0.3s ease, color 0.3s ease";
        
        player2.style.scale = "1";
        player2.style.color = "white"; // Dimmed
        player2.style.transition = "scale 0.3s ease, color 0.3s ease";
        
    } else {
        // Player 2's turn - highlight P2
        player1.style.scale = "1";
        player1.style.color = "white"; // Dimmed
        player1.style.transition = "scale 0.3s ease, color 0.3s ease";
        
        player2.style.scale = "1.3";
        player2.style.color = "#0427E7FF"; // Bright blue
        player2.style.transition = "scale 0.3s ease, color 0.3s ease";
    }
}

updateTurnIndicator(); // Set initial turn indicator

// Tile to board position mapping
const tilePositionMap = {
    'T1': { row: 0, col: 0, index: 0 },
    'T2': { row: 0, col: 1, index: 1 },
    'T3': { row: 0, col: 2, index: 2 },
    'T4': { row: 1, col: 0, index: 3 },
    'T5': { row: 1, col: 1, index: 4 },
    'T6': { row: 1, col: 2, index: 5 },
    'T7': { row: 2, col: 0, index: 6 },
    'T8': { row: 2, col: 1, index: 7 },
    'T9': { row: 2, col: 2, index: 8 }
};

// Load Tic Tac Toe Play Tiles GLTF model
/*
const tilesGltfLoader = new GLTFLoader();
tilesGltfLoader.load('assets/3D models/PlayTiles mesh.glb', (gltf) => {
    if (!gltf.scene) {
        console.warn('playTiles GLTF model not found or failed to load.');
    }
    const playTiles = gltf.scene;
    scene.add(playTiles);

    playTiles.traverse((child) => {
        if (child.isMesh) {
            tileObjs.push(child);
            console.log(`Loaded tile object: ${child.name}`);
        }
    });
});
*/

// Load X model
/*
const xPieceModelLoader = new GLTFLoader();
xPieceModelLoader.load('assets/3D models/Xs mesh (GN) 2.glb', (gltf) => {
    if (!gltf.scene) {
        console.warn('X GLTF model not found or failed to load.');
    }
    xPieceModel = gltf.scene;
    scene.add(xPieceModel);
    xPieceModel.position.set(-1, -40, 0);
});
*/

// Load O model
/*
const oPieceModelLoader = new GLTFLoader();
oPieceModelLoader.load('assets/3D models/Os mesh (GN) 2.glb', (gltf) => {
    if (!gltf.scene) {
        console.warn('O GLTF model not found or failed to load.');
    }
    oPieceModel = gltf.scene;
    scene.add(oPieceModel);
    oPieceModel.position.set(1, -40, 0);
});
*/

// Button functionality
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const restartButton = document.getElementById('restartButton');
const pauseMenu = document.getElementById('pauseMenu');

// Pause button
pauseButton.addEventListener('click', () => {
    gameState.canPlacePieces = false;
    controls.enabled = false;
    pauseMenu.style.opacity = '1';
    pauseMenu.style.display = 'block';
    resumeButton.style.pointerEvents = 'auto';
    gameState.isPaused = true;
});

// Resume/Restart button
resumeButton.addEventListener('click', () => {
    if (!gameState.gameActive) {
        resetGame();
    } else {
        setTimeout(() => gameState.canPlacePieces = true, 250);
        controls.enabled = true;
        pauseMenu.style.opacity = '0';
        pauseMenu.style.display = 'none';
        resumeButton.style.pointerEvents = 'none';
        gameState.isPaused = false;
    }
});

// Restart button
restartButton.addEventListener('click', resetGame);

const modeButton = document.getElementById('modeButton');

// Initializing game mode
initializeGameMode();

// Game mode switch functionality
modeButton.addEventListener('click', switchGameMode);

function switchGameMode() {
    if (gameState.gameActive && gameState.movesCount > 0) {
        console.log("Cannot switch mode during active game. Reset first.");
        return;
    }
    
    if (gameState.gameMode === 'pvp') {
        // Switch to Player vs Computer
        gameState.gameMode = 'pvc';
        modeButton.textContent = "VS PLAYER";
        modeButton.classList.remove('pvp');
        modeButton.classList.add('pvc');
        
        // Update player 2 label
        const player2 = document.getElementById('P2');
        player2.textContent = "COMP - O";
        
        console.log("Switched to Player vs Computer mode");
    } else {
        // Switch to Player vs Player
        gameState.gameMode = 'pvp';
        modeButton.textContent = "VS COMPUTER";
        modeButton.classList.remove('pvc');
        modeButton.classList.add('pvp');
        
        // Update player 2 label
        const player2 = document.getElementById('P2');
        player2.textContent = "P2 - O";
        
        console.log("Switched to Player vs Player mode");
    }
    
    // Update turn indicator to reflect current state
    updateTurnIndicator();
}

// Mouse click functionality
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    if (gameState.isPaused || !gameState.gameActive || !gameState.canPlacePieces || gameState.aiThinking) return;
    
    // In PvC mode, only allow clicks when it's player's turn
    if (gameState.gameMode === 'pvc' && gameState.currentPlayer !== 'player1') return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tileObjs);

    if (intersects.length > 0) {
        const intersectedTile = intersects[0].object;
        const tileName = intersectedTile.name;

        if (gameState.occupiedTiles.has(tileName)) {
            console.log(`Tile ${tileName} is already occupied.`);
            return;
        }
        
        placePiece(intersectedTile, tileName);
        
        // If in PvC mode and game is still active, trigger AI move
        if (gameState.gameMode === 'pvc' && gameState.gameActive && gameState.currentPlayer === 'player2') {
            setTimeout(() => makeAIMove(), 500); // Small delay before AI moves
        }
    }
}

container.addEventListener('click', onMouseClick, false);

// AI move function
async function makeAIMove() {
    if (!gameState.gameActive || gameState.isPaused || gameState.currentPlayer !== 'player2') return;
    
    gameState.aiThinking = true;
    console.log("AI is thinking...");
    
    try {
        // Get AI move with a small delay to simulate thinking
        const aiMoveTileName = await aiPlayer.getMoveWithDelay(gameState, tilePositionMap, 100);
        
        if (aiMoveTileName) {
            // Find the tile object by name
            const aiTile = tileObjs.find(tile => tile.name === aiMoveTileName);
            if (aiTile) {
                placePiece(aiTile, aiMoveTileName);
            }
        }
    } catch (error) {
        console.error("AI move error:", error);
    } finally {
        gameState.aiThinking = false;
    }
}

function placePiece(intersectedTile, tileName) {
    const pieceClone = gameState.currentPlayer === 'player1' 
        ? xPieceModel.clone() 
        : oPieceModel.clone();   

    pieceClone.position.copy(intersectedTile.position);
    scene.add(pieceClone);
    placedPieces.push(pieceClone);

    gameState.occupiedTiles.set(tileName, gameState.currentPlayer);
    gameState.movesCount++;

    console.log(`${gameState.currentPlayer} placed piece on ${tileName}`);

    const winner = checkWinCondition();
    if (winner) {
        endGame(winner);
        return;
    }

    if (gameState.movesCount === 9) {
        endGame('draw');
        return;
    }

    // Switch players
    gameState.currentPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';
    
    // Update the turn indicator for the NEXT player
    updateTurnIndicator();
}

function checkWinCondition() {
    const board = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
    ];

    for (const [tileName, player] of gameState.occupiedTiles) {
        const position = tilePositionMap[tileName];
        if (position) {
            board[position.row][position.col] = player;
        }
    }

    const winConditions = [
        [[0,0], [0,1], [0,2]],
        [[1,0], [1,1], [1,2]],
        [[2,0], [2,1], [2,2]],
        [[0,0], [1,0], [2,0]],
        [[0,1], [1,1], [2,1]],
        [[0,2], [1,2], [2,2]],
        [[0,0], [1,1], [2,2]],
        [[0,2], [1,1], [2,0]]
    ];

    for (const condition of winConditions) {
        const [a, b, c] = condition;
        const playerA = board[a[0]][a[1]];
        const playerB = board[b[0]][b[1]];
        const playerC = board[c[0]][c[1]];

        if (playerA && playerA === playerB && playerB === playerC) {
            return playerA;
        }
    }

    return null;
}

function endGame(result) {
    gameState.gameActive = false;
    gameState.aiThinking = false;
    
    const pauseMenu = document.getElementById('pauseMenu');
    const message = document.getElementById('Message');
    const resumeButton = document.getElementById('resumeButton');
    
    pauseMenu.style.opacity = '1';
    pauseMenu.style.display = 'block';
    resumeButton.style.pointerEvents = 'auto';
    resumeButton.textContent = "Restart Game";
    
    if (result === 'player1') {
        message.textContent = "Player 1 Wins!";
        console.log("Player 1 wins!");
    } else if (result === 'player2') {
        if (gameState.gameMode === 'pvc') {
            message.textContent = "Computer Wins!";
            console.log("Computer wins!");
        } else {
            message.textContent = "Player 2 Wins!";
            console.log("Player 2 wins!");
        }
    } else {
        message.textContent = "It's a Draw!";
        console.log("It's a draw!");
    }
    
    controls.enabled = false;
}

async function resetGame() {

    // Get random skin
    const randomSkin = skinmanager.getRandomSkin();
    await loadSkin(randomSkin);

    placedPieces.forEach(piece => {
        scene.remove(piece);
    });
    placedPieces = [];

    gameState.occupiedTiles.clear();
    gameState.movesCount = 0;
    gameState.currentPlayer = 'player1';
    gameState.gameActive = true;
    gameState.isPaused = false;
    gameState.canPlacePieces = false;
    gameState.aiThinking = false;

    const pauseMenu = document.getElementById('pauseMenu');
    const message = document.getElementById('Message');
    const resumeButton = document.getElementById('resumeButton');

    // Update turn indicator to show Player 1's turn
    updateTurnIndicator();

    pauseMenu.style.opacity = '0';
    pauseMenu.style.display = 'none';
    message.textContent = "Game Paused";
    resumeButton.textContent = "Resume";
    resumeButton.style.pointerEvents = 'none';

    // Reset camera position and controls
    camera.position.set(0, 0, 20); // Reset to initial position
    camera.lookAt(0, 0, 0); // Look at center of scene
    controls.reset(); // Reset OrbitControls to initial state
    controls.enabled = false;
    
    setTimeout(() => {
        controls.enabled = true;
        gameState.canPlacePieces = true;

        // If in PvC mode and AI goes first, trigger AI move
        if (gameState.gameMode === 'pvc' && gameState.currentPlayer === 'player2') {
            setTimeout(() => makeAIMove(), 500);
        }
    }, 250);

    console.log("Game reset!");
}

loadSkin('classic');

// Initialize the mode button on game start
function initializeGameMode() {
    // Set initial button state
    if (gameState.gameMode === 'pvp') {
        modeButton.textContent = "VS COMPUTER";
        modeButton.classList.add('pvp');
    } else {
        modeButton.textContent = "VS PLAYER";
        modeButton.classList.add('pvc');
    }
}

// Animation loop
function animate() {
    renderer.render(scene, camera);
    controls.update();
}
renderer.setAnimationLoop(animate);