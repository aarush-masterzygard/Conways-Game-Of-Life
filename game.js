class GameOfLife {
    constructor(gridSize = 50) {
        this.gridSize = gridSize;
        this.currentGrid = [];
        this.nextGrid = [];
        this.isRunning = false;
        this.generation = 0;
        this.intervalId = null;
        this.speed = 5; // Default speed (1-20 scale)
        
        this.initializeGrids();
        this.createDOMGrid();
        this.bindEvents();
        this.initializeTheme();
        this.updateDisplay();
    }

    // Initialize theme system
    initializeTheme() {
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('gameOfLifeTheme') || 'light';
        this.setTheme(savedTheme);
    }

    // Set theme and update UI
    setTheme(theme) {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        const themeText = themeToggle.querySelector('.theme-text');

        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light Mode';
        } else {
            body.removeAttribute('data-theme');
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark Mode';
        }

        localStorage.setItem('gameOfLifeTheme', theme);
    }

    // Toggle between light and dark themes
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    // Count total live cells in the grid
    countLiveCells() {
        let count = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.currentGrid[row][col]) {
                    count++;
                }
            }
        }
        return count;
    }

    // Initialize both current and next grids with dead cells
    initializeGrids() {
        this.currentGrid = [];
        this.nextGrid = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            this.currentGrid[row] = [];
            this.nextGrid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.currentGrid[row][col] = false; // false = dead, true = alive
                this.nextGrid[row][col] = false;
            }
        }
    }

    // Create the DOM grid with div elements
    createDOMGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, 12px)`;
        gridElement.style.gridTemplateRows = `repeat(${this.gridSize}, 12px)`;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add click event to toggle cell state
                cell.addEventListener('click', () => this.toggleCell(row, col));
                
                gridElement.appendChild(cell);
            }
        }
    }

    // Toggle a cell's alive/dead state
    toggleCell(row, col) {
        this.currentGrid[row][col] = !this.currentGrid[row][col];
        this.updateCellDisplay(row, col);
    }

    // Update a single cell's visual appearance
    updateCellDisplay(row, col) {
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (this.currentGrid[row][col]) {
            cellElement.classList.add('alive');
        } else {
            cellElement.classList.remove('alive');
        }
    }

    // Update the entire grid display
    updateDisplay() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.updateCellDisplay(row, col);
            }
        }
        document.getElementById('generationCount').textContent = this.generation;
        document.getElementById('liveCellCount').textContent = this.countLiveCells();
    }

    // Count live neighbors for a given cell
    countLiveNeighbors(row, col) {
        let count = 0;
        
        // Check all 8 neighboring positions
        for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
            for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                // Skip the cell itself
                if (deltaRow === 0 && deltaCol === 0) continue;
                
                const neighborRow = row + deltaRow;
                const neighborCol = col + deltaCol;
                
                // Check if neighbor is within grid bounds
                if (neighborRow >= 0 && neighborRow < this.gridSize && 
                    neighborCol >= 0 && neighborCol < this.gridSize) {
                    if (this.currentGrid[neighborRow][neighborCol]) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }

    // Calculate the next generation using Conway's rules
    calculateNextGeneration() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const liveNeighbors = this.countLiveNeighbors(row, col);
                const isAlive = this.currentGrid[row][col];
                
                // Apply Conway's Game of Life rules
                if (isAlive) {
                    // Live cell rules
                    if (liveNeighbors < 2) {
                        this.nextGrid[row][col] = false; // Dies from underpopulation
                    } else if (liveNeighbors === 2 || liveNeighbors === 3) {
                        this.nextGrid[row][col] = true;  // Survives
                    } else {
                        this.nextGrid[row][col] = false; // Dies from overpopulation
                    }
                } else {
                    // Dead cell rules
                    if (liveNeighbors === 3) {
                        this.nextGrid[row][col] = true;  // Becomes alive from reproduction
                    } else {
                        this.nextGrid[row][col] = false; // Stays dead
                    }
                }
            }
        }
    }

    // Advance one generation
    step() {
        this.calculateNextGeneration();
        
        // Swap grids (double buffering)
        [this.currentGrid, this.nextGrid] = [this.nextGrid, this.currentGrid];
        
        this.generation++;
        this.updateDisplay();
    }

    // Start the simulation
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        const interval = Math.max(50, 1000 - (this.speed - 1) * 45); // Convert speed to milliseconds
        
        this.intervalId = setInterval(() => {
            this.step();
        }, interval);
        
        document.getElementById('startPauseBtn').textContent = '⏸ Pause';
    }

    // Pause the simulation
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.intervalId = null;
        
        document.getElementById('startPauseBtn').textContent = '▶ Start';
    }

    // Toggle between start and pause
    toggleStartPause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    // Clear the grid (kill all cells)
    clear() {
        this.pause();
        this.initializeGrids();
        this.generation = 0;
        this.updateDisplay();
    }

    // Randomize the grid with approximately 30% live cells
    randomize() {
        this.pause();
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.currentGrid[row][col] = Math.random() < 0.3;
            }
        }
        
        this.generation = 0;
        this.updateDisplay();
    }

    // Update simulation speed
    setSpeed(newSpeed) {
        this.speed = newSpeed;
        
        // If running, restart with new speed
        if (this.isRunning) {
            this.pause();
            this.start();
        }
    }

    // Bind event listeners to controls
    bindEvents() {
        document.getElementById('startPauseBtn').addEventListener('click', () => {
            this.toggleStartPause();
        });

        document.getElementById('stepBtn').addEventListener('click', () => {
            if (!this.isRunning) {
                this.step();
            }
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clear();
        });

        document.getElementById('randomizeBtn').addEventListener('click', () => {
            this.randomize();
        });

        // Theme toggle event
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        
        speedSlider.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            speedValue.textContent = speed;
            this.setSpeed(speed);
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameOfLife(50); // 50x50 grid
});