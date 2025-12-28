import { Vector2, PlayerInput, CONSTANTS } from '../types';

export type InputEventCallback = (position: Vector2) => void;

export class InputManager {
  private activeInputs: Record<number, PlayerInput> = {};
  private onSpawnSpark: InputEventCallback;
  private canvas: HTMLCanvasElement | null = null;

  constructor(onSpawnSpark: InputEventCallback) {
    this.onSpawnSpark = onSpawnSpark;
  }

  public attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd);
    canvas.addEventListener('touchcancel', this.handleTouchEnd);
  }

  public detach() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
    this.canvas = null;
  }

  public getActiveInputs(): Record<number, PlayerInput> {
    return this.activeInputs;
  }

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault(); // Prevent scrolling/zooming
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const position = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      // Register new input
      this.activeInputs[touch.identifier] = {
        id: touch.identifier,
        type: 'TAP',
        position,
        startPosition: { ...position },
        startTime: Date.now(),
        isActive: true,
      };

      // Immediate Child Action: Spawn Spark
      this.onSpawnSpark(position);
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const input = this.activeInputs[touch.identifier];
      if (!input) continue;

      const newPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      input.position = newPos;

      // Check for promotion to "Father" (DRAG) status
      if (input.type === 'TAP') {
        const dx = newPos.x - input.startPosition.x;
        const dy = newPos.y - input.startPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > CONSTANTS.TAP_THRESHOLD) {
          input.type = 'DRAG';
        }
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      delete this.activeInputs[touch.identifier];
    }
  };
}
