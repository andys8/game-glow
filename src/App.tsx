import { useEffect, useRef, useState } from 'react';
import './App.css';
import { CONSTANTS } from './types';
import type { GameState, PlayerInput } from './types';
import { createSpark, updatePhysics, applyGravity, updateLantern, checkCollisions } from './systems/GameLogic';
import { render } from './systems/Renderer';
import { InputManager } from './systems/InputManager';
import { AudioManager } from './systems/AudioManager';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Start overlay
  
  // Refs for mutable game state (to avoid React re-renders in the loop)
  const gameState = useRef<GameState>({
    phase: 'MENU',
    sparks: [],
    lantern: {
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      radius: CONSTANTS.LANTERN_RADIUS,
      color: 'CYAN',
      energy: 100,
      targetColor: 'CYAN',
      timeSinceLastColorChange: 0,
    },
    inputs: {},
    score: 0,
    timeElapsed: 0,
    screenSize: { x: window.innerWidth, y: window.innerHeight },
  });

  const inputManager = useRef<InputManager | null>(null);
  const audioManager = useRef<AudioManager | null>(null);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    // init Audio
    audioManager.current = new AudioManager();

    // init Input
    inputManager.current = new InputManager((position) => {
      // Immediate Spark Spawn (Toddler)
      if (gameState.current.phase === 'PLAYING') {
        const newSpark = createSpark(position);
        gameState.current.sparks.push(newSpark);
        audioManager.current?.playSpawnSound();
      }
    });

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        gameState.current.screenSize = { x: window.innerWidth, y: window.innerHeight };
        gameState.current.lantern.position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      }
    };

    // Shake detection
    let lastShake = 0;
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const threshold = 15;
      const delta = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      
      if (delta > threshold) {
        const now = Date.now();
        if (now - lastShake > 1000) {
          lastShake = now;
          stopGame();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('devicemotion', handleMotion);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('devicemotion', handleMotion);
      inputManager.current?.detach();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startGame = async () => {
    if (!canvasRef.current) return;
    
    // Request Motion Permission (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        await (DeviceMotionEvent as any).requestPermission();
      } catch (e) {
        console.error('Motion permission denied');
      }
    }

    // Resume Audio Context
    audioManager.current?.init();

    // Attach Input
    inputManager.current?.attach(canvasRef.current);

    // Reset State
    gameState.current = {
      phase: 'PLAYING',
      sparks: [],
      lantern: {
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        radius: CONSTANTS.LANTERN_RADIUS,
        color: 'CYAN',
        energy: 100,
        targetColor: 'CYAN',
        timeSinceLastColorChange: 0,
      },
      inputs: {},
      score: 0,
      timeElapsed: 0,
      screenSize: { x: window.innerWidth, y: window.innerHeight },
    };

    setIsPlaying(true);
    previousTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameState.current) gameState.current.phase = 'MENU';
    inputManager.current?.detach();
  };

  const gameLoop = (time: number) => {
    if (!previousTimeRef.current) previousTimeRef.current = time;
    const deltaTime = (time - previousTimeRef.current) / 1000; // seconds
    previousTimeRef.current = time;

    // Limit dt to prevent huge jumps
    const dt = Math.min(deltaTime, 0.1);

    const state = gameState.current;

    if (state.phase === 'PLAYING') {
      // 1. Get Inputs
      const currentInputs = inputManager.current?.getActiveInputs() || {};
      state.inputs = currentInputs;

      // 2. Physics
      state.sparks = updatePhysics(state.sparks, dt, state.screenSize);
      state.sparks = applyGravity(state.sparks, state.inputs, dt);

      // 3. Game Logic
      state.lantern = updateLantern(state.lantern, dt);
      
      // 4. Collisions
      const updatedState = checkCollisions(state, (spark, success) => {
         audioManager.current?.playCollectSound(success);
         // Haptic feedback
         if (success && navigator.vibrate) navigator.vibrate(50);
      });
      
      // Update ref with result (although checkCollisions mutated state partially, strictly it returned new state)
      // Since we are using a ref and mutating parts of it in the loop for performance, we sync back.
      gameState.current = updatedState;

      // Check End Condition (Optional? "No Game Over" in GEMINI.md, but "Father faces resource scarcity")
      // "If the child is too slow, the father faces resource scarcity."
      // "No Game Over" means we probably just stay at 0 energy or low visual state, but play continues.
    }

    // 5. Render
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        render(ctx, state);
      }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <div className="game-container">
      <canvas ref={canvasRef} />
      
      {!isPlaying && (
        <div className="overlay">
          <h1 className="title">Guardians of the Glow</h1>
          
          <div className="instructions">
            <div className="role toddler">
              <h3>👶 Toddler</h3>
              <p>Tap the dark to make <strong>Sparks</strong>!</p>
            </div>
            
            <div className="role parent">
              <h3>👨 Parent</h3>
              <p>Drag to herd Sparks into the <strong>Lantern</strong>.</p>
              <p>Only match the <strong>Lantern's color</strong>!</p>
            </div>

            <div className="goal">
              <p>✨ Keep the light alive together. ✨</p>
            </div>
          </div>

          <button className="start-button" onClick={startGame}>Start Playing</button>
        </div>
      )}

      {/* Optional Debug UI or "Menu" button if needed */}
    </div>
  );
}

export default App;