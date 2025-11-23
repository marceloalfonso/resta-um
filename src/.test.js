const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function prepareScriptForTests(scriptSource) {
  const expose = `
    if (window.__IN_TEST__) {
      window.__TEST__ = {
        gameState,
        selectCell,
        deselectCell,
        boardLayout,
        checkValidMove,
        isValidPosition,
        hasValidMoves,
        initGame,
        createBoard,
        getCellElement,
        handleCellClick,
        movePiece,
        startGame,
        endGame,
        loadBestScore,
        createCelebrationEffect,
        playSound,
        updateGameStats,
        removePieceFromCell,
        addPieceToCell,
      };
    }
  `;

  const marker = 'window.__IN_TEST__ = true;';

  let modified = scriptSource.replace(
    /document\.addEventListener\(['"]DOMContentLoaded['"],\s*\(\)\s*=>\s*{/,
    (match) => match + marker
  );

  const lastClose = modified.lastIndexOf('});');
  modified = modified.slice(0, lastClose) + expose + modified.slice(lastClose);

  return modified;
}

function createDom(modifiedScript) {
  const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

  const patched = html.replace(
    '<script src="script.js"></script>',
    `<script>${modifiedScript}</script>`
  );

  return new JSDOM(patched, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost',
  });
}

jest.setTimeout(10000);

describe('Testes unitários', () => {
  let dom, window, api;

  beforeAll(() => {
    const rawScript = fs.readFileSync(
      path.resolve(__dirname, 'script.js'),
      'utf8'
    );
    const modifiedScript = prepareScriptForTests(rawScript);
    dom = createDom(modifiedScript);
    window = dom.window;
  });

  beforeEach(async () => {
    await delay(20);
    api = window.__TEST__;
    api.initGame();
  });

  afterAll(() => {
    window.close();
  });

  test('isValidPosition() - Deve aceitar posição válida com peça [2,0]', () => {
    expect(api.isValidPosition(2, 0)).toBe(true);
  });

  test('isValidPosition() - Deve aceitar posição válida sem peça [3,3]', () => {
    expect(api.isValidPosition(3, 3)).toBe(true);
  });

  test('isValidPosition() - Deve aceitar posição no canto superior [0,2]', () => {
    expect(api.isValidPosition(0, 2)).toBe(true);
  });

  test('isValidPosition() - Deve aceitar posição no canto inferior [6,4]', () => {
    expect(api.isValidPosition(6, 4)).toBe(true);
  });

  test('isValidPosition() - Deve aceitar posição central [3,3]', () => {
    expect(api.isValidPosition(3, 3)).toBe(true);
  });

  test('isValidPosition() - Deve rejeitar célula inválida [0,0]', () => {
    expect(api.isValidPosition(0, 0)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar célula inválida [0,6]', () => {
    expect(api.isValidPosition(0, 6)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar célula inválida [6,0]', () => {
    expect(api.isValidPosition(6, 0)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar célula inválida [6,6]', () => {
    expect(api.isValidPosition(6, 6)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar célula inválida [0,1]', () => {
    expect(api.isValidPosition(0, 1)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar célula inválida [1,0]', () => {
    expect(api.isValidPosition(1, 0)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar posição com linha negativa [-1,3]', () => {
    expect(api.isValidPosition(-1, 3)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar posição com coluna negativa [3,-1]', () => {
    expect(api.isValidPosition(3, -1)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar posição com coordenadas negativas [-1,-1]', () => {
    expect(api.isValidPosition(-1, -1)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar posição com linha fora dos limites [7,3]', () => {
    expect(api.isValidPosition(7, 3)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar posição com coluna fora dos limites [3,7]', () => {
    expect(api.isValidPosition(3, 7)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar posição com ambas coordenadas fora dos limites [7,7]', () => {
    expect(api.isValidPosition(7, 7)).toBe(false);
  });

  test('isValidPosition() - Deve rejeitar posição com valores muito grandes [100,100]', () => {
    expect(api.isValidPosition(100, 100)).toBe(false);
  });

  test('checkValidMove() - Deve validar movimento horizontal para direita [3,1] -> [3,3]', () => {
    expect(api.checkValidMove(3, 1, 3, 3)).toBe(true);
  });

  test('checkValidMove() - Deve validar movimento horizontal para esquerda [3,5] -> [3,3]', () => {
    api.gameState.board[3][3] = 2;
    api.gameState.board[3][4] = 1;
    expect(api.checkValidMove(3, 5, 3, 3)).toBe(true);
  });

  test('checkValidMove() - Deve validar movimento horizontal na linha 2 [2,0] -> [2,2]', () => {
    expect(api.checkValidMove(2, 0, 2, 2)).toBe(true);
  });

  test('checkValidMove() - Deve validar movimento horizontal na linha 4 [4,5] -> [4,3]', () => {
    api.gameState.board[4][3] = 2;
    expect(api.checkValidMove(4, 5, 4, 3)).toBe(true);
  });

  test('checkValidMove() - Deve validar movimento vertical para baixo [1,3] -> [3,3]', () => {
    expect(api.checkValidMove(1, 3, 3, 3)).toBe(true);
  });

  test('checkValidMove() - Deve validar movimento vertical para cima [5,3] -> [3,3]', () => {
    api.gameState.board[3][3] = 2;
    api.gameState.board[4][3] = 1;
    expect(api.checkValidMove(5, 3, 3, 3)).toBe(true);
  });

  test('checkValidMove() - Deve validar movimento vertical na coluna 2 [0,2] -> [2,2]', () => {
    expect(api.checkValidMove(0, 2, 2, 2)).toBe(true);
  });

  test('checkValidMove() - Deve validar movimento vertical na coluna 4 [6,4] -> [4,4]', () => {
    api.gameState.board[4][4] = 2;
    expect(api.checkValidMove(6, 4, 4, 4)).toBe(true);
  });

  test('checkValidMove() - Deve rejeitar movimento sem peça intermediária horizontal', () => {
    api.gameState.board[3][2] = 2;
    expect(api.checkValidMove(3, 1, 3, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento sem peça intermediária vertical', () => {
    api.gameState.board[2][3] = 2;
    expect(api.checkValidMove(1, 3, 3, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento com distância incorreta de 1 horizontal', () => {
    expect(api.checkValidMove(3, 1, 3, 2)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento com distância incorreta de 1 vertical', () => {
    expect(api.checkValidMove(2, 3, 3, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento com distância incorreta de 3 horizontal', () => {
    expect(api.checkValidMove(3, 0, 3, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento com distância incorreta de 3 vertical', () => {
    expect(api.checkValidMove(0, 3, 3, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento com distância incorreta de 4 horizontal', () => {
    expect(api.checkValidMove(3, 1, 3, 5)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento sem deslocamento [3,3] -> [3,3]', () => {
    expect(api.checkValidMove(3, 3, 3, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento diagonal [1,1] -> [3,3]', () => {
    expect(api.checkValidMove(1, 1, 3, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento diagonal [0,2] -> [2,4]', () => {
    expect(api.checkValidMove(0, 2, 2, 4)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento diagonal [2,0] -> [4,2]', () => {
    expect(api.checkValidMove(2, 0, 4, 2)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar movimento diagonal curto [2,2] -> [3,3]', () => {
    expect(api.checkValidMove(2, 2, 3, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar posição de origem fora dos limites [-1,3]', () => {
    expect(api.checkValidMove(-1, 3, 1, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar posição de destino fora dos limites [7,3]', () => {
    expect(api.checkValidMove(1, 3, 7, 3)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar posição de destino fora dos limites [3,7]', () => {
    expect(api.checkValidMove(3, 5, 3, 7)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar origem com coluna negativa [3,-1]', () => {
    expect(api.checkValidMove(3, -1, 3, 1)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar origem em célula inválida [0,0]', () => {
    expect(api.checkValidMove(0, 0, 2, 0)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar destino em célula inválida [0,0]', () => {
    expect(api.checkValidMove(2, 0, 0, 0)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar origem em célula inválida [0,1]', () => {
    expect(api.checkValidMove(0, 1, 2, 1)).toBe(false);
  });

  test('checkValidMove() - Deve rejeitar destino em célula inválida [0,1]', () => {
    expect(api.checkValidMove(2, 1, 0, 1)).toBe(false);
  });

  test('hasValidMoves() - Deve retornar true no estado inicial do jogo', () => {
    expect(api.hasValidMoves()).toBe(true);
  });

  test('hasValidMoves() - Deve detectar movimento válido com apenas uma peça móvel', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 1, 2, 0, 0],
      [2, 2, 2, 1, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(true);
  });

  test('hasValidMoves() - Deve detectar movimento possível apenas para cima', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 1, 2, 2, 2],
      [0, 0, 2, 1, 2, 0, 0],
      [0, 0, 2, 1, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(true);
  });

  test('hasValidMoves() - Deve detectar movimento possível apenas para baixo', () => {
    api.gameState.board = [
      [0, 0, 2, 1, 2, 0, 0],
      [0, 0, 2, 1, 2, 0, 0],
      [2, 2, 2, 1, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(true);
  });

  test('hasValidMoves() - Deve detectar movimento possível apenas para esquerda', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 1, 1, 1, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(true);
  });

  test('hasValidMoves() - Deve detectar movimento possível apenas para direita', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(true);
  });

  test('hasValidMoves() - Deve retornar false quando não há movimentos possíveis', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 1, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(false);
  });

  test('hasValidMoves() - Deve retornar false com duas peças isoladas', () => {
    api.gameState.board = [
      [0, 0, 1, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 1, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(false);
  });

  test('hasValidMoves() - Deve retornar false com apenas uma peça restante', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 1, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(false);
  });

  test('hasValidMoves() - Deve retornar false com múltiplas peças isoladas', () => {
    api.gameState.board = [
      [0, 0, 1, 2, 1, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [1, 2, 2, 2, 2, 2, 1],
      [2, 2, 2, 2, 2, 2, 2],
      [1, 2, 2, 2, 2, 2, 1],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 1, 2, 1, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(false);
  });

  test('hasValidMoves() - Deve retornar false com tabuleiro completamente vazio', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(false);
  });

  test('hasValidMoves() - Deve retornar false com peças no canto superior sem movimentos', () => {
    api.gameState.board = [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(false);
  });

  test('hasValidMoves() - Deve retornar false com peças no centro sem movimentos', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 1, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 1, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(false);
  });

  test('hasValidMoves() - Deve detectar movimentos na borda esquerda', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [1, 1, 1, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(true);
  });

  test('hasValidMoves() - Deve detectar movimentos na borda direita', () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    expect(api.hasValidMoves()).toBe(true);
  });

  test('getCellElement() - Deve retornar elemento da célula central [3,3]', () => {
    const cell = api.getCellElement(3, 3);
    expect(cell).toBeTruthy();
    expect(cell.dataset.row).toBe('3');
    expect(cell.dataset.col).toBe('3');
  });

  test('getCellElement() - Deve retornar elemento de célula com peça [2,2]', () => {
    const cell = api.getCellElement(2, 2);
    expect(cell).toBeTruthy();
    expect(cell.dataset.row).toBe('2');
    expect(cell.dataset.col).toBe('2');
    expect(cell.classList.contains('valid')).toBe(true);
  });

  test('getCellElement() - Deve retornar null para célula inexistente [10,10]', () => {
    const cell = api.getCellElement(10, 10);
    expect(cell).toBeNull();
  });

  test('getCellElement() - Deve retornar elemento do canto superior [0,2]', () => {
    const cell = api.getCellElement(0, 2);
    expect(cell).toBeTruthy();
    expect(cell.dataset.row).toBe('0');
    expect(cell.dataset.col).toBe('2');
  });

  test('getCellElement() - Deve retornar elemento do canto inferior [6,4]', () => {
    const cell = api.getCellElement(6, 4);
    expect(cell).toBeTruthy();
    expect(cell.dataset.row).toBe('6');
    expect(cell.dataset.col).toBe('4');
  });

  test('selectCell() - Deve atualizar gameState ao selecionar célula', async () => {
    api.selectCell(2, 2);
    await delay(20);
    expect(api.gameState.selectedCell).toEqual({ row: 2, col: 2 });
  });

  test('selectCell() - Deve adicionar classe selected ao elemento', async () => {
    api.selectCell(2, 2);
    await delay(20);
    const cell = api.getCellElement(2, 2);
    expect(cell.classList.contains('selected')).toBe(true);
  });

  test('selectCell() - Deve permitir selecionar células diferentes', async () => {
    api.selectCell(1, 3);
    await delay(20);
    expect(api.gameState.selectedCell).toEqual({ row: 1, col: 3 });
    api.selectCell(3, 5);
    await delay(20);
    expect(api.gameState.selectedCell).toEqual({ row: 3, col: 5 });
  });

  test('selectCell() - Deve atualizar seleção ao selecionar nova célula', async () => {
    api.selectCell(2, 2);
    await delay(20);
    expect(api.gameState.selectedCell.row).toBe(2);
    api.selectCell(3, 3);
    await delay(20);
    expect(api.gameState.selectedCell.row).toBe(3);
  });

  test('deselectCell() - Deve limpar gameState ao desselecionar', async () => {
    api.selectCell(2, 2);
    await delay(20);
    api.deselectCell();
    await delay(20);
    expect(api.gameState.selectedCell).toBeNull();
  });

  test('deselectCell() - Deve remover classe selected do elemento', async () => {
    api.selectCell(2, 2);
    await delay(20);
    const cell = api.getCellElement(2, 2);
    expect(cell.classList.contains('selected')).toBe(true);
    api.deselectCell();
    await delay(20);
    expect(cell.classList.contains('selected')).toBe(false);
  });

  test('deselectCell() - Não deve falhar quando não há célula selecionada', () => {
    expect(api.gameState.selectedCell).toBeNull();
    expect(() => api.deselectCell()).not.toThrow();
  });

  test('deselectCell() - Deve limpar animação da célula', async () => {
    api.selectCell(2, 2);
    await delay(20);
    const cell = api.getCellElement(2, 2);
    api.deselectCell();
    await delay(20);
    expect(cell.style.animation).toBe('');
  });

  test('removePieceFromCell() - Deve remover peça de célula ocupada', () => {
    const cell = api.getCellElement(2, 2);
    expect(cell.querySelector('.piece')).toBeTruthy();
    api.removePieceFromCell(2, 2);
    expect(cell.querySelector('.piece')).toBeNull();
  });

  test('removePieceFromCell() - Não deve falhar ao remover de célula vazia', () => {
    const cell = api.getCellElement(3, 3);
    expect(cell.querySelector('.piece')).toBeNull();
    expect(() => api.removePieceFromCell(3, 3)).not.toThrow();
    expect(cell.querySelector('.piece')).toBeNull();
  });

  test('removePieceFromCell() - Deve remover peças de múltiplas células', () => {
    api.removePieceFromCell(2, 2);
    api.removePieceFromCell(2, 3);
    api.removePieceFromCell(2, 4);
    expect(api.getCellElement(2, 2).querySelector('.piece')).toBeNull();
    expect(api.getCellElement(2, 3).querySelector('.piece')).toBeNull();
    expect(api.getCellElement(2, 4).querySelector('.piece')).toBeNull();
  });

  test('addPieceToCell() - Deve adicionar peça a célula vazia', () => {
    const cell = api.getCellElement(3, 3);
    expect(cell.querySelector('.piece')).toBeNull();
    api.addPieceToCell(3, 3);
    expect(cell.querySelector('.piece')).toBeTruthy();
    expect(cell.querySelector('.piece').className).toBe('piece');
  });

  test('addPieceToCell() - Não deve duplicar peça se já existe', () => {
    api.addPieceToCell(3, 3);
    const firstPiece = api.getCellElement(3, 3).querySelector('.piece');
    api.addPieceToCell(3, 3);
    const pieces = api.getCellElement(3, 3).querySelectorAll('.piece');
    expect(pieces.length).toBe(1);
  });

  test('addPieceToCell() - Deve adicionar peças a múltiplas células', () => {
    api.addPieceToCell(3, 3);
    api.addPieceToCell(4, 3);
    api.addPieceToCell(5, 3);
    expect(api.getCellElement(3, 3).querySelector('.piece')).toBeTruthy();
    expect(api.getCellElement(4, 3).querySelector('.piece')).toBeTruthy();
    expect(api.getCellElement(5, 3).querySelector('.piece')).toBeTruthy();
  });

  test('addPieceToCell() e removePieceFromCell() - Deve permitir remover e adicionar na mesma célula', () => {
    const cell = api.getCellElement(2, 2);
    expect(cell.querySelector('.piece')).toBeTruthy();
    api.removePieceFromCell(2, 2);
    expect(cell.querySelector('.piece')).toBeNull();
    api.addPieceToCell(2, 2);
    expect(cell.querySelector('.piece')).toBeTruthy();
  });

  test('updateGameStats() - Deve atualizar contador de peças restantes', () => {
    api.gameState.remainingPieces = 25;
    api.updateGameStats();
    const element = window.document.getElementById('remaining-pieces');
    expect(element.textContent).toBe('25');
  });

  test('updateGameStats() - Deve atualizar contador de movimentos', () => {
    api.gameState.movesCount = 10;
    api.updateGameStats();
    const element = window.document.getElementById('moves-count');
    expect(element.textContent).toBe('10');
  });

  test('updateGameStats() - Deve formatar tempo corretamente 00:00', () => {
    api.gameState.gameTime = 0;
    api.updateGameStats();
    const element = window.document.getElementById('game-time');
    expect(element.textContent).toBe('00:00');
  });

  test('updateGameStats() - Deve formatar tempo corretamente 01:30', () => {
    api.gameState.gameTime = 90;
    api.updateGameStats();
    const element = window.document.getElementById('game-time');
    expect(element.textContent).toBe('01:30');
  });

  test('updateGameStats() - Deve formatar tempo corretamente 00:05', () => {
    api.gameState.gameTime = 5;
    api.updateGameStats();
    const element = window.document.getElementById('game-time');
    expect(element.textContent).toBe('00:05');
  });

  test('updateGameStats() - Deve formatar tempo corretamente 10:45', () => {
    api.gameState.gameTime = 645;
    api.updateGameStats();
    const element = window.document.getElementById('game-time');
    expect(element.textContent).toBe('10:45');
  });

  test('updateGameStats() - Deve atualizar todos os stats simultaneamente', () => {
    api.gameState.remainingPieces = 15;
    api.gameState.movesCount = 17;
    api.gameState.gameTime = 120;
    api.updateGameStats();
    expect(window.document.getElementById('remaining-pieces').textContent).toBe(
      '15'
    );
    expect(window.document.getElementById('moves-count').textContent).toBe(
      '17'
    );
    expect(window.document.getElementById('game-time').textContent).toBe(
      '02:00'
    );
  });

  test('movePiece() - Deve atualizar tabuleiro após movimento', async () => {
    await delay(200);
    expect(api.gameState.board[3][1]).toBe(1);
    expect(api.gameState.board[3][2]).toBe(1);
    expect(api.gameState.board[3][3]).toBe(2);
    api.movePiece(3, 1, 3, 3);
    await delay(200);
    expect(api.gameState.board[3][1]).toBe(2);
    expect(api.gameState.board[3][2]).toBe(2);
    expect(api.gameState.board[3][3]).toBe(1);
  });

  test('movePiece() - Deve decrementar contador de peças', async () => {
    const initialPieces = api.gameState.remainingPieces;
    api.movePiece(3, 1, 3, 3);
    await delay(200);
    expect(api.gameState.remainingPieces).toBe(initialPieces - 1);
  });

  test('movePiece() - Deve incrementar contador de movimentos', async () => {
    const initialMoves = api.gameState.movesCount;
    api.movePiece(3, 1, 3, 3);
    await delay(200);
    expect(api.gameState.movesCount).toBe(initialMoves + 1);
  });

  test('movePiece() - Deve remover peça intermediária', async () => {
    api.movePiece(1, 3, 3, 3);
    await delay(200);
    const middleCell = api.getCellElement(2, 3);
    expect(middleCell.querySelector('.piece')).toBeNull();
  });

  test('movePiece() - Deve adicionar peça ao destino', async () => {
    const destCell = api.getCellElement(3, 3);
    expect(destCell.querySelector('.piece')).toBeNull();
    api.movePiece(1, 3, 3, 3);
    await delay(200);
    expect(destCell.querySelector('.piece')).toBeTruthy();
  });

  test('movePiece() - Deve remover peça da origem', async () => {
    const originCell = api.getCellElement(1, 3);
    expect(originCell.querySelector('.piece')).toBeTruthy();
    api.movePiece(1, 3, 3, 3);
    await delay(200);
    expect(originCell.querySelector('.piece')).toBeNull();
  });

  test('movePiece() - Deve executar múltiplos movimentos sequencialmente', async () => {
    api.movePiece(3, 1, 3, 3);
    await delay(200);
    expect(api.gameState.movesCount).toBe(1);
    api.movePiece(3, 4, 3, 2);
    await delay(200);
    expect(api.gameState.movesCount).toBe(2);
    api.movePiece(3, 6, 3, 4);
    await delay(200);
    expect(api.gameState.movesCount).toBe(3);
  });

  test('movePiece() - Deve atualizar stats após movimento', async () => {
    api.movePiece(3, 1, 3, 3);
    await delay(200);
    const piecesElement = window.document.getElementById('remaining-pieces');
    const movesElement = window.document.getElementById('moves-count');
    expect(piecesElement.textContent).toBe('31');
    expect(movesElement.textContent).toBe('1');
  });

  test('handleCellClick() - Deve selecionar peça ao clicar', async () => {
    api.handleCellClick(2, 2);
    await delay(20);
    expect(api.gameState.selectedCell).toEqual({ row: 2, col: 2 });
  });

  test('handleCellClick() - Não deve selecionar célula vazia', async () => {
    api.handleCellClick(3, 3);
    await delay(20);
    expect(api.gameState.selectedCell).toBeNull();
  });

  test('handleCellClick() - Deve desselecionar ao clicar na mesma peça', async () => {
    api.handleCellClick(2, 2);
    await delay(20);
    expect(api.gameState.selectedCell).toBeTruthy();
    api.handleCellClick(2, 2);
    await delay(20);
    expect(api.gameState.selectedCell).toBeNull();
  });

  test('handleCellClick() - Deve trocar seleção ao clicar em outra peça', async () => {
    api.handleCellClick(2, 2);
    await delay(20);
    expect(api.gameState.selectedCell).toEqual({ row: 2, col: 2 });
    api.handleCellClick(2, 3);
    await delay(20);
    expect(api.gameState.selectedCell).toEqual({ row: 2, col: 3 });
  });

  test('handleCellClick() - Deve executar movimento válido', async () => {
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    expect(api.gameState.board[3][3]).toBe(1);
    expect(api.gameState.board[3][1]).toBe(2);
    expect(api.gameState.selectedCell).toBeNull();
  });

  test('handleCellClick() - Não deve alterar estado em movimento inválido', async () => {
    const boardCopy = JSON.parse(JSON.stringify(api.gameState.board));
    api.handleCellClick(2, 2);
    await delay(20);
    api.handleCellClick(4, 4);
    await delay(200);
    expect(api.gameState.board).toEqual(boardCopy);
  });

  test('handleCellClick() - Deve executar sequência de movimentos', async () => {
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    expect(api.gameState.movesCount).toBe(1);
    api.handleCellClick(3, 4);
    await delay(20);
    api.handleCellClick(3, 2);
    await delay(200);
    expect(api.gameState.movesCount).toBe(2);
  });

  test('handleCellClick() - Deve atualizar contador de peças restantes', async () => {
    const initialPieces = api.gameState.remainingPieces;
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    expect(api.gameState.remainingPieces).toBe(initialPieces - 1);
  });
});

describe('Testes de integração', () => {
  let dom, window, api, confirmSpy;

  beforeAll(() => {
    const rawScript = fs.readFileSync(
      path.resolve(__dirname, 'script.js'),
      'utf8'
    );
    const modifiedScript = prepareScriptForTests(rawScript);
    dom = createDom(modifiedScript);
    window = dom.window;
  });

  beforeEach(async () => {
    await delay(20);
    api = window.__TEST__;
    api.initGame();
  });

  afterEach(() => {});

  afterAll(() => {
    window.close();
  });

  test('Deve ativar flag isGameActive ao iniciar jogo', () => {
    expect(api.gameState.isGameActive).toBe(false);
    api.startGame();
    expect(api.gameState.isGameActive).toBe(true);
  });

  test('Deve inicializar startTime ao iniciar jogo', () => {
    expect(api.gameState.startTime).toBeNull();
    api.startGame();
    expect(api.gameState.startTime).toBeTruthy();
    expect(typeof api.gameState.startTime).toBe('number');
  });

  test('Deve criar timerInterval ao iniciar jogo', () => {
    expect(api.gameState.timerInterval).toBeNull();
    api.startGame();
    expect(api.gameState.timerInterval).toBeTruthy();
  });

  test('Deve incrementar gameTime automaticamente após 1 segundo', async () => {
    api.startGame();
    const initialTime = api.gameState.gameTime;
    await delay(1100);
    expect(api.gameState.gameTime).toBeGreaterThan(initialTime);
  });

  test('Deve atualizar stats automaticamente durante o jogo', async () => {
    api.startGame();
    await delay(1100);
    const timeElement = window.document.getElementById('game-time');
    expect(timeElement.textContent).not.toBe('00:00');
  });

  test('Deve iniciar jogo automaticamente no primeiro movimento', async () => {
    expect(api.gameState.isGameActive).toBe(false);
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    expect(api.gameState.isGameActive).toBe(true);
  });

  test('Não deve reiniciar timer em movimentos subsequentes', async () => {
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    const firstStartTime = api.gameState.startTime;
    api.handleCellClick(3, 4);
    await delay(20);
    api.handleCellClick(3, 2);
    await delay(200);
    expect(api.gameState.startTime).toBe(firstStartTime);
  });

  test('Deve desativar flag isGameActive ao finalizar jogo', async () => {
    api.startGame();
    expect(api.gameState.isGameActive).toBe(true);
    api.endGame();
    await delay(400);
    expect(api.gameState.isGameActive).toBe(false);
  });

  test('Deve limpar timerInterval ao finalizar jogo', async () => {
    api.startGame();
    const interval = api.gameState.timerInterval;
    expect(interval).toBeTruthy();
    api.endGame();
    await delay(400);
    expect(api.gameState.timerInterval).toBeNull();
  });

  test('Deve parar incremento de gameTime após endGame', async () => {
    api.startGame();
    await delay(500);
    api.endGame();
    await delay(400);
    const timeAfterEnd = api.gameState.gameTime;
    await delay(1100);
    expect(api.gameState.gameTime).toBe(timeAfterEnd);
  });

  test('Não deve falhar ao finalizar jogo já inativo', () => {
    expect(api.gameState.isGameActive).toBe(false);
    expect(() => api.endGame()).not.toThrow();
  });

  test('Deve executar sequência completa de 5 movimentos válidos', async () => {
    const moves = [
      { from: [3, 1], to: [3, 3] },
      { from: [1, 2], to: [3, 2] },
      { from: [4, 2], to: [2, 2] },
      { from: [3, 4], to: [3, 2] },
      { from: [1, 4], to: [3, 4] },
    ];

    for (let i = 0; i < moves.length; i++) {
      const [fromRow, fromCol] = moves[i].from;
      const [toRow, toCol] = moves[i].to;
      api.handleCellClick(fromRow, fromCol);
      await delay(20);
      api.handleCellClick(toRow, toCol);
      await delay(200);
      expect(api.gameState.movesCount).toBe(i + 1);
    }

    expect(api.gameState.remainingPieces).toBe(27);
  });

  test('Deve atualizar DOM após cada movimento da sequência', async () => {
    const movesElement = window.document.getElementById('moves-count');
    const piecesElement = window.document.getElementById('remaining-pieces');

    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    expect(movesElement.textContent).toBe('1');
    expect(piecesElement.textContent).toBe('31');

    api.handleCellClick(1, 2);
    await delay(20);
    api.handleCellClick(3, 2);
    await delay(200);
    expect(movesElement.textContent).toBe('2');
    expect(piecesElement.textContent).toBe('30');
  });

  test('Deve manter integridade do contador de peças durante sequência', async () => {
    let totalPieces = 0;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (api.gameState.board[row][col] === 1) totalPieces++;
      }
    }
    expect(totalPieces).toBe(32);

    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);

    totalPieces = 0;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (api.gameState.board[row][col] === 1) totalPieces++;
      }
    }
    expect(totalPieces).toBe(31);
  });

  test('Deve detectar condição de vitória com 1 peça restante', async () => {
    api.initGame();
    await delay(600);

    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 1, 2, 0, 0],
      [2, 2, 2, 1, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    api.gameState.remainingPieces = 2;

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (api.gameState.board[row][col] !== 0) {
          api.removePieceFromCell(row, col);
        }
      }
    }

    api.addPieceToCell(1, 3);
    api.addPieceToCell(2, 3);

    expect(api.hasValidMoves()).toBe(true);

    api.handleCellClick(1, 3);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(400);

    expect(api.gameState.remainingPieces).toBe(1);
    expect(api.hasValidMoves()).toBe(false);
  });

  test('Deve detectar condição de derrota com peças isoladas', async () => {
    api.gameState.board = [
      [0, 0, 1, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 1],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 1, 0, 0],
    ];
    api.gameState.remainingPieces = 3;
    expect(api.hasValidMoves()).toBe(false);
  });

  test('Deve rastrear tempo decorrido corretamente durante o jogo', async () => {
    expect(api.gameState.gameTime).toBe(0);
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    expect(api.gameState.isGameActive).toBe(true);
    await delay(1100);
    expect(api.gameState.gameTime).toBeGreaterThanOrEqual(1);
  });

  test('Deve manter estatísticas consistentes durante o jogo', async () => {
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    expect(api.gameState.movesCount).toBe(1);
    expect(api.gameState.remainingPieces).toBe(31);

    api.handleCellClick(1, 2);
    await delay(20);
    api.handleCellClick(3, 2);
    await delay(200);
    expect(api.gameState.movesCount).toBe(2);
    expect(api.gameState.remainingPieces).toBe(30);

    expect(window.document.getElementById('moves-count').textContent).toBe('2');
    expect(window.document.getElementById('remaining-pieces').textContent).toBe(
      '30'
    );
  });

  test('Deve resetar todos os estados ao chamar initGame', async () => {
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    await delay(500);
    expect(api.gameState.movesCount).toBeGreaterThan(0);
    expect(api.gameState.remainingPieces).toBeLessThan(32);

    api.initGame();
    await delay(600);
    expect(api.gameState.movesCount).toBe(0);
    expect(api.gameState.remainingPieces).toBe(32);
    expect(api.gameState.gameTime).toBe(0);
    expect(api.gameState.selectedCell).toBeNull();
    expect(api.gameState.isGameActive).toBe(false);
  });

  test('Deve parar timer ao reiniciar jogo', async () => {
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    await delay(1100);
    expect(api.gameState.gameTime).toBeGreaterThan(0);

    api.initGame();
    await delay(600);
    expect(api.gameState.gameTime).toBe(0);
    expect(api.gameState.timerInterval).toBeNull();
  });

  test('Deve recriar tabuleiro inicial ao reiniciar jogo', async () => {
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);
    expect(api.gameState.board[3][3]).toBe(1);

    api.initGame();
    await delay(600);
    expect(api.gameState.board[3][3]).toBe(2);
    expect(api.gameState.board[3][2]).toBe(1);
  });

  test('Deve encerrar o jogo automaticamente quando não há mais movimentos possíveis', async () => {
    api.initGame();
    await delay(600);

    api.gameState.board = [
      [0, 0, 2, 1, 2, 0, 0],
      [0, 0, 2, 1, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    api.gameState.remainingPieces = 2;

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (api.gameState.board[row][col] !== 0) {
          api.removePieceFromCell(row, col);
        }
      }
    }

    api.addPieceToCell(0, 3);
    api.addPieceToCell(1, 3);

    api.startGame();
    expect(api.gameState.isGameActive).toBe(true);

    api.handleCellClick(0, 3);
    await delay(20);
    api.handleCellClick(2, 3);
    await delay(600);

    expect(api.gameState.remainingPieces).toBe(1);
    expect(api.hasValidMoves()).toBe(false);
    expect(api.gameState.isGameActive).toBe(false);
  });

  test('Deve lidar corretamente com múltiplas seleções e desseleções', async () => {
    api.handleCellClick(2, 2);
    await delay(20);
    expect(api.gameState.selectedCell).toBeTruthy();
    api.handleCellClick(2, 2);
    await delay(20);
    expect(api.gameState.selectedCell).toBeNull();
    api.handleCellClick(3, 1);
    await delay(20);
    expect(api.gameState.selectedCell).toBeTruthy();
    api.handleCellClick(3, 1);
    await delay(20);
    expect(api.gameState.selectedCell).toBeNull();
  });

  test('Deve validar movimentos antes de executá-los', async () => {
    const initialBoard = JSON.parse(JSON.stringify(api.gameState.board));
    api.handleCellClick(2, 2);
    await delay(20);
    api.handleCellClick(5, 5);
    await delay(200);
    expect(api.gameState.board).toEqual(initialBoard);
    expect(api.gameState.movesCount).toBe(0);
  });

  test('Deve manter sincronização entre gameState e DOM', async () => {
    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);

    expect(api.gameState.board[3][3]).toBe(1);
    expect(api.gameState.board[3][1]).toBe(2);

    expect(api.getCellElement(3, 3).querySelector('.piece')).toBeTruthy();
    expect(api.getCellElement(3, 1).querySelector('.piece')).toBeNull();
  });

  test('Não deve permitir movimentos após fim de jogo', async () => {
    api.gameState.board = [
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 1, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
    ];
    api.gameState.remainingPieces = 1;
    api.gameState.isGameActive = false;

    const initialMoves = api.gameState.movesCount;
    api.handleCellClick(3, 3);
    await delay(200);
    expect(api.gameState.movesCount).toBe(initialMoves);
  });

  test('Deve recalcular peças corretamente a cada movimento', async () => {
    let countInBoard = 0;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (api.gameState.board[row][col] === 1) countInBoard++;
      }
    }
    expect(countInBoard).toBe(api.gameState.remainingPieces);

    api.handleCellClick(3, 1);
    await delay(20);
    api.handleCellClick(3, 3);
    await delay(200);

    countInBoard = 0;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (api.gameState.board[row][col] === 1) countInBoard++;
      }
    }
    expect(countInBoard).toBe(api.gameState.remainingPieces);
  });
});
