const running = new WeakMap();

export function originClip(surface, source) {
  if (!surface || !source) return null;
  const values = [surface.left, surface.top, surface.width, surface.height, source.left, source.top, source.width, source.height];
  if (!values.every(Number.isFinite) || surface.width <= 0 || surface.height <= 0 || source.width <= 0 || source.height <= 0) return null;
  const left = Math.max(0, source.left - surface.left);
  const top = Math.max(0, source.top - surface.top);
  const right = Math.max(0, surface.width - (source.left - surface.left + source.width));
  const bottom = Math.max(0, surface.height - (source.top - surface.top + source.height));
  if (left + right >= surface.width || top + bottom >= surface.height) return null;
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${Math.min(28, source.width / 2, source.height / 2)}px)`;
}

export function animateUI(element, frames, options = {}) {
  if (!element) return null;
  running.get(element)?.cancel();
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || typeof element.animate !== 'function') return null;
  const animation = element.animate(frames, {duration: 220, easing: 'cubic-bezier(0.2,0,0,1)', ...options});
  running.set(element, animation);
  const clear = () => {if (running.get(element) === animation) running.delete(element);};
  animation.finished.then(clear, clear);
  return animation;
}
