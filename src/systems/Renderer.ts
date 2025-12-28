import { GameState, CONSTANTS, Vector2 } from '../types';

export const render = (ctx: CanvasRenderingContext2D, state: GameState) => {
  const { width, height } = ctx.canvas;

  // Clear screen with fade effect for trails? Or just clear?
  // "Visually calming" -> Trails are nice.
  ctx.fillStyle = CONSTANTS.COLORS.BG;
  ctx.fillRect(0, 0, width, height);

  // Draw Lantern
  drawLantern(ctx, state);

  // Draw Sparks
  state.sparks.forEach(spark => drawSpark(ctx, spark));

  // Draw Inputs (Debug / Feedback)
  // Specifically "Father" inputs show the Gravity Field
  Object.values(state.inputs).forEach(input => {
    if (input.type === 'DRAG' && input.isActive) {
      drawGravityField(ctx, input.position);
    }
  });

  // Draw Score / Energy Bar (Minimal UI)
  drawUI(ctx, state);
};

const drawLantern = (ctx: CanvasRenderingContext2D, state: GameState) => {
  const { lantern } = state;
  const { position, radius, color, energy } = lantern;
  const colorHex = CONSTANTS.COLORS[color];

  // Glow
  const gradient = ctx.createRadialGradient(position.x, position.y, radius * 0.5, position.x, position.y, radius * 2);
  gradient.addColorStop(0, colorHex);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.3 + (energy / 100) * 0.2; // Pulse with energy
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Core
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = CONSTANTS.COLORS.LANTERN_BG;
  ctx.fill();
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Energy Level (Fill inside)
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius * (energy / 100), 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.fill();
};

const drawSpark = (ctx: CanvasRenderingContext2D, spark: any) => {
  const colorHex = CONSTANTS.COLORS[spark.color];
  
  ctx.shadowBlur = 10;
  ctx.shadowColor = colorHex;
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.arc(spark.position.x, spark.position.y, spark.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
};

const drawGravityField = (ctx: CanvasRenderingContext2D, position: Vector2) => {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(position.x, position.y, CONSTANTS.GRAVITY_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Finger point
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(position.x, position.y, 20, 0, Math.PI * 2);
  ctx.fill();
};

const drawUI = (ctx: CanvasRenderingContext2D, state: GameState) => {
  // Simple Score
  ctx.font = '20px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 20, 30);
};
