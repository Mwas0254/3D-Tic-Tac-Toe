import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
const boundsGltfLoader = new GLTFLoader();
boundsGltfLoader.load('assets/3D models/Bounds.glb', (gltf) => {
    if (!gltf.scene) {
        console.warn('Bounds GLTF model not found or failed to load.');
    }
    const boundsModel = gltf.scene;
    scene.add(boundsModel);
});

// Game state object
const gameState = {
    isPaused: false,
    currentPlayer: 'player1',
    gameActive: true,
    occupiedTiles: new Map(),
    movesCount: 0,
    canPlacePieces: true
};

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

let tileObjs = [];
let placedPieces = [];

// Load Tic Tac Toe Play Tiles GLTF model
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

let xPieceModel = null;
let oPieceModel = null;

// Load X model
const xPieceModelLoader = new GLTFLoader();
xPieceModelLoader.load('assets/3D models/Xs mesh.glb', (gltf) => {
    if (!gltf.scene) {
        console.warn('X GLTF model not found or failed to load.');
    }
    xPieceModel = gltf.scene;
    scene.add(xPieceModel);
    xPieceModel.position.set(-1, -40, 0);
});

// Load O model
const oPieceModelLoader = new GLTFLoader();
oPieceModelLoader.load('assets/3D models/Os mesh.glb', (gltf) => {
    if (!gltf.scene) {
        console.warn('O GLTF model not found or failed to load.');
    }
    oPieceModel = gltf.scene;
    scene.add(oPieceModel);
    oPieceModel.position.set(1, -40, 0);
});

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

// Mouse click functionality
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    if (gameState.isPaused || !gameState.gameActive || !gameState.canPlacePieces) return;

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
    }
}

container.addEventListener('click', onMouseClick, false);

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
    
    const pauseMenu = document.getElementById('pauseMenu');
    const message = document.getElementById('Message');
    const resumeButton = document.getElementById('resumeButton');
    
    pauseMenu.style.opacity = '1';
    pauseMenu.style.display = 'block';
    resumeButton.style.pointerEvents = 'auto';
    resumeButton.textContent = "Restart Game";
    
    if (result === 'player1') {
        message.textContent = "Player 1 Wins!";
        controls.enabled = false;
        console.log("Player 1 wins!");
    } else if (result === 'player2') {
        message.textContent = "Player 2 Wins!";
        controls.enabled = false;
        console.log("Player 2 wins!");
    } else {
        message.textContent = "It's a Draw!";
        controls.enabled = false;
        console.log("It's a draw!");
    }
}

function resetGame() {
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

    controls.enabled = false;
    
    setTimeout(() => {
        controls.enabled = true;
        gameState.canPlacePieces = true;
    }, 250);

    console.log("Game reset!");
}

// Animation loop
function animate() {
    renderer.render(scene, camera);
    controls.update();
}
renderer.setAnimationLoop(animate);