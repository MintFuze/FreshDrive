import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as model from '../dist/model.js';
import {mountDatePicker, displayDate} from '../dist/date-picker.js';

const source = (await readFile(new URL('../dist/app.js', import.meta.url), 'utf8')).replace(/^import.*$/gm, '');
const backup = () => ({version: 1, cars: [], routes: [], trips: [], settings: {price: 3}});
function boot(saved) {
  const values = new Map(saved === undefined ? [] : [['reis-local-v1', saved]]);
  let failWrites = false;
  const elements = new Map();
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        style: {}, innerHTML: '', textContent: '', addEventListener() {}, insertAdjacentHTML() {}
      });
      return elements.get(selector);
    },
    querySelectorAll() {return [];},
    addEventListener() {}
  };
  const localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) {if (failWrites) throw Error('Quota exceeded'); values.set(key, value);},
    removeItem: key => values.delete(key)
  };
  const context = vm.createContext({...model, mountDatePicker, displayDate, document, localStorage,
    structuredClone, Intl, Date, navigator: {}, setTimeout: () => 0, clearTimeout() {}});
  vm.runInContext(source, context);
  return {context, values, failWrites: () => {failWrites = true;}};
}
test('unreadable stored data cannot be silently overwritten by a new record', () => {
  const app = boot('{broken original data');
  assert.equal(app.context.persist(backup()), false);
  assert.equal(app.values.get('reis-local-v1'), '{broken original data');
  assert.equal(app.context.persist(backup(), true), true);
  assert.deepEqual(JSON.parse(app.values.get('reis-local-v1')), backup());
  assert.equal(app.context.persist({...backup(), settings: {price: 4}}), true);
});
test('failed storage writes preserve both the saved backup and current in-memory state', () => {
  const original = JSON.stringify(backup());
  const app = boot(original);
  app.failWrites();
  assert.equal(app.context.persist({...backup(), settings: {price: 9}}), false);
  assert.equal(app.values.get('reis-local-v1'), original);
  assert.equal(vm.runInContext('data.settings.price', app.context), 3);
});
test('changing the default fuel price preserves old snapshots, including missing prices', () => {
  const data = backup();
  const trip = {id: 'old', date: '2026-10-29', carName: 'Тест', consumption: 8, fee: 100,
    compensation: true, paid: false, note: '', route: {start: 'А', legs: [{to: 'Б', km: 400}], round: false}};
  data.trips = [{...trip, price: 0}, {...trip, id: 'other', price: 2.5}];
  assert.ok(model.validData(data));
  const app = boot();
  assert.equal(app.context.persist(data), true);
  assert.equal(app.context.mutate(next => {next.settings.price = 4;}), true);
  const saved = JSON.parse(app.values.get('reis-local-v1'));
  assert.deepEqual(saved.trips.map(trip => trip.price), [0, 2.5]);
  assert.equal(saved.settings.price, 4);
});
