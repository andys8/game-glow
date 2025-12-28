import { CONSTANTS } from '../types';
import type { GameState, Vector2 } from '../types';

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
  const { position, radius, targetColor, energy } = lantern;
  const colorHex = CONSTANTS.COLORS[targetColor];

  // Large outer glow
  const gradient = ctx.createRadialGradient(position.x, position.y, radius * 0.2, position.x, position.y, radius * 3);
  gradient.addColorStop(0, colorHex);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.2 + (energy / 100) * 0.3;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Outer ring
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Core background
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius - 2, 0, Math.PI * 2);
  ctx.fillStyle = CONSTANTS.COLORS.LANTERN_BG;
  ctx.fill();

  // Energy fill (Inner circle)
  ctx.beginPath();
  const energyRadius = (radius - 5) * (energy / 100);
  ctx.arc(position.x, position.y, Math.max(0, energyRadius), 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.fill();
};

const drawSpark = (ctx: CanvasRenderingContext2D, spark: any) => {
  const colorHex = CONSTANTS.COLORS[spark.color as keyof typeof CONSTANTS.COLORS] || '#FFFFFF';
  
  ctx.shadowBlur = 15;
  ctx.shadowColor = colorHex;
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.arc(spark.position.x, spark.position.y, spark.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
};

const drawGravityField = (ctx: CanvasRenderingContext2D, position: Vector2) => {
  // Ripple effect or simple circle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(position.x, position.y, CONSTANTS.GRAVITY_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Inner glow at finger
  const grad = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, 40);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(position.x, position.y, 40, 0, Math.PI * 2);
  ctx.fill();
};

const drawUI = (ctx: CanvasRenderingContext2D, state: GameState) => {
  const { lantern, score } = state;
  const targetColorHex = CONSTANTS.COLORS[lantern.targetColor];

  // Score
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 30, 45);

  // Target Color Indicator (Top Right)
  const uiRadius = 20;
  const uiX = state.screenSize.x - 50;
  const uiY = 45;

  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('Target:', uiX - 30, uiY + 5);

  ctx.beginPath();
  ctx.arc(uiX, uiY, uiRadius, 0, Math.PI * 2);
  ctx.fillStyle = targetColorHex;
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();
};
