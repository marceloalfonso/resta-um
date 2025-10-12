document.addEventListener('DOMContentLoaded', () => {
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

    for (let row = 0; row < 7; row++) {
      for (let column = 0; column < 7; column++) {
        const cellValue = boardLayout[row][column];
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
        }

        boardElement.appendChild(cell);
      }
    }
  }

  createBoard();
});
