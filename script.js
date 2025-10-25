document.addEventListener('DOMContentLoaded', () => {
  const gameState = {
    board: [],
    selectedCell: null,
    remainingPieces: 32,
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
  // 0: célula inválida (não faz parte do tabuleiro, fora do formato do jogo)
  // 1: célula válida com peça
  // 2: célula válida sem peça (posição central começa vazia)

  const boardElement = document.getElementById('board');
  const restartButton = document.getElementById('restart-button');
  const remainingPiecesElement = document.getElementById('remaining-pieces');

  initGame();

  restartButton.addEventListener('click', initGame);

  function initGame() {
    boardElement.innerHTML = '';
    gameState.board = [];
    gameState.selectedCell = null;
    gameState.remainingPieces = 32;

    updateRemainingPieces();
    createBoard();
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
          movePiece(
            gameState.selectedCell.row,
            gameState.selectedCell.col,
            row,
            col
          );
          deselectCell();

          if (!hasValidMoves()) {
            setTimeout(() => {
              const message =
                gameState.remainingPieces === 1
                  ? 'Parabéns! Você venceu!'
                  : `Fim de jogo! Restaram ${gameState.remainingPieces} peças.`;
              alert(message);
              initGame();
            }, 300);
          }

          return;
        }

        deselectCell();
        return;
      }
    }
  }

  function selectCell(row, col) {
    gameState.selectedCell = { row, col };

    const cell = getCellElement(row, col);
    cell.classList.add('selected');
  }

  function deselectCell() {
    if (gameState.selectedCell !== null) {
      const { row, col } = gameState.selectedCell;

      const cell = getCellElement(row, col);
      cell.classList.remove('selected');

      gameState.selectedCell = null;
    }
  }

  function checkValidMove(fromRow, fromCol, toRow, toCol) {
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

    gameState.board[fromRow][fromCol] = 2;
    gameState.board[middleRow][middleCol] = 2;
    gameState.board[toRow][toCol] = 1;

    removePieceFromCell(fromRow, fromCol);
    removePieceFromCell(middleRow, middleCol);
    addPieceToCell(toRow, toCol);

    gameState.remainingPieces--;
    updateRemainingPieces();
  }

  function removePieceFromCell(row, col) {
    const cell = getCellElement(row, col);
    const piece = cell.querySelector('.piece');

    if (piece) {
      cell.removeChild(piece);
    }
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

  function updateRemainingPieces() {
    remainingPiecesElement.textContent = gameState.remainingPieces;
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
            { deltaRow: -2, deltaCol: 0 }, // Cima
            { deltaRow: 2, deltaCol: 0 }, // Baixo
            { deltaRow: 0, deltaCol: -2 }, // Esquerda
            { deltaRow: 0, deltaCol: 2 }, // Direita
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
            ) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
});
