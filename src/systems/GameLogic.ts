import {
  GameState,
  Spark,
  Vector2,
  CONSTANTS,
  SparkColor,
  LanternState,
  PlayerInput
} from '../types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getRandomColor = (): SparkColor => {
  const colors: SparkColor[] = ['CYAN', 'MAGENTA', 'LIME'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const createSpark = (position: Vector2): Spark => {
  const angle = Math.random() * Math.PI * 2;
  const speed = 50 + Math.random() * 50; // pixels per second
  return {
    id: generateId(),
    position: { ...position },
    velocity: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    },
    color: getRandomColor(),
    radius: CONSTANTS.SPARK_RADIUS,
    spawnTime: Date.now(),
  };
};

export const updatePhysics = (sparks: Spark[], dt: number, screenSize: Vector2): Spark[] => {
  return sparks.map(spark => {
    let { x, y } = spark.position;
    let { x: vx, y: vy } = spark.velocity;

    x += vx * dt;
    y += vy * dt;

    // Bounce off walls
    if (x < spark.radius) { x = spark.radius; vx *= -1; }
    if (x > screenSize.x - spark.radius) { x = screenSize.x - spark.radius; vx *= -1; }
    if (y < spark.radius) { y = spark.radius; vy *= -1; }
    if (y > screenSize.y - spark.radius) { y = screenSize.y - spark.radius; vy *= -1; }

    // Brownian motion / drift
    vx += (Math.random() - 0.5) * 200 * dt;
    vy += (Math.random() - 0.5) * 200 * dt;

    // Dampen max speed
    const speed = Math.sqrt(vx * vx + vy * vy);
    const maxSpeed = 200;
    if (speed > maxSpeed) {
      vx = (vx / speed) * maxSpeed;
      vy = (vy / speed) * maxSpeed;
    }

    return {
      ...spark,
      position: { x, y },
      velocity: { x: vx, y: vy },
    };
  });
};

export const applyGravity = (sparks: Spark[], inputs: Record<number, PlayerInput>, dt: number): Spark[] => {
  // Identify Father inputs (DRAG)
  const fatherInputs = Object.values(inputs).filter(input => input.type === 'DRAG' && input.isActive);

  if (fatherInputs.length === 0) return sparks;

  return sparks.map(spark => {
    let { x: vx, y: vy } = spark.velocity;

    fatherInputs.forEach(input => {
      const dx = input.position.x - spark.position.x;
      const dy = input.position.y - spark.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONSTANTS.GRAVITY_RADIUS && dist > 10) {
        // Pull towards finger (gravity)
        const force = CONSTANTS.GRAVITY_STRENGTH * (1 - dist / CONSTANTS.GRAVITY_RADIUS) * 1000 * dt;
        vx += (dx / dist) * force;
        vy += (dy / dist) * force;
      }
    });

    return { ...spark, velocity: { x: vx, y: vy } };
  });
};

export const updateLantern = (lantern: LanternState, dt: number): LanternState => {
  let { energy, timeSinceLastColorChange, targetColor } = lantern;

  // Energy decay
  energy -= CONSTANTS.LANTERN_DECAY_RATE * dt;
  if (energy < 0) energy = 0;
  if (energy > CONSTANTS.LANTERN_MAX_ENERGY) energy = CONSTANTS.LANTERN_MAX_ENERGY;

  // Color change logic
  timeSinceLastColorChange += dt * 1000;
  if (timeSinceLastColorChange > CONSTANTS.COLOR_CHANGE_INTERVAL) {
      timeSinceLastColorChange = 0;
      let newColor = getRandomColor();
      while (newColor === targetColor) {
          newColor = getRandomColor();
      }
      targetColor = newColor;
  }

  return { ...lantern, energy, timeSinceLastColorChange, targetColor };
};

export const checkCollisions = (
  state: GameState,
  onSparkAbsorbed: (spark: Spark, success: boolean) => void
): GameState => {
  const { sparks, lantern } = state;
  const activeSparks: Spark[] = [];

  sparks.forEach(spark => {
    const dx = spark.position.x - lantern.position.x;
    const dy = spark.position.y - lantern.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < lantern.radius + spark.radius) {
      // Collision
      const isCorrectColor = spark.color === lantern.targetColor;
      onSparkAbsorbed(spark, isCorrectColor);
      
      // Update score/energy immediately here or return logic to update it?
      // Better to return the modified state.
      if (isCorrectColor) {
          state.lantern.energy += CONSTANTS.SPARK_ENERGY_VALUE;
          state.score += 10;
      } else {
          state.lantern.energy -= CONSTANTS.WRONG_COLOR_PENALTY;
      }
    } else {
      activeSparks.push(spark);
    }
  });

  // Clamp energy again just in case
  if (state.lantern.energy > CONSTANTS.LANTERN_MAX_ENERGY) state.lantern.energy = CONSTANTS.LANTERN_MAX_ENERGY;
  if (state.lantern.energy < 0) state.lantern.energy = 0;

  return { ...state, sparks: activeSparks };
};

export const processInputs = (state: GameState, newInputs: Record<number, PlayerInput>): { state: GameState, newSparks: Spark[] } => {
    const spawnedSparks: Spark[] = [];
    const currentInputs = { ...state.inputs };

    // Detect new TAPS (Toddler)
    Object.values(newInputs).forEach(input => {
        const prevInput = state.inputs[input.id];
        
        // If it's a new input or just started
        if (!prevInput) {
            // New touch logic handled in the React component for initial classification? 
            // Or here. 
            // The prompt says: "Toddler = touchstart (taps), Father = touchmove (swipes/lines)"
            // Actually, we can just look at input.type
            if (input.type === 'TAP' && input.isActive) {
               // But we only want to spawn ONCE per tap, not every frame it's held.
               // So we need to track if we already processed this input ID as a spawn.
               // For simplicity, let's assume the InputManager sends 'TAP' type only when it's classified.
               // Actually, "Toddler Input: Tapping anywhere... Effect: Spawns a Spark"
               // We should spawn on touchstart.
               
               // Wait, the Architecture says: 
               // "Heuristically promote a touch to 'Adult Status' if movement (Delta) exceeds a pixel threshold."
               // This implies ALL touches start as child touches?
               // Or we spawn immediately, and if they drag, it becomes a father touch?
               // "Child Flow: Success via agency (tapping = reaction)." -> Instant.
               
               // So: New touch -> Spawn Spark immediately.
               // If that touch moves -> It becomes a "Gravity" source.
               
               // Let's implement:
               // 1. New touch detected (not in prev inputs) -> Spawn Spark.
            }
        }
    });

    return { state: { ...state, inputs: newInputs }, newSparks: spawnedSparks };
};
