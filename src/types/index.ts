export type Vector2 = {
  x: number;
  y: number;
};

export type SparkColor = 'CYAN' | 'MAGENTA' | 'LIME';

export type Spark = {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color: SparkColor;
  radius: number;
  spawnTime: number;
};

export type LanternState = {
  position: Vector2;
  radius: number;
  color: SparkColor;
  energy: number; // 0 to 100
  targetColor: SparkColor;
  timeSinceLastColorChange: number;
};

export type PlayerInput = {
  id: number;
  type: 'TAP' | 'DRAG'; // TAP = Child, DRAG = Father
  position: Vector2;
  startPosition: Vector2;
  startTime: number;
  isActive: boolean;
};

export type GamePhase = 'MENU' | 'PLAYING' | 'PAUSED' | 'ENDED';

export type GameState = {
  phase: GamePhase;
  sparks: Spark[];
  lantern: LanternState;
  inputs: Record<number, PlayerInput>;
  score: number;
  timeElapsed: number;
  screenSize: Vector2;
};

export const CONSTANTS = {
  SPARK_RADIUS: 15, // Size of fireflies
  LANTERN_RADIUS: 60,
  LANTERN_MAX_ENERGY: 100,
  LANTERN_DECAY_RATE: 5, // Energy loss per second
  SPARK_ENERGY_VALUE: 10,
  WRONG_COLOR_PENALTY: 15,
  GRAVITY_RADIUS: 150, // Father's influence radius
  GRAVITY_STRENGTH: 0.5, // Force applied by father
  TAP_THRESHOLD: 10, // Pixels moved to consider it a drag
  COLOR_CHANGE_INTERVAL: 10000, // ms
  COLORS: {
    CYAN: '#00FFFF',
    MAGENTA: '#FF00FF',
    LIME: '#00FF00',
    LANTERN_BG: '#222222',
    BG: '#000000',
  } as const,
};
