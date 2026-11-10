
// =====================================
// 1. GAME SETTINGS
// =====================================

// =====================================
// 1. GAME SETTINGS
// =====================================

const params = new URLSearchParams(window.location.search);

let difficulty = params.get("level") || "easy";

const settings = {
    easy: {
        rows: 9,
        columns: 9,
        mines: 10
    },

    medium: {
        rows: 16,
        columns: 16,
        mines: 40
    },

    hard: {
        rows: 16,
        columns: 30,
        mines: 99
    }
};

// Check selected difficulty

if (!settings[difficulty]) {
    difficulty = "easy";
}

// Apply settings

let rows = settings[difficulty].rows;
let columns = settings[difficulty].columns;
let totalMines = settings[difficulty].mines;

let gameOver = false;
let firstClick = true;

let boardElement = document.getElementById("board");

// Set board columns dynamically

boardElement.style.gridTemplateColumns =
    `repeat(${columns}, 40px)`;



// =====================================
// 2. FLAG VARIABLES
// =====================================

let flagged = Array.from(
    { length: rows },
    () => Array(columns).fill(false)
);

let flagsPlaced = 0;

let flagMode = false;

let soundEnabled = true;

// SOUND EFFECT SYSTEM

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration) {
if (!soundEnabled) return;
  if (audioContext.state === "suspended") {
    audioContext.resume();
}

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gain.gain.setValueAtTime(0.2, audioContext.currentTime);

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// =====================================
// 3. TIMER VARIABLES
// =====================================
let seconds = 0;
let timerInterval = null;
let timerStarted = false;
let timerStartTime = null;
// BEST TIME TRACKER

let bestTimeKey = "minesweeper-best-" + difficulty;

let bestTime = localStorage.getItem(bestTimeKey);

// GAME STATISTICS STORAGE

let gamesPlayedKey = "minesweeper-played-" + difficulty;
let gamesWonKey = "minesweeper-won-" + difficulty;

let gamesPlayed = Number(localStorage.getItem(gamesPlayedKey)) || 0;
let gamesWon = Number(localStorage.getItem(gamesWonKey)) || 0;

// REMOVE INVALID OLD RECORDS

if (
    bestTime !== null &&
    (!Number.isFinite(Number(bestTime)) || Number(bestTime) <= 0)
) {

    localStorage.removeItem(bestTimeKey);

    bestTime = null;

}

// =====================================
// 4. CREATE 2D GAME ARRAY
// =====================================

let gameBoard = [];

for (let row = 0; row < rows; row++) {

    let currentRow = [];

    for (let col = 0; col < columns; col++) {

        currentRow.push(0);

    }

    gameBoard.push(currentRow);
}


// =====================================
// 5. RANDOMLY PLACE MINES
// =====================================

let minesPlaced = 0;

while (minesPlaced < totalMines) {

    let randomRow = Math.floor(Math.random() * rows);
    let randomCol = Math.floor(Math.random() * columns);

    if (gameBoard[randomRow][randomCol] !== -1) {

        gameBoard[randomRow][randomCol] = -1;

        minesPlaced++;

    }
}


// =====================================
// 6. COUNT NEIGHBOURING MINES
// =====================================

for (let row = 0; row < rows; row++) {

    for (let col = 0; col < columns; col++) {

        if (gameBoard[row][col] === -1) {
            continue;
        }

        let count = 0;

        for (let r = -1; r <= 1; r++) {

            for (let c = -1; c <= 1; c++) {

                let newRow = row + r;
                let newCol = col + c;

                if (
                    newRow >= 0 &&
                    newRow < rows &&
                    newCol >= 0 &&
                    newCol < columns
                ) {

                    if (gameBoard[newRow][newCol] === -1) {

                        count++;

                    }

                }

            }

        }

        gameBoard[row][col] = count;

    }

}


// =====================================
// 7. TRACK REVEALED CELLS
// =====================================

let revealed = Array.from(
    { length: rows },
    () => Array(columns).fill(false)
);

// DISPLAY BEST TIME

function updateBestTimeDisplay() {

    let bestTimeElement = document.getElementById("best-time");

    if (bestTime === null) {
        bestTimeElement.textContent = "--";
    } else {
        bestTimeElement.textContent = bestTime + " sec";
    }

}
// UPDATE GAME STATISTICS DISPLAY

function updateStatsDisplay() {

    document.getElementById("games-played").textContent = gamesPlayed;

    document.getElementById("games-won").textContent = gamesWon;

    let winRate = gamesPlayed === 0
        ? 0
        : Math.round((gamesWon / gamesPlayed) * 100);

    document.getElementById("win-rate").textContent = winRate + "%";

}
// RECORD GAME RESULT

function recordGameResult(won) {

    gamesPlayed++;

    if (won) {
        gamesWon++;
    }

    localStorage.setItem(gamesPlayedKey, gamesPlayed);
    localStorage.setItem(gamesWonKey, gamesWon);

    updateStatsDisplay();

}

// DISPLAY SAVED STATISTICS
updateStatsDisplay();

// Display saved record when game loads
updateBestTimeDisplay();

// =====================================
// 8. TIMER FUNCTIONS
// =====================================

function startTimer() {

    if (timerStarted || gameOver) return;

    timerStarted = true;

    timerStartTime = Date.now();

    timerInterval = setInterval(function() {

        seconds = Math.floor(
            (Date.now() - timerStartTime) / 1000
        );

        document.getElementById("timer").textContent = seconds;

    }, 1000);

}


function stopTimer() {

    clearInterval(timerInterval);

    if (timerStartTime !== null) {

        seconds = Math.max(
            1,
            Math.ceil((Date.now() - timerStartTime) / 1000)
        );

        document.getElementById("timer").textContent = seconds;

    }

}


// =====================================
// 9. UPDATE MINE COUNTER
// =====================================

function updateMineCounter() {

    document.getElementById("mine-count").textContent =
        totalMines - flagsPlaced;

}

// =====================================
// SHOW GAME RESULT
// =====================================

function showMessage(title, message) {

    document.getElementById("message-title").textContent = title;

    document.getElementById("message-text").textContent = message;

    document.getElementById("message").classList.remove("hidden");

}

// =====================================
// 10. FLAG FUNCTIONALITY
// =====================================
function moveMine(row, col) {

    // Remove mine from clicked cell
    gameBoard[row][col] = 0;

    let newRow;
    let newCol;

    do {
        newRow = Math.floor(Math.random() * rows);
        newCol = Math.floor(Math.random() * columns);

    } while (
        gameBoard[newRow][newCol] === -1 ||
        (newRow === row && newCol === col)
    );

    // Place mine in new location
    gameBoard[newRow][newCol] = -1;

    // Recalculate neighbouring numbers
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {

            if (gameBoard[r][c] === -1) continue;

            let count = 0;

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {

                    let nr = r + i;
                    let nc = c + j;

                    if (
                        nr >= 0 && nr < rows &&
                        nc >= 0 && nc < columns &&
                        gameBoard[nr][nc] === -1
                    ) {
                        count++;
                    }
                }
            }

            gameBoard[r][c] = count;
        }
    }
}
function toggleFlag(row, col) {

    if (gameOver) return;

    if (revealed[row][col]) return;

    if (flagged[row][col]) {

        // Remove flag

        flagged[row][col] = false;

        flagsPlaced--;

    }

    else {

        // Place flag

        if (flagsPlaced >= totalMines) return;

        flagged[row][col] = true;

        flagsPlaced++;

    }

    let cell = boardElement.children[row * columns + col];

    cell.textContent = flagged[row][col] ? "🚩" : "";

    cell.classList.toggle("flagged", flagged[row][col]);

    playSound(750, 0.06);

    updateMineCounter();

}


// =====================================
// 11. CHECK WINNING CONDITION
// =====================================

function checkWin() {

    if (gameOver) return;

    let revealedCount = 0;

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < columns; col++) {

            if (revealed[row][col]) {
                revealedCount++;
            }

        }

    }

    if (revealedCount === rows * columns - totalMines) {
gameOver = true;

stopTimer();

recordGameResult(true);

        // SAVE BEST TIME

        if (bestTime === null || seconds < Number(bestTime)) {

            bestTime = seconds;

            localStorage.setItem(bestTimeKey, bestTime);

        }

        updateBestTimeDisplay();

        playSound(900, 0.2);

        setTimeout(function() {
            playSound(1200, 0.3);
        }, 200);

        showMessage(
            "🎉 You Won!",
            "Congratulations! You cleared the minefield!"
        );

    }

}

// =====================================
// 12. REVEAL CELL FUNCTION
// =====================================

function revealCell(row, col) {

    if (gameOver) return;

    if (revealed[row][col] || flagged[row][col]) return;
startTimer();
playSound(500, 0.08);

// First-click safety
if (firstClick) {

    firstClick = false;

    if (gameBoard[row][col] === -1) {
        moveMine(row, col);
    }
}

revealed[row][col] = true;

    let cell = boardElement.children[row * columns + col];

    let value = gameBoard[row][col];


    // CHECK FOR MINE

    if (value === -1) {

        cell.textContent = "💣";

        cell.classList.add("revealed");
gameOver = true;

stopTimer();

recordGameResult(false);

        playSound(200, 0.5);

setTimeout(function() {
    playSound(120, 0.6);
}, 300);

        // Reveal all mines

        for (let r = 0; r < rows; r++) {

            for (let c = 0; c < columns; c++) {

                if (gameBoard[r][c] === -1) {

                    let mineCell =
                        boardElement.children[r * columns + c];

                    mineCell.textContent = "💣";

                    mineCell.classList.add("revealed");

                }

            }

        }

     showMessage("💥 Game Over!", "Oops! You hit a mine. Better luck next time!");

        return;

    }


    // REVEAL SAFE CELL

    cell.classList.add("revealed");


    // DISPLAY NUMBER

  if (value > 0) {

    cell.textContent = value;

    cell.classList.add("number-" + value);

}


    // AUTOMATICALLY REVEAL EMPTY NEIGHBOURS

    if (value === 0) {

        for (let r = -1; r <= 1; r++) {

            for (let c = -1; c <= 1; c++) {

                let newRow = row + r;
                let newCol = col + c;

                if (
                    newRow >= 0 &&
                    newRow < rows &&
                    newCol >= 0 &&
                    newCol < columns
                ) {

                    revealCell(newRow, newCol);

                }

            }

        }

    }

    checkWin();

}


// =====================================
// 13. GENERATE HTML CELLS
// =====================================

for (let row = 0; row < rows; row++) {

    for (let col = 0; col < columns; col++) {

        let cell = document.createElement("button");

        cell.classList.add("cell");

        cell.dataset.row = row;

        cell.dataset.col = col;


        // LEFT CLICK: REVEAL CELL

        cell.addEventListener("click", function() {

    if (flagMode) {

        toggleFlag(row, col);

    } else {

        revealCell(row, col);

    }

});


        // RIGHT CLICK: PLACE OR REMOVE FLAG

        cell.addEventListener("contextmenu", function(event) {

            event.preventDefault();

            toggleFlag(row, col);

        });


        boardElement.appendChild(cell);

    }

}


// =====================================
// 14. DISPLAY BOARD IN CONSOLE
// =====================================

console.table(gameBoard);


// =====================================
// 15. RESTART GAME
// =====================================

document.getElementById("restart").addEventListener("click", function() {

    location.reload();

});

// =====================================
// PLAY AGAIN BUTTON
// =====================================

document.getElementById("play-again").addEventListener("click", function() {

    location.reload();

});

// =====================================
// 16. INITIALIZE MINE COUNTER
// =====================================

updateMineCounter();

// =====================================
// 17. DIFFICULTY BUTTONS
// =====================================

let difficultyButtons = document.querySelectorAll(".level");

difficultyButtons.forEach(function(button) {

    // Highlight selected difficulty

    if (button.dataset.level === difficulty) {
        button.classList.add("active");
    } else {
        button.classList.remove("active");
    }

    // Change difficulty when clicked

    button.addEventListener("click", function() {

        let selectedLevel = button.dataset.level;

        window.location.search = "?level=" + selectedLevel;

    });

});

// FLAG MODE BUTTON

let flagModeButton = document.getElementById("flag-mode");

flagModeButton.addEventListener("click", function() {

    flagMode = !flagMode;
    flagModeButton.classList.toggle("active", flagMode);

    if (flagMode) {
        flagModeButton.textContent = "🚩 Flag Mode: ON";
    } else {
        flagModeButton.textContent = "🚩 Flag Mode: OFF";
    }

});
// SOUND ON/OFF BUTTON

let soundButton = document.getElementById("sound-toggle");

soundButton.addEventListener("click", function() {

    soundEnabled = !soundEnabled;

    if (soundEnabled) {
        soundButton.textContent = "🔊 Sound: ON";
    } else {
        soundButton.textContent = "🔇 Sound: OFF";
    }

});
// SETTINGS PANEL

let settingsButton = document.getElementById("settings-button");

let settingsOverlay = document.getElementById("settings-overlay");

let closeSettingsButton = document.getElementById("close-settings");

// OPEN SETTINGS

settingsButton.addEventListener("click", function() {

    settingsOverlay.classList.remove("hidden");

});

// CLOSE SETTINGS

closeSettingsButton.addEventListener("click", function() {

    settingsOverlay.classList.add("hidden");

});

// CLOSE WHEN CLICKING OUTSIDE THE PANEL

settingsOverlay.addEventListener("click", function(event) {

    if (event.target === settingsOverlay) {

        settingsOverlay.classList.add("hidden");

    }

});
// REGISTER SERVICE WORKER

if ("serviceWorker" in navigator) {

    window.addEventListener("load", function() {

        navigator.serviceWorker.register("./sw.js")

            .then(function(registration) {
                console.log("Minesweeper is ready for offline use!");
            })

            .catch(function(error) {
                console.log("Service Worker registration failed:", error);
            });

    });

}