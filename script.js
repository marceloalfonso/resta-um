document.addEventListener('DOMContentLoaded', () => {
  const gameState = {
    board: [],
    selectedCell: null,
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

  function createBoard() {
    boardElement.innerHTML = '';
    gameState.board = [];
    gameState.selectedCell = null;

    for (let row = 0; row < 7; row++) {
      gameState.board[row] = [];

      for (let column = 0; column < 7; column++) {
        const cellValue = boardLayout[row][column];
        gameState.board[row][column] = cellValue;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = column;

        if (cellValue === 0) {
          cell.classList.add('invalid');
        } else {
          cell.classList.add('valid');

          if (cellValue === 1) {
            const piece = document.createElement('div');
            piece.className = 'piece';
            cell.appendChild(piece);
          }

          cell.addEventListener('click', () => handleCellClick(row, column));
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

      // Se a célula clicada está vazia, por enquanto apenas desseleciona
      if (clickedCellValue === 2) {
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

  function getCellElement(row, col) {
    return document.querySelector(
      `.cell[data-row="${row}"][data-col="${col}"]`
    );
  }

  createBoard();
});
