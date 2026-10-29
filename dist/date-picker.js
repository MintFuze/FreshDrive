const pad = value => String(value).padStart(2, '0');
const utcDate = (year, month, day) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(12, 0, 0, 0);
  return date;
};
const key = date => `${String(date.getUTCFullYear()).padStart(4, '0')}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return year >= 1 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 &&
    day <= utcDate(year, month, 0).getUTCDate();
}

export function shiftDays(value, amount) {
  if (!validDate(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  const result = key(utcDate(year, month - 1, day + amount));
  return validDate(result) ? result : value;
}

export function shiftMonths(value, amount) {
  if (!validDate(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  const target = utcDate(year, month - 1 + amount, 1);
  const lastDay = utcDate(target.getUTCFullYear(), target.getUTCMonth() + 1, 0).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  const result = key(target);
  return validDate(result) ? result : value;
}

export function calendarDays(value) {
  if (!validDate(value)) return [];
  const [year, month] = value.split('-').map(Number);
  const first = utcDate(year, month - 1, 1);
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({length: 42}, (_, index) => {
    const result = key(utcDate(year, month - 1, 1 - offset + index));
    return validDate(result) ? result : null;
  });
}

const dateObject = value => {
  const [year, month, day] = value.split('-').map(Number);
  return utcDate(year, month - 1, day);
};
export const displayDate = value => validDate(value)
  ? dateObject(value).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'})
  : 'Выберите дату';
const accessibleDate = value => dateObject(value).toLocaleDateString('ru-RU', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
const months = Array.from({length: 12}, (_, month) => utcDate(2026, month, 1).toLocaleDateString('ru-RU', {month: 'long', timeZone: 'UTC'}));

export function mountDatePicker(container, {value, today, onChange}) {
  let selected = validDate(value) ? value : today;
  let viewed = selected;
  let expanded = false;
  let choosingMonth = false;
  let focused = selected;
  const tomorrow = shiftDays(today, 1);
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m4 4h3"/></svg>';
  function render(focusDay = false) {
    const [year, month] = viewed.split('-').map(Number);
    const monthTitle = `${months[month - 1]} ${year}`;
    container.innerHTML = `<input type="hidden" id="date" value="${selected}"><div class="date-display">${icon}<div><span>Дата поездки</span><strong aria-live="polite">${displayDate(selected)}</strong></div></div><div class="date-shortcuts"><button type="button" data-quick="today" aria-pressed="${selected === today}">Сегодня</button><button type="button" data-quick="tomorrow" aria-pressed="${selected === tomorrow}">Завтра</button><button type="button" data-calendar-toggle aria-expanded="${expanded}" aria-controls="date-calendar">Выбрать дату</button></div><div id="date-calendar" class="date-calendar" ${expanded ? '' : 'hidden'}><div class="calendar-heading"><button type="button" data-month-step="-1" aria-label="Предыдущий месяц" ${viewed.startsWith('0001-01') ? 'disabled' : ''}>‹</button><button type="button" data-month-toggle aria-expanded="${choosingMonth}">${monthTitle}<span aria-hidden="true">⌄</span></button><button type="button" data-month-step="1" aria-label="Следующий месяц" ${viewed.startsWith('9999-12') ? 'disabled' : ''}>›</button></div><div class="calendar-jump" ${choosingMonth ? '' : 'hidden'}><label>Год<input class="calendar-year" type="text" inputmode="numeric" maxlength="4" value="${year}" aria-label="Год календаря"></label><div class="calendar-months">${months.map((label, index) => `<button type="button" data-month-index="${index + 1}" aria-pressed="${month === index + 1}">${label.slice(0, 3)}</button>`).join('')}</div><p class="hint" id="calendar-year-hint" aria-live="polite">Укажите год и выберите месяц.</p></div><div class="calendar-days-panel" ${choosingMonth ? 'hidden' : ''}><div class="calendar-weekdays" aria-hidden="true">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(day => `<span>${day}</span>`).join('')}</div><div class="calendar-grid" role="group" aria-label="${monthTitle}">${calendarDays(viewed).map(day => day ? `<button type="button" data-day="${day}" class="calendar-day ${day.slice(0, 7) !== viewed.slice(0, 7) ? 'other-month' : ''}" tabindex="${day === focused ? '0' : '-1'}" aria-label="${accessibleDate(day)}" aria-pressed="${day === selected}" ${day === today ? 'aria-current="date"' : ''}>${Number(day.slice(-2))}</button>` : '<span></span>').join('')}</div><p class="calendar-help">Выберите день — дата сохранится в черновике</p></div></div>`;
    if (focusDay) container.querySelector(`[data-day="${focused}"]`)?.focus();
  }
  function choose(day, close = true) {
    selected = day;
    viewed = day;
    focused = day;
    if (close) expanded = false;
    choosingMonth = false;
    render(!close);
    onChange(day);
    if (close) container.querySelector('[data-calendar-toggle]').focus();
  }
  container.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !container.contains(button)) return;
    if (button.hasAttribute('data-calendar-toggle')) {
      expanded = !expanded;
      choosingMonth = false;
      viewed = selected;
      focused = selected;
      render(expanded);
      if (!expanded) container.querySelector('[data-calendar-toggle]').focus();
    } else if (button.dataset.quick) {
      choose(button.dataset.quick === 'today' ? today : tomorrow);
    } else if (button.dataset.day) {
      choose(button.dataset.day);
    } else if (button.dataset.monthStep) {
      viewed = shiftMonths(viewed.slice(0, 7) + '-01', Number(button.dataset.monthStep));
      focused = viewed;
      render();
      container.querySelector(`[data-month-step="${button.dataset.monthStep}"]`)?.focus();
    } else if (button.hasAttribute('data-month-toggle')) {
      choosingMonth = !choosingMonth;
      render();
      container.querySelector('[data-month-toggle]').focus();
    } else if (button.dataset.monthIndex) {
      const yearInput = container.querySelector('.calendar-year');
      const year = Number(yearInput.value);
      if (!/^\d{1,4}$/.test(yearInput.value) || year < 1 || year > 9999) {
        container.querySelector('#calendar-year-hint').textContent = 'Введите год от 1 до 9999.';
        yearInput.focus();
        return;
      }
      viewed = `${String(year).padStart(4, '0')}-${pad(button.dataset.monthIndex)}-01`;
      focused = viewed;
      choosingMonth = false;
      render(true);
    }
  });
  container.addEventListener('keydown', event => {
    const day = event.target.dataset.day;
    if (event.target.matches('.calendar-year') && event.key === 'Enter') {
      event.preventDefault();
      container.querySelector(`[data-month-index="${Number(viewed.slice(5, 7))}"]`).click();
      return;
    }
    if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      event.stopPropagation();
      expanded = false;
      render();
      container.querySelector('[data-calendar-toggle]').focus();
      return;
    }
    if (!day) return;
    const weekday = (dateObject(day).getUTCDay() + 6) % 7;
    const offsets = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday};
    let next;
    if (Object.hasOwn(offsets, event.key)) next = shiftDays(day, offsets[event.key]);
    if (event.key === 'PageUp') next = shiftMonths(day, event.shiftKey ? -12 : -1);
    if (event.key === 'PageDown') next = shiftMonths(day, event.shiftKey ? 12 : 1);
    if (!next) return;
    event.preventDefault();
    focused = next;
    viewed = next;
    render(true);
  });
  render();
}
