// Game state and configuration
let gameState = {
    isRunning: false,
    isPaused: false,
    currentLevel: null,
    score: 0,
    highScores: { easy: 0, medium: 0, hard: 0 },
    snake: [],
    food: [],
    direction: 'RIGHT',
    gameLoop: null
};

// Game settings from the provided data
const gameSettings = {
    easy: { foodCount: 2, speed: 150, theme: 'easy' },
    medium: { foodCount: 2, speed: 100, theme: 'medium' },
    hard: { foodCount: 1, speed: 60, theme: 'hard' }
};

const gridSize = { rows: 40, cols: 40, totalPixels: 1600 };
const initialPosition = { row: 20, col: 1, direction: 'RIGHT' };

// DOM elements - will be initialized after DOM loads
let levelSelection, gameScreen, gameOverScreen, gameBoard;
let currentScoreEl, highScoreEl, currentLevelEl, pauseIndicator, pauseBtn;
let finalScoreEl, newHighScoreEl;

// Initialize the game
function initializeGame() {
    // Get DOM elements
    levelSelection = document.getElementById('levelSelection');
    gameScreen = document.getElementById('gameScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    gameBoard = document.getElementById('gameBoard');
    currentScoreEl = document.getElementById('currentScore');
    highScoreEl = document.getElementById('highScore');
    currentLevelEl = document.getElementById('currentLevel');
    pauseIndicator = document.getElementById('pauseIndicator');
    pauseBtn = document.getElementById('pauseBtn');
    finalScoreEl = document.getElementById('finalScore');
    newHighScoreEl = document.getElementById('newHighScore');

    createGameBoard();
    addEventListeners();
    showLevelSelection();
}

// Create the game board grid
function createGameBoard() {
    if (!gameBoard) return;
    
    gameBoard.innerHTML = '';
    for (let i = 1; i <= gridSize.totalPixels; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.id = `pixel${i}`;
        gameBoard.appendChild(pixel);
    }
}

// Add event listeners
function addEventListeners() {
    // Level selection buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const level = e.currentTarget.dataset.level;
            console.log('Level selected:', level); // Debug log
            startGame(level);
        });
    });

    // Game control buttons
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', backToMenu);
    
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', backToMenu);

    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
}

// Handle keyboard input
function handleKeyPress(e) {
    if (!gameState.isRunning) return;

    switch (e.key) {
        case ' ':
            e.preventDefault();
            togglePause();
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (gameState.direction !== 'DOWN') changeDirection('UP');
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (gameState.direction !== 'UP') changeDirection('DOWN');
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (gameState.direction !== 'RIGHT') changeDirection('LEFT');
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (gameState.direction !== 'LEFT') changeDirection('RIGHT');
            break;
    }
}

// Show level selection screen
function showLevelSelection() {
    console.log('Showing level selection'); // Debug log
    if (levelSelection) levelSelection.classList.remove('hidden');
    if (gameScreen) gameScreen.classList.add('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
}

// Start the game with selected level
function startGame(level) {
    console.log('Starting game with level:', level); // Debug log
    
    // Stop any existing game
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    gameState.currentLevel = level;
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.direction = initialPosition.direction;
    gameState.food = [];

    // Initialize snake at starting position
    const startPixel = getPixelNumber(initialPosition.row, initialPosition.col);
    gameState.snake = [startPixel, startPixel - 1, startPixel - 2];

    // Update UI - hide level selection, show game screen
    if (levelSelection) {
        levelSelection.classList.add('hidden');
        console.log('Level selection hidden');
    }
    if (gameScreen) {
        gameScreen.classList.remove('hidden');
        console.log('Game screen shown');
    }
    if (gameOverScreen) {
        gameOverScreen.classList.add('hidden');
    }
    
    // Apply theme
    if (gameBoard) {
        gameBoard.className = `game-board ${level}`;
    }
    
    // Update level display
    if (currentLevelEl) {
        currentLevelEl.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    }
    
    // Reset pause button
    if (pauseBtn) {
        pauseBtn.textContent = 'Pause';
    }
    if (pauseIndicator) {
        pauseIndicator.classList.add('hidden');
    }
    
    updateScore();
    
    // Generate initial food
    generateFood();
    
    // Draw initial game state
    drawGame();
    
    // Start game loop
    const speed = gameSettings[level].speed;
    gameState.gameLoop = setInterval(gameLoop, speed);
    
    console.log('Game started successfully'); // Debug log
}

// Main game loop
function gameLoop() {
    if (gameState.isPaused || !gameState.isRunning) return;
    
    moveSnake();
    checkCollisions();
    checkFoodConsumption();
    drawGame();
}

// Move the snake
function moveSnake() {
    const head = gameState.snake[0];
    const { row, col } = getPixelPosition(head);
    let newRow = row;
    let newCol = col;

    switch (gameState.direction) {
        case 'UP':
            newRow--;
            break;
        case 'DOWN':
            newRow++;
            break;
        case 'LEFT':
            newCol--;
            break;
        case 'RIGHT':
            newCol++;
            break;
    }

    const newHead = getPixelNumber(newRow, newCol);
    gameState.snake.unshift(newHead);
}

// Check for collisions
function checkCollisions() {
    const head = gameState.snake[0];
    const { row, col } = getPixelPosition(head);

    // Wall collision
    if (row < 1 || row > gridSize.rows || col < 1 || col > gridSize.cols) {
        gameOver();
        return;
    }

    // Self collision
    if (gameState.snake.slice(1).includes(head)) {
        gameOver();
        return;
    }
}

// Check if snake consumed food
function checkFoodConsumption() {
    const head = gameState.snake[0];
    const foodIndex = gameState.food.indexOf(head);
    
    if (foodIndex !== -1) {
        // Food consumed
        gameState.food.splice(foodIndex, 1);
        gameState.score += 10;
        updateScore();
        
        // Generate new food
        generateFood();
    } else {
        // Remove tail if no food consumed
        gameState.snake.pop();
    }
}

// Generate food items
function generateFood() {
    const foodCount = gameSettings[gameState.currentLevel].foodCount;
    
    while (gameState.food.length < foodCount) {
        let foodPixel;
        let attempts = 0;
        do {
            const row = Math.floor(Math.random() * gridSize.rows) + 1;
            const col = Math.floor(Math.random() * gridSize.cols) + 1;
            foodPixel = getPixelNumber(row, col);
            attempts++;
        } while ((gameState.snake.includes(foodPixel) || gameState.food.includes(foodPixel)) && attempts < 100);
        
        if (attempts < 100) {
            gameState.food.push(foodPixel);
        }
    }
}

// Draw the game
function drawGame() {
    clearGameBoard();
    drawSnake();
    drawFood();
}

// Clear the game board
function clearGameBoard() {
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => {
        pixel.className = 'pixel';
    });
}

// Draw the snake
function drawSnake() {
    gameState.snake.forEach(pixel => {
        const pixelEl = document.getElementById(`pixel${pixel}`);
        if (pixelEl) {
            pixelEl.classList.add('snakeBodyPixel');
        }
    });
}

// Draw food items
function drawFood() {
    gameState.food.forEach(pixel => {
        const pixelEl = document.getElementById(`pixel${pixel}`);
        if (pixelEl) {
            pixelEl.classList.add('food');
        }
    });
}

// Change snake direction
function changeDirection(newDirection) {
    gameState.direction = newDirection;
}

// Toggle pause
function togglePause() {
    if (!gameState.isRunning) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        if (pauseIndicator) pauseIndicator.classList.remove('hidden');
        if (pauseBtn) pauseBtn.textContent = 'Resume';
    } else {
        if (pauseIndicator) pauseIndicator.classList.add('hidden');
        if (pauseBtn) pauseBtn.textContent = 'Pause';
    }
}

// Update score display
function updateScore() {
    if (currentScoreEl) currentScoreEl.textContent = gameState.score;
    if (highScoreEl) highScoreEl.textContent = gameState.highScores[gameState.currentLevel] || 0;
}

// Game over
function gameOver() {
    gameState.isRunning = false;
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    // Check for new high score
    const currentHighScore = gameState.highScores[gameState.currentLevel] || 0;
    const isNewHighScore = gameState.score > currentHighScore;
    
    if (isNewHighScore) {
        gameState.highScores[gameState.currentLevel] = gameState.score;
        if (newHighScoreEl) newHighScoreEl.classList.remove('hidden');
    } else {
        if (newHighScoreEl) newHighScoreEl.classList.add('hidden');
    }
    
    if (finalScoreEl) finalScoreEl.textContent = gameState.score;
    if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}

// Restart the game with same level
function restartGame() {
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    startGame(gameState.currentLevel);
}

// Go back to menu
function backToMenu() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    if (pauseIndicator) pauseIndicator.classList.add('hidden');
    showLevelSelection();
}

// Utility functions
function getPixelNumber(row, col) {
    return (row - 1) * gridSize.cols + col;
}

function getPixelPosition(pixelNumber) {
    const row = Math.ceil(pixelNumber / gridSize.cols);
    const col = pixelNumber - (row - 1) * gridSize.cols;
    return { row, col };
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game'); // Debug log
    initializeGame();
});