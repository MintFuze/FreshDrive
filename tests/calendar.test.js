import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validDate, shiftDays, shiftMonths, calendarDays, displayDate} from '../dist/date-picker.js';
import {validData} from '../dist/model.js';

test('dates validate actual calendar days and leap-year century rules', () => {
  for (const value of ['2028-02-29', '2000-02-29', '0001-01-01', '9999-12-31']) assert.ok(validDate(value), value);
  for (const value of ['2026-02-29', '1900-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '0000-01-01', '2026-1-1', null]) assert.equal(validDate(value), false, String(value));
});
test('day navigation crosses months and years without timezone drift', () => {
  assert.equal(shiftDays('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDays('2028-02-28', 1), '2028-02-29');
  assert.equal(shiftDays('2028-03-01', -1), '2028-02-29');
  assert.equal(shiftDays('2026-03-29', 1), '2026-03-30');
  assert.equal(shiftDays('0001-01-01', -1), '0001-01-01');
  assert.equal(shiftDays('9999-12-31', 1), '9999-12-31');
});
test('month navigation clamps month ends and supports leap-year jumps', () => {
  assert.equal(shiftMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(shiftMonths('2028-01-31', 1), '2028-02-29');
  assert.equal(shiftMonths('2028-02-29', 12), '2029-02-28');
  assert.equal(shiftMonths('2026-12-15', 1), '2027-01-15');
  assert.equal(shiftMonths('0001-01-01', -1), '0001-01-01');
  assert.equal(shiftMonths('9999-12-01', 1), '9999-12-01');
});
test('calendar begins on Monday with six complete weeks and stable date keys', () => {
  const days = calendarDays('2026-10-29');
  assert.equal(days.length, 42);
  assert.equal(days[0], '2026-09-28');
  assert.equal(days.at(-1), '2026-11-08');
  assert.equal(new Set(days).size, 42);
  assert.ok(calendarDays('2028-02-01').includes('2028-02-29'));
  assert.ok(calendarDays('0001-01-01').filter(Boolean).every(validDate));
  assert.ok(calendarDays('9999-12-01').filter(Boolean).every(validDate));
  assert.deepEqual(calendarDays('invalid'), []);
});
test('date labels and backup validation reject impossible imported trip dates', () => {
  assert.match(displayDate('2026-10-29'), /29 октября 2026/);
  assert.equal(displayDate('2026-02-31'), 'Выберите дату');
  const backup = {version: 1, cars: [], routes: [], settings: {price: 3}, trips: [{
    id: 'date-check', date: '2026-02-31', route: {start: 'А', legs: [{to: 'Б', km: 100}], round: false},
    carName: 'Тест', consumption: 8, price: 3, fee: 10, paid: false, compensation: true, note: ''
  }]};
  assert.equal(validData(backup), false);
  backup.trips[0].date = '2028-02-29';
  assert.equal(validData(backup), true);
});
