const running = new WeakMap();

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
