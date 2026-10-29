import {test} from 'node:test';
import assert from 'node:assert/strict';
import {animateUI} from '../dist/motion.js';

function element() {
  const calls = [];
  return {calls, animate(frames, options) {
    let reject;
    const animation = {cancelled: false, finished: new Promise((resolve, fail) => {reject = fail;}),
      cancel() {this.cancelled = true; reject(Error('cancelled'));}};
    calls.push({frames, options, animation});
    return animation;
  }};
}
test('unsupported animation API leaves navigation usable', () => {
  assert.equal(animateUI(null, []), null);
  assert.equal(animateUI({}, []), null);
});
test('fast repeated navigation cancels the previous animation immediately', () => {
  const target = element();
  const first = animateUI(target, [{opacity: 0}, {opacity: 1}]);
  const second = animateUI(target, [{opacity: .5}, {opacity: 1}]);
  assert.equal(first.cancelled, true);
  assert.equal(second.cancelled, false);
  assert.equal(target.calls.length, 2);
  second.cancel();
});
test('reduced-motion preference skips effects and cancels a running effect', context => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, 'matchMedia', previous);
    else delete globalThis.matchMedia;
  });
  const target = element();
  const active = animateUI(target, []);
  Object.defineProperty(globalThis, 'matchMedia', {configurable: true, value: () => ({matches: true})});
  assert.equal(animateUI(target, []), null);
  assert.equal(active.cancelled, true);
  assert.equal(target.calls.length, 1);
});
test('exit timing can be short without changing the default page timing', () => {
  const target = element();
  animateUI(target, [], {duration: 140, easing: 'ease-in'});
  assert.equal(target.calls[0].options.duration, 140);
  assert.equal(target.calls[0].options.easing, 'ease-in');
  target.calls[0].animation.cancel();
  animateUI(target, []);
  assert.equal(target.calls[1].options.duration, 220);
  target.calls[1].animation.cancel();
});
