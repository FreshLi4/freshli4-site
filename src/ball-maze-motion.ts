export type BallOrbit = { theta: number; phi: number; radius: number };
export type BallMotion = { orbit: BallOrbit; mode: "follow" | "manual" };
export type CanvasBounds = { left: number; top: number; width: number; height: number };
export type BallPointer = { x: number; y: number };

const radians = (degrees: number) => degrees * Math.PI / 180;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const isPointerInCanvas = (pointer: BallPointer, bounds: CanvasBounds) =>
  pointer.x >= bounds.left && pointer.x < bounds.left + bounds.width &&
  pointer.y >= bounds.top && pointer.y < bounds.top + bounds.height;

export const pointerLookTarget = (pointer: BallPointer, bounds: CanvasBounds) => {
  const depth = Math.max(180, Math.max(bounds.width, bounds.height) * 1.1);
  const dx = pointer.x - (bounds.left + bounds.width / 2);
  const dy = pointer.y - (bounds.top + bounds.height / 2);
  // Orbiting the camera is the inverse of turning the model toward the pointer.
  return {
    theta: radians(25) - Math.atan2(dx, depth) * .8,
    phi: clamp(radians(70) - Math.atan2(dy, depth) * .6, radians(12), radians(168)),
  };
};

export const setBallMotionMode = (motion: BallMotion, mode: BallMotion["mode"], orbit: BallOrbit): BallMotion =>
  ({ ...motion, mode, orbit: { ...orbit } });

export const advanceBallMotion = (motion: BallMotion, target: Pick<BallOrbit, "theta" | "phi">, elapsedMs: number): BallMotion => {
  if (motion.mode === "manual") return motion;
  const { orbit } = motion;
  // Preserve the rendered/manual angle, including multiple revolutions, and
  // approach the pointer by the shortest arc. Never reset to the initial view.
  const deltaTheta = Math.atan2(Math.sin(target.theta - orbit.theta), Math.cos(target.theta - orbit.theta));
  const deltaPhi = target.phi - orbit.phi;
  if (Math.abs(deltaTheta) < .0005 && Math.abs(deltaPhi) < .0005) return motion;
  const blend = 1 - Math.exp(-clamp(elapsedMs, 0, 64) / 180);
  return { mode: "follow", orbit: { theta: orbit.theta + deltaTheta * blend, phi: orbit.phi + deltaPhi * blend, radius: orbit.radius } };
};
