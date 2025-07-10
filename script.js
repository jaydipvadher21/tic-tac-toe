class TicTacToe {
  constructor() {
    this.boardSize = parseInt(localStorage.getItem("boardSize")) || 3;
    this.gameMode = localStorage.getItem("gameMode") || "twoPlayer";
    this.theme = localStorage.getItem("theme") || "neon";
    this.scores = JSON.parse(localStorage.getItem("scores")) || {
      x: 0,
      o: 0,
      draws: 0,
    };
    this.currentPlayer = "X";
    this.board = Array(this.boardSize ** 2).fill("");
    this.gameActive = true;
    this.init();
  }

  init() {
    document.body.className = `theme-${this.theme}`;
    document.getElementById("themeSelect").value = this.theme;
    document.getElementById("boardSize").value = this.boardSize;
    document.getElementById("gameMode").value = this.gameMode;
    this.updateScoreboard();
    this.renderBoard();
    this.initEventListeners();
    this.startParticleAnimation();
  }

  initEventListeners() {
    document
      .getElementById("gameBoard")
      .addEventListener("click", (e) => this.handleMove(e));
    document
      .getElementById("resetBtn")
      .addEventListener("click", () => this.resetGame());
    document
      .getElementById("themeSelect")
      .addEventListener("change", () => this.changeTheme());
    document
      .getElementById("boardSize")
      .addEventListener("change", () => this.changeBoardSize());
    document
      .getElementById("gameMode")
      .addEventListener("change", () => this.changeGameMode());
  }

  renderBoard() {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
    gameBoard.innerHTML = "";
    this.board.forEach((cell, index) => {
      const tile = document.createElement("div");
      tile.className = `hex-tile ${cell.toLowerCase()}`;
      tile.dataset.index = index;
      tile.textContent = cell;
      tile.setAttribute("aria-label", `Tile ${index + 1}: ${cell || "Empty"}`);
      if (cell) tile.classList.add("occupied");
      gameBoard.appendChild(tile);
    });
  }

  handleMove(event) {
    const tile = event.target.closest(".hex-tile");
    if (!tile || !this.gameActive || tile.classList.contains("occupied"))
      return;

    const index = parseInt(tile.dataset.index);
    this.board[index] = this.currentPlayer;
    tile.textContent = this.currentPlayer;
    tile.classList.add(this.currentPlayer.toLowerCase(), "occupied");
    this.playSound(this.currentPlayer === "X" ? 440 : 660);

    if (this.checkWin()) {
      this.endGame(`${this.currentPlayer} Wins!`);
      this.scores[this.currentPlayer.toLowerCase()]++;
      this.triggerConfetti();
    } else if (this.board.every((cell) => cell)) {
      this.endGame("Draw!");
      this.scores.draws++;
    } else {
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
      if (
        this.gameMode === "ai" &&
        this.currentPlayer === "O" &&
        this.gameActive
      ) {
        this.aiMove();
      }
    }
    this.saveScores();
    this.updateScoreboard();
  }

  checkWin() {
    const size = this.boardSize;
    const winConditions = [];

    // Rows
    for (let i = 0; i < size; i++) {
      winConditions.push(Array.from({ length: size }, (_, j) => i * size + j));
    }

    // Columns
    for (let j = 0; j < size; j++) {
      winConditions.push(Array.from({ length: size }, (_, i) => i * size + j));
    }

    // Diagonals
    winConditions.push(Array.from({ length: size }, (_, i) => i * size + i));
    winConditions.push(
      Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)),
    );

    return winConditions.some((condition) => {
      const line = condition.map((i) => this.board[i]);
      if (line.every((cell) => cell && cell === line[0])) {
        condition.forEach((i) => {
          document
            .querySelector(`.hex-tile[data-index="${i}"]`)
            .classList.add("winner");
        });
        return true;
      }
      return false;
    });
  }

  aiMove() {
    // Simplified minimax: prioritize winning, blocking, or random move
    const size = this.boardSize;
    const emptyCells = this.board
      .map((cell, i) => (cell === "" ? i : null))
      .filter((i) => i !== null);

    // Check for winning move
    for (const index of emptyCells) {
      this.board[index] = "O";
      if (this.checkWin()) {
        this.board[index] = "";
        this.makeMove(index);
        return;
      }
      this.board[index] = "";
    }

    // Block player's winning move
    for (const index of emptyCells) {
      this.board[index] = "X";
      if (this.checkWin()) {
        this.board[index] = "";
        this.makeMove(index);
        return;
      }
      this.board[index] = "";
    }

    // Random move
    const randomIndex =
      emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.makeMove(randomIndex);
  }

  makeMove(index) {
    this.board[index] = "O";
    const tile = document.querySelector(`.hex-tile[data-index="${index}"]`);
    tile.textContent = "O";
    tile.classList.add("o", "occupied");
    this.playSound(660);

    if (this.checkWin()) {
      this.endGame("O Wins!");
      this.scores.o++;
      this.triggerConfetti();
    } else if (this.board.every((cell) => cell)) {
      this.endGame("Draw!");
      this.scores.draws++;
    } else {
      this.currentPlayer = "X";
    }
    this.saveScores();
    this.updateScoreboard();
  }

  endGame(message) {
    this.gameActive = false;
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = message;
    messageDiv.classList.remove("hidden");
  }

  resetGame() {
    this.board = Array(this.boardSize ** 2).fill("");
    this.currentPlayer = "X";
    this.gameActive = true;
    document.getElementById("message").classList.add("hidden");
    this.renderBoard();
  }

  changeTheme() {
    this.theme = document.getElementById("themeSelect").value;
    document.body.className = `theme-${this.theme}`;
    localStorage.setItem("theme", this.theme);
    this.startParticleAnimation();
  }

  changeBoardSize() {
    this.boardSize = parseInt(document.getElementById("boardSize").value);
    localStorage.setItem("boardSize", this.boardSize);
    this.resetGame();
  }

  changeGameMode() {
    this.gameMode = document.getElementById("gameMode").value;
    localStorage.setItem("gameMode", this.gameMode);
    this.resetGame();
  }

  updateScoreboard() {
    document.getElementById("xScore").textContent = this.scores.x;
    document.getElementById("oScore").textContent = this.scores.o;
    document.getElementById("drawScore").textContent = this.scores.draws;
  }

  saveScores() {
    localStorage.setItem("scores", JSON.stringify(this.scores));
  }

  triggerConfetti() {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  }

  playSound(frequency) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  }

  startParticleAnimation() {
    const canvas = document.getElementById("particleCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 5 + 2,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
      });
    }

    const colors = {
      neon: ["#ff00ff", "#00ffff", "#ffffff"],
      retro: ["#ff69b4", "#00ff00", "#ffff00"],
      cosmic: ["#800080", "#4b0082", "#ffffff"],
    };

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle =
          colors[this.theme][
            Math.floor(Math.random() * colors[this.theme].length)
          ];
        ctx.fill();
      });
      requestAnimationFrame(animate.bind(this));
    }

    animate.call(this);
  }
}

document.addEventListener("DOMContentLoaded", () => new TicTacToe());
