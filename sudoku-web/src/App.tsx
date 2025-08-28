import { useState, useEffect } from "react";
import Sudoku from "./sudoku";
import "./App.css";


export default function App() {
const [started, setStarted] = useState(false);
const [gameKey, setGameKey] = useState(0);
const [time, setTime] = useState(0);
const [intervalId, setIntervalId] = useState<number | null>(null);


const formatTime = (seconds: number) => {
const mins = Math.floor(seconds / 60);
const secs = seconds % 60;
return `${mins}:${secs.toString().padStart(2, "0")}`;
};


const startGame = () => {
setStarted(true);
newGame();
};


const newGame = () => {
setTime(0);
setGameKey((k) => k + 1);
if (intervalId) clearInterval(intervalId);
const id = window.setInterval(() => setTime((t) => t + 1), 1000);
setIntervalId(id);
};


const onPuzzleComplete = () => {
if (intervalId) clearInterval(intervalId);
setIntervalId(null);
};


useEffect(() => {
return () => {
if (intervalId) clearInterval(intervalId);
};
}, [intervalId]);


return (
<div className="app-container">
<h1>SUDOKU</h1>
{!started ? (
  // Show the "New Game" button when the game has not started yet.
<button onClick={startGame} className="btn">New Game</button>
) : (
<>
<div className="timer">⏱ {formatTime(time)}</div>
<Sudoku key={gameKey} onNewGame={newGame} onPuzzleComplete={onPuzzleComplete} />
</>
)}
</div>
);
}