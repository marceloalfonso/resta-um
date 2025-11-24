document.addEventListener('DOMContentLoaded', () => {
  const gameState = {
    board: [],
    selectedCell: null,
    remainingPieces: 32,
    movesCount: 0,
    startTime: null,
    gameTime: 0,
    timerInterval: null,
    isGameActive: false,
  };

  const boardLayout = [
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
  ];

  const boardElement = document.getElementById('board');
  const restartButton = document.getElementById('restart-button');
  const remainingPiecesElement = document.getElementById('remaining-pieces');
  const movesCountElement = document.getElementById('moves-count');
  const gameTimeElement = document.getElementById('game-time');
  const bestScoreElement = document.getElementById('best-score');

  initGame();

  restartButton.addEventListener('click', initGame);
  document.addEventListener('keydown', handleKeyPress);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
  `;
  document.head.appendChild(style);

  function initGame() {
    restartButton.classList.add('loading');

    boardElement.innerHTML = '';
    gameState.board = [];
    gameState.selectedCell = null;
    gameState.remainingPieces = 32;
    gameState.movesCount = 0;
    gameState.gameTime = 0;
    gameState.startTime = null;
    gameState.isGameActive = false;

    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
    }

    updateGameStats();
    loadBestScore();
    createBoard();

    setTimeout(() => restartButton.classList.remove('loading'), 500);
  }

  function createBoard() {
    boardElement.innerHTML = '';
    gameState.board = [];
    gameState.selectedCell = null;

    for (let row = 0; row < 7; row++) {
      gameState.board[row] = [];

      for (let col = 0; col < 7; col++) {
        const cellValue = boardLayout[row][col];
        gameState.board[row][col] = cellValue;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        if (cellValue === 0) {
          cell.classList.add('invalid');
        } else {
          cell.classList.add('valid');

          if (cellValue === 1) {
            const piece = document.createElement('div');
            piece.className = 'piece';
            cell.appendChild(piece);
          }

          cell.addEventListener('click', () => handleCellClick(row, col));
        }

        boardElement.appendChild(cell);
      }
    }
  }

  function handleCellClick(row, col) {
    const clickedCellValue = gameState.board[row][col];

    if (gameState.selectedCell === null && clickedCellValue === 1) {
      selectCell(row, col);
      return;
    }

    if (gameState.selectedCell !== null) {
      if (
        gameState.selectedCell.row === row &&
        gameState.selectedCell.col === col
      ) {
        deselectCell();
        return;
      }

      if (clickedCellValue === 1) {
        deselectCell();
        selectCell(row, col);
        return;
      }

      if (clickedCellValue === 2) {
        const canMove = checkValidMove(
          gameState.selectedCell.row,
          gameState.selectedCell.col,
          row,
          col
        );

        if (canMove) {
          if (!gameState.isGameActive) startGame();

          movePiece(
            gameState.selectedCell.row,
            gameState.selectedCell.col,
            row,
            col
          );
          deselectCell();

          return;
        }

        deselectCell();
      }
    }
  }

  function selectCell(row, col) {
    gameState.selectedCell = { row, col };

    const cell = getCellElement(row, col);
    cell.classList.add('selected');
    playSound('select');
    cell.style.animation = 'none';

    setTimeout(() => (cell.style.animation = 'pulse 2s infinite'), 10);
  }

  function deselectCell() {
    if (!gameState.selectedCell) return;

    const { row, col } = gameState.selectedCell;

    const cell = getCellElement(row, col);
    cell.classList.remove('selected');
    cell.style.animation = '';
    gameState.selectedCell = null;
  }

  function checkValidMove(fromRow, fromCol, toRow, toCol) {
    if (!isValidPosition(fromRow, fromCol)) return false;
    if (!isValidPosition(toRow, toCol)) return false;

    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);

    if ((rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2)) {
      const middleRow = (fromRow + toRow) / 2;
      const middleCol = (fromCol + toCol) / 2;
      return gameState.board[middleRow][middleCol] === 1;
    }

    return false;
  }

  function movePiece(fromRow, fromCol, toRow, toCol) {
    const middleRow = (fromRow + toRow) / 2;
    const middleCol = (fromCol + toCol) / 2;

    const fromCell = getCellElement(fromRow, fromCol);
    const toCell = getCellElement(toRow, toCol);
    const piece = fromCell.querySelector('.piece');

    if (piece) {
      piece.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
      piece.style.transform = 'scale(1.2)';

      setTimeout(() => {
        gameState.board[fromRow][fromCol] = 2;
        gameState.board[middleRow][middleCol] = 2;
        gameState.board[toRow][toCol] = 1;

        removePieceFromCell(fromRow, fromCol);
        removePieceFromCell(middleRow, middleCol);
        addPieceToCell(toRow, toCol);

        gameState.remainingPieces--;
        gameState.movesCount++;

        updateGameStats();
        playSound('move');

        const newPiece = toCell.querySelector('.piece');

        if (newPiece) {
          newPiece.style.animation = 'bounceIn 0.5s ease-out';
          setTimeout(() => (newPiece.style.animation = ''), 500);
        }

        checkGameOver();
      }, 150);
    } else {
      gameState.board[fromRow][fromCol] = 2;
      gameState.board[middleRow][middleCol] = 2;
      gameState.board[toRow][toCol] = 1;

      removePieceFromCell(fromRow, fromCol);
      removePieceFromCell(middleRow, middleCol);
      addPieceToCell(toRow, toCol);

      gameState.remainingPieces--;
      gameState.movesCount++;

      updateGameStats();
      playSound('move');

      checkGameOver();
    }
  }

  function removePieceFromCell(row, col) {
    const cell = getCellElement(row, col);
    const piece = cell.querySelector('.piece');

    if (piece) cell.removeChild(piece);
  }

  function addPieceToCell(row, col) {
    const cell = getCellElement(row, col);

    if (!cell.querySelector('.piece')) {
      const piece = document.createElement('div');
      piece.className = 'piece';
      cell.appendChild(piece);
    }
  }

  function getCellElement(row, col) {
    return document.querySelector(
      `.cell[data-row="${row}"][data-col="${col}"]`
    );
  }

  function updateGameStats() {
    remainingPiecesElement.textContent = gameState.remainingPieces;
    movesCountElement.textContent = gameState.movesCount;

    const minutes = Math.floor(gameState.gameTime / 60);
    const seconds = gameState.gameTime % 60;

    gameTimeElement.textContent = `${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function startGame() {
    gameState.isGameActive = true;
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
      gameState.gameTime = Math.floor(
        (Date.now() - gameState.startTime) / 1000
      );
      updateGameStats();
    }, 1000);
  }

  function checkGameOver() {
    if (!gameState.isGameActive) return;
    if (!hasValidMoves() || gameState.remainingPieces === 1) endGame();
  }

  function createCelebrationEffect() {
    const container = document.createElement('div');
    container.className = 'celebration-particles';
    document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.backgroundColor = `hsl(${
          Math.random() * 60 + 30
        }, 70%, 50%)`;
        container.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 3000);
      }, i * 100);
    }

    setTimeout(() => {
      container.remove();
    }, 6000);
  }

  function endGame() {
    gameState.isGameActive = false;

    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
    }

    const isVictory = gameState.remainingPieces === 1;

    if (isVictory) {
      playSound('win');
      createCelebrationEffect();

      const bestTime = localStorage.getItem('bestTime');

      if (!bestTime || gameState.gameTime < parseInt(bestTime)) {
        localStorage.setItem('bestTime', gameState.gameTime.toString());
        loadBestScore();

        if (bestScoreElement) {
          bestScoreElement.style.animation = 'bounceIn 0.8s ease-out';
          setTimeout(() => (bestScoreElement.style.animation = ''), 800);
        }
      }
    }

    const message = isVictory
      ? `Parabéns, você venceu!\n\n⏱️ Tempo: ${gameTimeElement.textContent}\n🔄 Movimentos: ${gameState.movesCount}`
      : `Fim de jogo, você perdeu!\n\n💎 Peças restantes: ${gameState.remainingPieces}\n⏱️ Tempo: ${gameTimeElement.textContent}\n🔄 Movimentos: ${gameState.movesCount}`;

    if (confirm(message + '\n\nDeseja jogar novamente?')) initGame();
  }

  function loadBestScore() {
    const bestTime = localStorage.getItem('bestTime');

    if (bestTime) {
      const minutes = Math.floor(bestTime / 60);
      const seconds = bestTime % 60;

      bestScoreElement.textContent = `${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      bestScoreElement.textContent = '--';
    }
  }

  function isValidPosition(row, col) {
    return (
      row >= 0 &&
      row < 7 &&
      col >= 0 &&
      col < 7 &&
      gameState.board[row][col] !== 0
    );
  }

  function hasValidMoves() {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (gameState.board[row][col] === 1) {
          const directions = [
            { deltaRow: -2, deltaCol: 0 },
            { deltaRow: 2, deltaCol: 0 },
            { deltaRow: 0, deltaCol: -2 },
            { deltaRow: 0, deltaCol: 2 },
          ];

          for (const dir of directions) {
            const newRow = row + dir.deltaRow;
            const newCol = col + dir.deltaCol;

            if (
              isValidPosition(newRow, newCol) &&
              gameState.board[newRow][newCol] === 2 &&
              gameState.board[row + dir.deltaRow / 2][
                col + dir.deltaCol / 2
              ] === 1
            )
              return true;
          }
        }
      }
    }
    return false;
  }

  function handleKeyPress(event) {
    if (!gameState.isGameActive && gameState.selectedCell === null) return;

    switch (event.key) {
      case 'Escape':
        if (gameState.selectedCell) deselectCell();
        break;
      case 'r':
      case 'R':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          initGame();
        }
        break;
    }
  }

  function playSound(type) {
    if (!navigator.vibrate) return;

    switch (type) {
      case 'select':
        navigator.vibrate(50);
        break;
      case 'move':
        navigator.vibrate([100, 50, 100]);
        break;
      case 'win':
        navigator.vibrate([200, 100, 200, 100, 200]);
        break;
      case 'error':
        navigator.vibrate(200);
        break;
    }
  }
});
