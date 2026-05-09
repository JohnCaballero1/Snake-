/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Gamepad2, 
  Info, 
  Settings, 
  Play, 
  RotateCcw, 
  ChevronRight,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Moving up

type Point = { x: number; y: number };
type Difficulty = 'Facil' | 'Normal' | 'Dificil' | 'Extremo';

const SPEEDS: Record<Difficulty, number> = {
  'Facil': 150,
  'Normal': 100,
  'Dificil': 70,
  'Extremo': 40
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');
  const [gameStarted, setGameStarted] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // --- Sound Utils (Simulated with visual feedback for now) ---
  const [flash, setFlash] = useState(false);

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      };
      // Ensure food doesn't spawn on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setGameStarted(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + nextDirection.x,
        y: head.y + nextDirection.y
      };

      // Collision detection: Walls
      if (
        newHead.x < 0 || 
        newHead.x >= CANVAS_SIZE / GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= CANVAS_SIZE / GRID_SIZE
      ) {
        setIsGameOver(true);
        return prevSnake;
      }

      // Collision detection: Self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Eating food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
        setFlash(true);
        setTimeout(() => setFlash(false), 100);
      } else {
        newSnake.pop(); // Remove tail
      }

      setDirection(nextDirection);
      return newSnake;
    });
  }, [nextDirection, food, generateFood, highScore]);

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && !isGameOver && (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key))) {
        setGameStarted(true);
      }

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setNextDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setNextDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setNextDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setNextDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted, isGameOver]);

  // --- Game Loop ---
  useEffect(() => {
    let frameId: number;
    
    const loop = (time: number) => {
      if (gameStarted && !isGameOver) {
        if (time - lastUpdateTime > SPEEDS[difficulty]) {
          moveSnake();
          setLastUpdateTime(time);
        }
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameStarted, isGameOver, difficulty, lastUpdateTime, moveSnake]);

  // --- Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Grid (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw Food
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(
      food.x * GRID_SIZE + 2, 
      food.y * GRID_SIZE + 2, 
      GRID_SIZE - 4, 
      GRID_SIZE - 4, 
      4
    );
    ctx.fill();

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.shadowBlur = isHead ? 20 : 0;
      ctx.shadowColor = '#22c55e';
      ctx.fillStyle = isHead ? '#4ade80' : `rgba(34, 197, 94, ${1 - index / (snake.length + 5)})`;
      
      const padding = isHead ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        segment.x * GRID_SIZE + padding, 
        segment.y * GRID_SIZE + padding, 
        GRID_SIZE - (padding * 2), 
        GRID_SIZE - (padding * 2), 
        isHead ? 6 : 4
      );
      ctx.fill();

      // Eyes if head
      if (isHead) {
        ctx.fillStyle = '#064e3b';
        ctx.shadowBlur = 0;
        const eyeSize = 3;
        // Direction based adjustment for eyes
        if (direction.x === 1) { // Right
          ctx.fillRect(segment.x * GRID_SIZE + 13, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + 13, segment.y * GRID_SIZE + 12, eyeSize, eyeSize);
        } else if (direction.x === -1) { // Left
          ctx.fillRect(segment.x * GRID_SIZE + 4, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + 4, segment.y * GRID_SIZE + 12, eyeSize, eyeSize);
        } else if (direction.y === -1) { // Up
          ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 4, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + 12, segment.y * GRID_SIZE + 4, eyeSize, eyeSize);
        } else { // Down
          ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 13, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + 12, segment.y * GRID_SIZE + 13, eyeSize, eyeSize);
        }
      }
    });

    // Reset shadow
    ctx.shadowBlur = 0;

  }, [snake, food, direction]);

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-100 font-sans flex flex-col md:flex-row overflow-hidden transition-colors ${flash ? 'bg-slate-900' : ''}`}>
      
      {/* --- Sidebar --- */}
      <aside className="w-full md:w-80 bg-[#0f172a] border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col gap-8">
        <header className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Gamepad2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Neon Snake</h1>
        </header>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Instrucciones</span>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50 text-sm leading-relaxed text-slate-300">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                Usa las flechas para moverte.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                Come los cuadros rojos.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-rose-400 rounded-full" />
                No choques con paredes o contigo.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </div>
          <div className="flex flex-col gap-2">
            {(Object.keys(SPEEDS) as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => {
                  setDifficulty(level);
                  if (!gameStarted) resetGame();
                }}
                disabled={gameStarted && !isGameOver}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  difficulty === level 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                } group disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <Zap className={`w-4 h-4 ${difficulty === level ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="font-medium">{level}</span>
                </div>
                {difficulty === level && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-auto pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Max Puntos</div>
            <div className="text-xl font-mono text-amber-400 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              {highScore}
            </div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">FPS Meta</div>
             <div className="text-xl font-mono text-emerald-400 flex items-center gap-2">
               <BarChart3 className="w-4 h-4" />
               {Math.floor(1000 / SPEEDS[difficulty])}
             </div>
          </div>
        </div>
      </aside>

      {/* --- Main Game Area --- */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative bg-[#020617] pattern-dots">
        
        {/* HUD Top */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-[400px] flex justify-between items-end px-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1">Puntos Actuales</span>
            <span className="text-4xl font-mono font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {score.toString().padStart(4, '0')}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1 text-right">Dificultad</span>
            <span className="text-xs px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded uppercase font-bold tracking-widest">
              {difficulty}
            </span>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="relative group">
          {/* Neon Border */}
          <div className={`absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity duration-1000 ${isGameOver ? 'from-rose-500 to-red-600 opacity-40' : ''}`} />
          
          <div className="relative bg-slate-950 rounded-lg shadow-2xl overflow-hidden border border-slate-800">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="max-w-full h-auto cursor-none lg:w-[600px] lg:h-[600px]"
            />

            {/* Overlays */}
            <AnimatePresence>
              {!gameStarted && !isGameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-8 backdrop-blur-[2px]"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="p-4 bg-emerald-500/20 rounded-full mb-6"
                  >
                    <Target className="w-12 h-12 text-emerald-400" />
                  </motion.div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">¿LISTO PARA CAZAR?</h2>
                  <p className="text-slate-400 text-sm mb-8 max-w-[240px]">Pulsa cualquier flecha del teclado o el botón de abajo para empezar.</p>
                  <button 
                    onClick={() => setGameStarted(true)}
                    className="group relative px-8 py-3 bg-emerald-500 text-slate-950 font-black rounded-full transition-transform active:scale-95 flex items-center gap-2 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                    <Play className="w-5 h-5" />
                    EMPEZAR JUEGO
                  </button>
                </motion.div>
              )}

              {isGameOver && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-rose-950/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-[4px]"
                >
                  <motion.div 
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    className="text-white space-y-4"
                  >
                    <h2 className="text-5xl font-black mb-2 tracking-tighter text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">GAME OVER</h2>
                    <div className="bg-rose-900/40 border border-rose-500/30 p-6 rounded-2xl">
                      <div className="text-sm text-rose-300/70 uppercase font-black tracking-widest mb-1">Tu Puntuación</div>
                      <div className="text-6xl font-mono font-black text-white">{score}</div>
                      {score >= highScore && score > 0 && (
                        <div className="mt-2 text-amber-400 text-xs font-bold tracking-widest flex items-center justify-center gap-2">
                          <Trophy className="w-3 h-3" /> ¡NUEVO RÉCORD!
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={resetGame}
                        className="flex-1 px-8 py-4 bg-white text-rose-950 font-black rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                      >
                        <RotateCcw className="w-5 h-5" />
                        REINTENTAR
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* HUD Bottom Info */}
        <div className="mt-8 flex items-center gap-6 text-[10px] text-slate-500 font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Serpiente
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Comida
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-800" />
            Límites
          </div>
        </div>
      </main>

      <style>{`
        .pattern-dots {
          background-image: radial-gradient(#1e293b 1px, transparent 0);
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
}
