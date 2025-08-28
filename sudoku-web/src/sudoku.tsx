import React, { useState, useEffect, useRef, TouchEvent, MouseEvent } from "react";
import "./sudoku.css";

// Define custom types for the Sudoku board cells and the entire board.
// A cell can be a number, a Set of numbers (for pencil marks), or null (empty).
type Cell = number | Set<number> | null;
// The board is a 2D array of cells.
type Board = Cell[][];
// Type for cell coordinates.
type Coords = { r: number; c: number };

// Helper function to create a deep clone of the board.
const cloneBoard = (b: Board): Board =>
  b.map(row => row.map(cell => (cell instanceof Set ? new Set(cell) : cell)));

// Function to generate a new, random Sudoku puzzle and its solution.
const generateNewPuzzle = () => {
  const emptyBoard = Array.from({ length: 9 }, () => Array(9).fill(null));
  const solution = solve(cloneBoard(emptyBoard));
  if (!solution) throw new Error("Failed to generate a solution.");


  // The 'puzzle' is a new board created from the solved one by removing numbers.
  const puzzle = cloneBoard(solution);
  let cellsToRemove = Math.floor(Math.random() * (50 - 40 + 1)) + 46; // Remove between 40 and 50 cells.

  while (cellsToRemove > 0) {
    // Pick a random cell.
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);

    if (puzzle[r][c] !== null) {
      const backup = puzzle[r][c];
      puzzle[r][c] = null;
      // Check if the puzzle still has a unique solution.
      if (countSolutions(cloneBoard(puzzle)) === 1) {
        cellsToRemove--;
      } else {
        // If not, put the number back.
        puzzle[r][c] = backup;
      }
    }
  }

  return { puzzle, solution };
};

// Backtracking function to solve the Sudoku board.
const solve = (b: Board): Board | null => {
  const board = cloneBoard(b);
  const findEmpty = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === null) return [r, c];
      }
    }
    return null;
  };

  const isValid = (num: number, pos: number[]): boolean => {
    const [r, c] = pos;
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === num && i !== c) return false;
      if (board[i][c] === num && i !== r) return false;
    }
    const boxRow = Math.floor(r / 3) * 3;
    const boxCol = Math.floor(c / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (board[i][j] === num && (i !== r || j !== c)) return false;
      }
    }
    return true;
  };

  const emptyPos = findEmpty();
  if (!emptyPos) return board;

  const [r, c] = emptyPos;
  const numbers = Array.from({ length: 9 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);

  for (const num of numbers) {
    board[r][c] = num;
    if (isValid(num, emptyPos)) {
      const solved = solve(board);
      if (solved) return solved;
    }
    board[r][c] = null;
  }
  return null;
};

// Function to count the number of solutions for a given board.
const countSolutions = (b: Board): number => {
  const findEmpty = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === null) return [r, c];
      }
    }
    return null;
  };
  const isValid = (num: number, pos: number[]): boolean => {
    const [r, c] = pos;
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === num) return false;
      if (b[i][c] === num) return false;
    }
    const boxRow = Math.floor(r / 3) * 3;
    const boxCol = Math.floor(c / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (b[i][j] === num) return false;
      }
    }
    return true;
  };
  
  let solutions = 0;
  const backtrack = (board: Board) => {
    const emptyPos = findEmpty();
    if (!emptyPos) {
      solutions++;
      return;
    }
    const [r, c] = emptyPos;
    for (let num = 1; num <= 9; num++) {
      if (isValid(num, emptyPos)) {
        board[r][c] = num;
        backtrack(board);
        if (solutions > 1) return; // Stop early if multiple solutions are found.
        board[r][c] = null;
      }
    }
  };
  backtrack(b);
  return solutions;
};

// Main Sudoku component. It now accepts a prop to handle the new game.
type SudokuProps = {
  onNewGame: () => void;
  onPuzzleComplete: () => void;
};

export default function Sudoku({ onNewGame, onPuzzleComplete }: SudokuProps)  {
  // State variables for the component.
  const [puzzleAndSolution, setPuzzleAndSolution] = useState(() => generateNewPuzzle());
  const [board, setBoard] = useState<Board>(cloneBoard(puzzleAndSolution.puzzle));
  const [pencilMode, setPencilMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Coords[]>([]);
  const [highlightNum, setHighlightNum] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect" | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);


  // Function to start a new game with a new, randomly generated puzzle.
  const newGame = () => {
    const newPuzzle = generateNewPuzzle();
    setPuzzleAndSolution(newPuzzle);
    setBoard(cloneBoard(newPuzzle.puzzle));
    setSelectedCells([]);
    setHighlightNum(null);
    setCompleted(false);
    onNewGame();
    gameContainerRef.current?.focus();
  };

  // Function to solve the game instantly.
  const solveGame = () => {
    setBoard(cloneBoard(puzzleAndSolution.solution));
    setCompleted(true);
    setSelectedCells([]);
    setHighlightNum(null);
    onPuzzleComplete();
    gameContainerRef.current?.blur();
  };

  // Check if a cell is part of the original, "given" puzzle.
  const isGiven = (r: number, c: number) => puzzleAndSolution.puzzle[r][c] !== null;

  // Check if a cell is currently selected.
  const isSelected = (r: number, c: number) => selectedCells.some(cell => cell.r === r && cell.c === c);

  // Handler for mouse down event on a cell (for desktop).
  const onCellMouseDown = (r: number, c: number, e: MouseEvent<HTMLDivElement>) => {
    if (completed) return;
    gameContainerRef.current?.focus();
    setIsMouseDown(true);
    
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd) {
      const isCurrentlySelected = isSelected(r, c);
      if (isCurrentlySelected) {
        setSelectedCells(prev => prev.filter(cell => cell.r !== r || cell.c !== c));
        setDragMode("deselect");
      } else {
        setSelectedCells(prev => [...prev, { r, c }]);
        setDragMode("select");
      }
    } else {
      setSelectedCells([{ r, c }]);
      setDragMode(null);
    }
    const cell = board[r][c];
    setHighlightNum(typeof cell === "number" ? cell : null);
  };
  
  // Handler for touch start event on a cell (for mobile).
  const onCellTouchStart = (r: number, c: number) => {
    if (completed) return;
    hiddenInputRef.current?.focus();
    setSelectedCells([{ r, c }]);
    const cell = board[r][c];
    setHighlightNum(typeof cell === "number" ? cell : null);
  };

  // Handler for mouse enter event during drag.
  const onCellMouseEnter = (r: number, c: number) => {
    const isMobile = window.innerWidth <= 768;
    if (!isMouseDown || isMobile) return;
    
    setSelectedCells(prev => {
      const isCurrentlySelected = prev.some(cell => cell.r === r && cell.c === c);
      if (dragMode === "deselect") {
        return prev.filter(cell => cell.r !== r || cell.c !== c);
      } else {
        if (!isCurrentlySelected) {
          return [...prev, {r, c}];
        }
        return prev;
      }
    });
  };

  // Handler for mouse up event on the board.
  const onBoardMouseUp = () => {
    setIsMouseDown(false);
    setDragMode(null);
  };

  // Handler for keyboard events on the board.
  const onBoardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (completed) return;
    
    const key = e.key;
    const digit = parseInt(key, 10);

    const nextBoard = cloneBoard(board);

    if (selectedCells.length === 0) return;

    if (key === "Backspace" || key === "Delete") {
      selectedCells.forEach(({ r, c }) => {
        if (!isGiven(r, c)) {
          nextBoard[r][c] = null;
        }
      });
      setBoard(nextBoard);
      e.preventDefault();
      return;
    }

    if (isNaN(digit) || digit < 1 || digit > 9) return;

    const isPencilInput = pencilMode || e.ctrlKey || e.metaKey;

    if (isPencilInput) {
      const pencilMarkExistsInAll = selectedCells.every(({ r, c }) => {
        const cell = nextBoard[r][c];
        return cell instanceof Set && cell.has(digit);
      });

      selectedCells.forEach(({ r, c }) => {
        if (isGiven(r, c)) return;
        
        const cell = nextBoard[r][c];
        const candidates = cell instanceof Set ? new Set(cell) : new Set<number>();

        if (pencilMarkExistsInAll) {
          candidates.delete(digit);
        } else {
          candidates.add(digit);
        }
        nextBoard[r][c] = candidates.size ? candidates : null;
      });
    } else {
      const numberExistsInAll = selectedCells.every(({ r, c }) => {
        const cell = nextBoard[r][c];
        return typeof cell === 'number' && cell === digit;
      });

      selectedCells.forEach(({ r, c }) => {
        if (isGiven(r, c)) return;

        if (numberExistsInAll) {
          nextBoard[r][c] = null;
        } else {
          nextBoard[r][c] = digit;
          removeCandidates(nextBoard, r, c, digit);
        }
      });
    }

    setBoard(nextBoard);
    const puzzleCompleted = isPuzzleCompleted(nextBoard);
    if (puzzleCompleted) {
      setHighlightNum(null);
      setCompleted(true);
      setSelectedCells([]);
      onPuzzleComplete();
      gameContainerRef.current?.blur();
    } else {
      setHighlightNum(digit);
    }
    e.preventDefault();
  };

  const removeCandidates = (b: Board, row: number, col: number, value: number) => {
    for (let i = 0; i < 9; i++) {
      if (b[row][i] instanceof Set) (b[row][i] as Set<number>).delete(value);
      if (b[i][col] instanceof Set) (b[i][col] as Set<number>).delete(value);
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (b[r][c] instanceof Set) (b[r][c] as Set<number>).delete(value);
      }
    }
  };

  const hasConflict = (b: Board, row: number, col: number): boolean => {
    const val = b[row][col];
    if (typeof val !== "number") return false;

    for (let i = 0; i < 9; i++) {
      if (i !== col && b[row][i] === val) return true;
      if (i !== row && b[i][col] === val) return true;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && b[r][c] === val) return true;
      }
    }
    return false;
  };

  const pencilConflict = (b: Board, row: number, col: number, num: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (b[row][i] === num) return true;
      if (b[i][col] === num) return true;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (b[r][c] === num) return true;
      }
    }
    return false;
  };

  const isPuzzleCompleted = (b: Board) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] !== puzzleAndSolution.solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  };
  
  const isHighlighted = (cell: Cell) => {
    if (highlightNum == null) return false;
    if (typeof cell === "number") return cell === highlightNum;
    if (cell instanceof Set) return cell.has(highlightNum);
    return false;
  };

  return (
    <div 
        ref={gameContainerRef} 
        onMouseUp={onBoardMouseUp} 
        onKeyDown={onBoardKeyDown} 
        tabIndex={0}
        className="sudoku-game-container"
    >
      <input 
        ref={hiddenInputRef}
        className="hidden-input"
        tabIndex={-1}
        type="tel"
      />
      <div className="button-bar">
        <button className="btn secondary" onClick={() => setPencilMode(p => !p)}>
          ✏️ {pencilMode ? "Pencil ON" : "Pencil OFF"}
        </button>
        <button className="btn primary" onClick={newGame}>
          🔄 New Game
        </button>
        <button className="btn primary" onClick={solveGame}>
          ✅ Solve
        </button>
      </div>

      {completed && <div className="completed-banner">🎉 Puzzle Completed!</div>}

      <div className={`sudoku-board ${completed ? "game-over" : ""}`}>
        {board.map((row, r) => (
          <div key={r} className="row">
            {row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={
                  "cell" +
                  (isHighlighted(cell) ? " highlight" : "") +
                  (isSelected(r, c) ? " selected" : "") +
                  (hasConflict(board, r, c) ? " conflict" : "") +
                  (isGiven(r, c) ? " given" : "")
                }
                onMouseDown={(e) => onCellMouseDown(r, c, e)}
                onTouchStart={() => onCellTouchStart(r,c)}
                onMouseEnter={() => onCellMouseEnter(r, c)}
              >
                {cell instanceof Set ? (
                  <div className="pencil">
                    {Array.from({ length: 9 }, (_, i) => {
                      const n = i + 1;
                      const isConflict = pencilConflict(board, r, c, n);
                      return (
                        <span
                          key={n}
                          className={
                            cell.has(n)
                              ? isConflict
                                ? "pencil-num conflict"
                                : "pencil-num"
                              : "pencil-empty"
                          }
                        >
                          {cell.has(n) ? n : ""}
                        </span>
                      );
                    })}
                  </div>
                ) : typeof cell === "number" ? (
                  <span className={isGiven(r, c) ? "cell-text given" : "cell-text"}>
                    {cell}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}