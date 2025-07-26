document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM yüklendi, script çalışıyor!');
  const candies = ['assets/sugar1.png', 'assets/sugar2.png', 'assets/sugar3.png', 'assets/sugar4.png'];
  const boardSize = 8;
  let board = [];
  let score = 0;
  let selectedCandy = null;
  let timerInterval = null;
  let gameStarted = false;
  let soundOn = true;
  let draggedCandy = null;
  let timeLeft = 60;
  let timerStarted = false; // Yeni: Timer durumu

  const gameBoard = document.getElementById('game-board');
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const startBtn = document.getElementById('start-btn');
  const enterBtn = document.getElementById('enter-btn');
  const introScreen = document.getElementById('intro-screen');
  const gameScreen = document.getElementById('game-screen');
  const soundToggle = document.getElementById('sound-toggle');
  const clickSound = document.getElementById('click-sound');
  const matchSound = document.getElementById('match-sound');
  const backgroundMusic = document.getElementById('background-music');

  enterBtn.addEventListener('click', () => {
    console.log('Enter butonuna tıklandı!');
    try {
      introScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden');
      if (soundOn) {
        backgroundMusic.play().catch(err => {
          console.error('Müzik çalma hatası:', err);
        });
      }
    } catch (err) {
      console.error('Enter butonu hatası:', err);
    }
  });

  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    soundToggle.src = soundOn ? 'assets/on.png' : 'assets/off.png';
    if (soundOn) {
      backgroundMusic.play().catch(err => {
        console.error('Müzik çalma hatası:', err);
      });
    } else {
      backgroundMusic.pause();
    }
  });

  startBtn.addEventListener('click', () => {
    resetGame();
    initBoard();
    gameStarted = true;
  });

  function resetGame() {
    clearInterval(timerInterval);
    score = 0;
    updateScore();
    timeLeft = 60;
    timerStarted = false; // Timer sıfırlanır
    timerDisplay.textContent = '01:00';
    gameBoard.innerHTML = '';
    board = [];
    gameStarted = false;
  }

  function initBoard() {
    for (let i = 0; i < boardSize; i++) {
      board[i] = [];
      for (let j = 0; j < boardSize; j++) {
        board[i][j] = '';
        const div = document.createElement('div');
        div.className = 'candy';
        div.dataset.row = i;
        div.dataset.col = j;
        div.draggable = true;
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('drop', handleDrop);
        div.addEventListener('click', handleCandyClick);
        gameBoard.appendChild(div);
      }
    }
    fillBoard();
  }

  function fillBoard() {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (board[i][j] === '') {
          do {
            board[i][j] = Math.random() < 0.01 ? 'assets/bomb.png' : candies[Math.floor(Math.random() * candies.length)];
          } while (hasInitialMatches(i, j));
        }
        updateCell(i, j);
      }
    }
  }

  function hasInitialMatches(i, j) {
    if (j >= 2 && board[i][j] === board[i][j-1] && board[i][j] === board[i][j-2]) return true;
    if (j <= boardSize-3 && board[i][j] === board[i][j+1] && board[i][j] === board[i][j+2]) return true;
    if (i >= 2 && board[i][j] === board[i-1][j] && board[i][j] === board[i-2][j]) return true;
    if (i <= boardSize-3 && board[i][j] === board[i+1][j] && board[i][j] === board[i+2][j]) return true;
    return false;
  }

  function updateCell(i, j) {
    const div = document.querySelector(`.candy[data-row='${i}'][data-col='${j}']`);
    if (div) {
      div.style.backgroundImage = `url('${board[i][j]}')`;
      if (board[i][j] === '') {
        div.classList.add('pop');
        setTimeout(() => div.classList.remove('pop'), 600); // Animasyon süresiyle uyumlu
      }
    }
  }

  function startTimer() {
    if (timerStarted) return; // Timer zaten başladıysa tekrar başlatma
    timerStarted = true;
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        gameStarted = false;
        alert(`Oyun bitti! Skor: ${score}`);
        return;
      }
      timeLeft--;
      const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const s = (timeLeft % 60).toString().padStart(2, '0');
      timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }

  function handleDragStart(e) {
    if (!gameStarted) return;
    draggedCandy = e.target;
    draggedCandy.classList.add('selected');
    e.dataTransfer.setData('text/plain', `${draggedCandy.dataset.row},${draggedCandy.dataset.col}`);
    startTimer(); // İlk sürüklemede timer başlar
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    if (!gameStarted) return;
    e.preventDefault();
    const [row, col] = e.dataTransfer.getData('text/plain').split(',').map(Number);
    const target = e.currentTarget;
    const row2 = +target.dataset.row;
    const col2 = +target.dataset.col;

    if (isAdjacent(row, col, row2, col2)) {
      swap(row, col, row2, col2);
      updateBoard();
      let matches = checkMatches();
      if (matches.length) {
        handleMatches(matches);
      } else {
        swap(row, col, row2, col2);
        updateBoard();
      }
    }
    draggedCandy.classList.remove('selected');
    draggedCandy = null;
  }

  function handleCandyClick(e) {
    if (!gameStarted) return;
    if (soundOn) clickSound.play();
    startTimer(); // İlk tıklamada timer başlar

    const candy = e.currentTarget;
    const row = +candy.dataset.row;
    const col = +candy.dataset.col;

    if (!selectedCandy) {
      selectedCandy = candy;
      candy.classList.add('selected');
    } else {
      const row2 = +selectedCandy.dataset.row;
      const col2 = +selectedCandy.dataset.col;

      if (isAdjacent(row, col, row2, col2)) {
        swap(row, col, row2, col2);
        updateBoard();

        let matches = checkMatches();
        if (matches.length) {
          handleMatches(matches);
        } else {
          swap(row, col, row2, col2);
          updateBoard();
        }
      }
      selectedCandy.classList.remove('selected');
      selectedCandy = null;
    }
  }

  function isAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
  }

  function swap(r1, c1, r2, c2) {
    let temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;
  }

  function updateBoard() {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        updateCell(i, j);
      }
    }
  }

  function checkMatches() {
    const matches = [];
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize - 2; j++) {
        if (board[i][j] && board[i][j] === board[i][j + 1] && board[i][j] === board[i][j + 2]) {
          const match = [[i, j], [i, j + 1], [i, j + 2]];
          for (let k = j + 3; k < boardSize && board[i][k] === board[i][j]; k++) {
            match.push([i, k]);
          }
          matches.push(...match);
        }
      }
    }
    for (let j = 0; j < boardSize; j++) {
      for (let i = 0; i < boardSize - 2; i++) {
        if (board[i][j] && board[i][j] === board[i + 1][j] && board[i][j] === board[i + 2][j]) {
          const match = [[i, j], [i + 1, j], [i + 2, j]];
          for (let k = i + 3; k < boardSize && board[k][j] === board[i][j]; k++) {
            match.push([k, j]);
          }
          matches.push(...match);
        }
      }
    }
    return [...new Set(matches.map(m => m.join(',')))].map(s => s.split(',').map(Number));
  }

  function handleMatches(matches) {
    if (soundOn) matchSound.play();

    let cleared = new Set();
    let matchGroups = {};

    matches.forEach(([i, j]) => {
      const key = board[i][j];
      if (!matchGroups[key]) matchGroups[key] = [];
      matchGroups[key].push([i, j]);
    });

    Object.values(matchGroups).forEach(group => {
      const isBomb = group[0] && board[group[0][0]][group[0][1]] === 'assets/bomb.png';
      let points = isBomb ? 5 : 1;
      if (group.length >= 4) points *= 2;
      score += group.length * points;
      group.forEach(([i, j]) => cleared.add(`${i},${j}`));
    });

    cleared.forEach(str => {
      const [i, j] = str.split(',').map(Number);
      board[i][j] = '';
    });

    updateScore();
    updateBoard();

    setTimeout(() => {
      collapseBoard();
      fillBoard();
      const newMatches = checkMatches();
      if (newMatches.length) {
        handleMatches(newMatches);
      }
    }, 600); // Animasyon süresiyle uyumlu
  }

  function collapseBoard() {
    for (let j = 0; j < boardSize; j++) {
      let empty = [];
      for (let i = boardSize - 1; i >= 0; i--) {
        if (board[i][j] === '') {
          empty.push(i);
        } else if (empty.length) {
          let to = empty.shift();
          board[to][j] = board[i][j];
          board[i][j] = '';
          empty.push(i);
        }
      }
    }
  }

  function updateScore() {
    scoreDisplay.innerHTML = `<span>Score</span><br>${score}`;
  }
});