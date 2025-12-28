import { updatePhysics, applyGravity, checkCollisions, updateLantern } from '../systems/GameLogic';
import { GameState, Spark, CONSTANTS, PlayerInput, Vector2 } from '../types';

describe('GameLogic', () => {
  const mockScreen: Vector2 = { x: 1000, y: 1000 };
  const dt = 1; // 1 second

  test('updatePhysics moves sparks', () => {
    const sparks: Spark[] = [{
      id: '1',
      position: { x: 100, y: 100 },
      velocity: { x: 10, y: 0 }, // Moving right
      color: 'CYAN',
      radius: 10,
      spawnTime: 0
    }];

    const updated = updatePhysics(sparks, dt, mockScreen);
    // x should be 100 + 10 * 1 = 110. 
    // BUT random brownian motion is added (vx += random). 
    // So position won't be EXACTLY 110. But velocity x will change.
    expect(updated[0].position.x).not.toBe(100);
  });

  test('applyGravity pulls sparks towards father input', () => {
    const spark: Spark = {
      id: '1',
      position: { x: 100, y: 100 },
      velocity: { x: 0, y: 0 },
      color: 'CYAN',
      radius: 10,
      spawnTime: 0
    };

    const inputs: Record<number, PlayerInput> = {
      1: {
        id: 1,
        type: 'DRAG',
        position: { x: 200, y: 100 }, // To the right
        startPosition: { x: 200, y: 100 },
        startTime: 0,
        isActive: true
      }
    };

    const updated = applyGravity([spark], inputs, dt);
    // Should have positive X velocity now
    expect(updated[0].velocity.x).toBeGreaterThan(0);
  });

  test('checkCollisions handles correct color', () => {
    const spark: Spark = {
        id: '1',
        position: { x: 500, y: 500 }, // Inside lantern
        velocity: { x: 0, y: 0 },
        color: 'CYAN',
        radius: 10,
        spawnTime: 0
    };

    const state: GameState = {
        phase: 'PLAYING',
        sparks: [spark],
        lantern: {
            position: { x: 500, y: 500 },
            radius: 50,
            color: 'CYAN', // Matches spark
            energy: 50,
            targetColor: 'CYAN',
            timeSinceLastColorChange: 0
        },
        inputs: {},
        score: 0,
        timeElapsed: 0,
        screenSize: mockScreen
    };

    const onAbsorb = jest.fn();
    const newState = checkCollisions(state, onAbsorb);

    expect(onAbsorb).toHaveBeenCalledWith(spark, true);
    expect(newState.sparks.length).toBe(0); // Consumed
    expect(newState.lantern.energy).toBeGreaterThan(50);
  });

  test('checkCollisions handles wrong color', () => {
    const spark: Spark = {
        id: '1',
        position: { x: 500, y: 500 },
        velocity: { x: 0, y: 0 },
        color: 'MAGENTA', // Wrong color
        radius: 10,
        spawnTime: 0
    };

    const state: GameState = {
        phase: 'PLAYING',
        sparks: [spark],
        lantern: {
            position: { x: 500, y: 500 },
            radius: 50,
            color: 'CYAN',
            energy: 50,
            targetColor: 'CYAN',
            timeSinceLastColorChange: 0
        },
        inputs: {},
        score: 0,
        timeElapsed: 0,
        screenSize: mockScreen
    };

    const onAbsorb = jest.fn();
    const newState = checkCollisions(state, onAbsorb);

    expect(onAbsorb).toHaveBeenCalledWith(spark, false);
    expect(newState.lantern.energy).toBeLessThan(50);
  });
});
