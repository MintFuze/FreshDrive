import {validDate} from './date-picker.js';

export const totalKm = route => route.legs.reduce((sum, leg) => sum + Number(leg.km), 0) * (route.round ? 2 : 1);

export const calculate = (km, consumption, price, fee, compensation) => {
  const liters = km * consumption / 100;
  const cost = liters * price;
  const due = fee + (compensation ? cost : 0);
  return {km, liters, cost, due, net: due - cost};
};

export const tripStatus = trip => trip.status ?? 'completed';

export function repeatTrip(trip, date, price) {
  const copy = structuredClone(trip);
  delete copy.id;
  return {...copy, date, price, status: 'planned', paid: false};
}

export function summarizeTrips(trips) {
  return trips.reduce((summary, trip) => {
    if (tripStatus(trip) !== 'completed') return summary;
    const result = calculate(totalKm(trip.route), trip.consumption, trip.price, trip.fee, trip.compensation);
    for (const key of ['km', 'liters', 'cost', 'due', 'net']) summary[key] += result[key];
    return summary;
  }, {km: 0, liters: 0, cost: 0, due: 0, net: 0});
}

const number = (value, max = 1e9) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
const string = value => typeof value === 'string' && value.length <= 2000;
const routeShape = route => route && string(route.start) && typeof route.round === 'boolean' &&
  Array.isArray(route.legs) && route.legs.length > 0 && route.legs.length <= 30 &&
  route.legs.every(leg => leg && string(leg.to) && number(leg.km, 100000));
const routeValid = route => routeShape(route) && route.start.trim() && route.legs.every(leg => leg.to.trim() && leg.km > 0);

export function validDraft(draft) {
  return Boolean(draft && routeShape(draft.route) && string(draft.date) && string(draft.carName) &&
    number(draft.consumption, 100) && draft.consumption > 0 && number(draft.price, 1000) &&
    number(draft.fee) && string(draft.note) && string(draft.customer) &&
    ['planned', 'completed'].includes(draft.status) && typeof draft.compensation === 'boolean' &&
    typeof draft.paid === 'boolean' && typeof draft.saveRoute === 'boolean');
}

export function validData(data) {
  return Boolean(data && data.version === 1 && Array.isArray(data.cars) && Array.isArray(data.routes) &&
    Array.isArray(data.trips) && [data.cars, data.routes, data.trips].every(items => items.length <= 10000) &&
    data.cars.every(car => car && string(car.id) && string(car.name) && number(car.consumption, 100) && car.consumption > 0) &&
    data.routes.every(route => route && string(route.id) && routeValid(route)) &&
    data.trips.every(trip => trip && string(trip.id) && routeValid(trip.route) && validDate(trip.date) &&
      string(trip.carName) && number(trip.consumption, 100) && trip.consumption > 0 && number(trip.price, 1000) &&
      number(trip.fee) && typeof trip.compensation === 'boolean' && typeof trip.paid === 'boolean' && string(trip.note) &&
      (trip.status === undefined || ['planned', 'completed'].includes(trip.status)) &&
      (trip.customer === undefined || string(trip.customer))) &&
    data.settings && number(data.settings.price, 1000));
}
