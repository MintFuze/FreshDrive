import{totalKm,calculate,validData,tripStatus,repeatTrip,summarizeTrips,validDraft}from './model.js';
import{mountDatePicker,displayDate}from './date-picker.js';
import{animateUI}from './motion.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),id=()=>crypto.randomUUID(),num=(v,d=1)=>Number(v).toLocaleString('ru-RU',{maximumFractionDigits:d}),money=v=>num(v,2),today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Minsk'}).format(new Date());
const KEY='reis-local-v1';let data={version:1,cars:[],routes:[],trips:[],settings:{price:0}},page='overview',period='month',search='',storageError=false,customerFilter='',statusFilter='all';
const undoStack=[];
const DRAFT_PREFIX='reis-draft-v1-';
let customerCache=null;
try{const saved=localStorage.getItem(KEY);if(saved){const parsed=JSON.parse(saved);if(!validData(parsed))throw Error();data=parsed}}catch{storageError=true}
function persist(next,replaceUnreadable=false){if(storageError&&!replaceUnreadable){toast('Сначала сохраните исходные данные или восстановите резервную копию в настройках.');return false}try{localStorage.setItem(KEY,JSON.stringify(next));data=next;customerCache=null;if(replaceUnreadable)storageError=false;return true}catch{toast('Не удалось сохранить. Освободите память или экспортируйте данные.');return false}}
function mutate(fn){const next=structuredClone(data);fn(next);return persist(next)}
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',4200)}
const navIcon=paths=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const carIcon=navIcon('<path d="m5 9 2-5h10l2 5M3 10l2-1h14l2 1v8H3zM3 14h18M6 18v2m12-2v2"/><path d="M6 12h2m8 0h2"/>');
const routeIcon=navIcon('<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7"/>');
const chevronIcon=navIcon('<path d="m9 6 6 6-6 6"/>');
const items=[['overview',navIcon('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),'Обзор'],['history',navIcon('<path d="M4 6h16M4 12h16M4 18h10"/>'),'Поездки'],['routes',routeIcon,'Маршруты'],['cars',carIcon,'Машины'],['settings',navIcon('<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="var(--surface, #101111)"/><circle cx="15" cy="12" r="2" fill="var(--surface, #101111)"/><circle cx="9" cy="18" r="2" fill="var(--surface, #101111)"/>'),'Настройки']];
const name=r=>[r.start,...r.legs.map(l=>l.to),...(r.round?[r.start]:[])].join(' → '),calc=t=>calculate(totalKm(t.route),t.consumption,t.price,t.fee,t.compensation);
function filtered(){const now=today();return data.trips.filter(t=>(period==='all'||period==='month'&&t.date.slice(0,7)===now.slice(0,7)||period==='week'&&t.date<=now&&t.date>=new Date(Date.parse(now+'T12:00:00Z')-6*86400000).toISOString().slice(0,10))&&(page!=='history'||(!customerFilter||t.customer===customerFilter)&&(statusFilter==='all'||tripStatus(t)===statusFilter))&&(!search||name(t.route).toLowerCase().includes(search.toLowerCase())||t.note.toLowerCase().includes(search.toLowerCase())||(t.customer||'').toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date))}
const totals=summarizeTrips;
const statusLabel=t=>tripStatus(t)==='completed'?'Завершён':'В процессе';
const customers=()=>customerCache??= [...new Set(data.trips.map(t=>t.customer||'').filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
const heading=(title,sub,action='')=>`<div class="page-heading"><div><h1>${title}</h1></div>${action}</div>`;
const addTrip='';
const periods=()=>`<div class="period">${[['week','7 дней'],['month','Этот месяц'],['all','Всё время']].map(([v,l])=>`<button data-period="${v}" class="${period===v?'active':''}">${l}</button>`).join('')}</div>`;
const empty=(title,text,button='')=>`<div class="empty"><div class="empty-icon">↗</div><h3>${title}</h3><p>${text}</p>${button}</div>`;
const carSVG='<svg viewBox="0 0 220 80" aria-hidden="true"><path d="M22 51l8-18 38-6 22-19h59l28 24 23 8 5 20h-22m-33 0H73m-32 0H22v-9M68 27h101M93 12l-17 15m49-15v15m24-15 16 15M31 41h20m128 0h16"/><circle cx="57" cy="59" r="15"/><circle cx="167" cy="59" r="15"/><circle cx="57" cy="59" r="6"/><circle cx="167" cy="59" r="6"/></svg>';
function stats(ts,t=totals(ts)){return `<div class="stats">${[['Завершено рейсов',ts.filter(t=>tripStatus(t)==='completed').length,'','За выбранный период'],['Пройдено',num(t.km),'км','Весь маршрут учтён'],['На топливо',money(t.cost),'BYN',`${num(t.liters)} л по расчёту`],['Начислено',money(t.due),'BYN','Рейсы и топливо']].map(([l,v,u,n])=>`<div class="stat"><div class="stat-label">${l}</div><div class="stat-number">${v} <small>${u}</small></div></div>`).join('')}</div>`}
function chart(){const end=today(),days=Array.from({length:7},(_,i)=>new Date(Date.parse(end+'T12:00:00Z')-(6-i)*86400000).toISOString().slice(0,10));const values=days.map(d=>totals(data.trips.filter(t=>t.date===d)).km),max=Math.max(...values,1);return `<div class="panel"><div class="panel-head"><h2>На дороге</h2><span class="tag">ПОСЛЕДНИЕ 7 ДНЕЙ</span></div><div class="chart" role="img" aria-label="Пробег за 7 дней: ${days.map((d,i)=>d+': '+values[i]+' км').join(', ')}">${days.map((d,i)=>`<div class="chart-col"><span class="chart-value">${values[i]?num(values[i]):'—'}</span><div class="bar" style="height:${Math.max(2,values[i]/max*112)}px"></div><span class="chart-label">${new Date(d+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'short'})}</span></div>`).join('')}</div></div>`}
function tripRows(trips){
  if(!trips.length&&data.trips.length)return empty('Ничего не найдено','Измените период, заказчика, статус или поисковый запрос.');
  if(!trips.length)return empty('Здесь будут ваши заказы','Нажмите + внизу, чтобы записать первую поездку.');
  let previous='';
  return trips.map(trip=>{
    const date=previous===trip.date?'':`<div class="date-label">${displayDate(trip.date)}</div>`;
    previous=trip.date;
    const result=calc(trip);
    return date+`<button class="trip-card" data-action="view-trip" data-id="${esc(trip.id)}"><span class="trip-card-top"><span class="trip-card-customer">${esc(trip.customer||trip.carName)}</span><span class="status-pill ${tripStatus(trip)}">${statusLabel(trip)}</span></span><span class="trip-card-route">${esc(name(trip.route))}</span><span class="trip-card-bottom"><span class="trip-card-meta">${num(result.km)} км <span aria-hidden="true">·</span> ${num(result.liters)} л</span><span class="trip-card-amount">${money(result.due)} <small>BYN</small></span></span>${tripStatus(trip)==='planned'?'<span class="trip-card-caption">Предварительный расчёт</span>':''}${trip.note?`<span class="trip-card-note">${esc(trip.note)}</span>`:''}</button>`;
  }).join('');
}
function render(){ $('#nav').innerHTML=items.filter(([v])=>!['cars','routes'].includes(v)).map(([v,i,l])=>`<button data-page="${v}" class="${v===page||(['cars','routes'].includes(page)&&v==='settings')?'active':''}"><span class="nav-icon">${i}</span>${l}</button>`).join('')+'<button class="nav-add" data-action="trip" aria-label="Новая поездка"><span aria-hidden="true">＋</span></button>';$('#breadcrumb').textContent='Рабочий сезон / '+items.find(i=>i[0]===page)[2];const ts=filtered(),summary=['overview','history'].includes(page)?totals(ts):null;let html='';if(page==='overview'){const car=data.cars[0];html=heading('Обзор','Поездки, топливо и расчёты — всё в одном месте.',addTrip)+periods()+stats(ts,summary)+`<div class="dashboard-grid">${chart()}<div class="panel"><div class="panel-head"><h2>Ваша машина</h2><span class="tag">ГАРАЖ</span></div><div class="car-art">${carSVG}</div>${car?`<h3>${esc(car.name)}</h3><div class="split"><span>Средний расход</span><strong>${num(car.consumption)} л / 100 км</strong></div><button class="quiet" data-page="cars" style="width:100%">Открыть гараж ↗</button>`:`<h3>Нет машины</h3><button class="quiet" data-action="car" style="width:100%;margin-top:12px">＋ Добавить машину</button>`}</div></div><div class="section-head"><h2>Последние поездки</h2><button class="quiet" data-page="history">Вся история ↗</button></div>${tripRows(ts.slice(0,4))}`}
if(page==='history')html=heading('История поездок','Маршруты и расчёты, к которым легко вернуться.',addTrip)+periods()+stats(ts,summary)+`<div class="section-head"><h2>Рейсы по дням</h2><button class="quiet" data-action="csv">Экспорт CSV ↓</button></div><input class="search" id="search" aria-label="Поиск поездок" placeholder="Маршрут, заказчик или заметка" value="${esc(search)}">`+tripRows(ts)+`<div class="panel" style="margin-top:25px"><h2>Итоги периода</h2>${[['Начислено',summary.due],['Расходы на топливо',summary.cost],['После топлива',summary.net]].map(([l,v])=>`<div class="metric-line"><span>${l}</span><strong>${money(v)} BYN</strong></div>`).join('')}</div>`;
if(page==='routes')html=heading('Маршруты','Сохраните маршрут и выбирайте его в один шаг.','<button class="primary" data-action="route">＋ Маршрут</button>')+(data.routes.length?`<div class="cards">${data.routes.map(r=>`<div class="panel"><div class="eyebrow">${r.round?'ТУДА И ОБРАТНО':'В ОДНУ СТОРОНУ'}</div><h2>${esc(name(r))}</h2><p>${num(totalKm(r))} км · ${r.legs.length} участков</p><div class="card-actions"><button data-action="use-route" data-id="${esc(r.id)}">Новая поездка ↗</button><button class="quiet" data-action="route" data-id="${esc(r.id)}">Изменить</button><button class="quiet danger" data-action="delete-route" data-id="${esc(r.id)}">Удалить</button></div></div>`).join('')}</div>`:empty('Маршруты под рукой','Например: Могилёв → Минск → Марьина Горка. Укажите километраж каждого участка.','<button class="primary" data-action="route">＋ Первый маршрут</button>'));
if(page==='cars')html=heading('Машины','Машина и расход — основа точного расчёта.','<button class="primary" data-action="car">＋ Машина</button>')+(data.cars.length?`<div class="cards">${data.cars.map(c=>`<div class="panel"><div class="car-art">${carSVG}</div><h2>${esc(c.name)}</h2><div class="split"><span>Средний расход</span><strong>${num(c.consumption)} л / 100 км</strong></div><div class="card-actions"><button data-action="car" data-id="${esc(c.id)}">Изменить</button><button class="quiet danger" data-action="delete-car" data-id="${esc(c.id)}">Удалить</button></div></div>`).join('')}</div>`:empty('На чём отправимся?','Укажите название машины и средний расход из своих наблюдений.','<button class="primary" data-action="car">＋ Добавить машину</button>'));
if(page==='settings')html=heading('Настройки','Данные остаются в этом браузере на этом устройстве.')+`<div class="panel settings-block settings-links"><button class="quiet" data-page="cars"><span class="settings-link-label">${carIcon}Машины</span><span class="settings-link-chevron">${chevronIcon}</span></button><button class="quiet" data-page="routes"><span class="settings-link-label">${routeIcon}Маршруты</span><span class="settings-link-chevron">${chevronIcon}</span></button></div><div class="panel settings-block"><h2>Цена топлива по умолчанию</h2><p class="panel-sub">Новая цена применяется к новым заказам. В старых сохраняется их цена; изменить её можно в самом заказе.</p><form id="settings-form"><label>Цена, BYN / л<input name="price" type="number" min="0" max="1000" step="0.001" value="${data.settings.price}" required></label><button class="primary" style="margin-top:16px">Сохранить цену</button></form></div><div class="panel settings-block"><h2>Резервная копия</h2><p>Сохраните файл перед очисткой браузера или сменой телефона.</p><div class="card-actions"><button data-action="export">Скачать JSON ↓</button><button class="quiet" data-action="import">Восстановить из файла</button></div><input id="import-file" type="file" accept="application/json,.json" hidden><div class="notice">Телефоны не синхронизируются автоматически. Для переноса записей отправьте резервную копию на другое устройство и восстановите её там. Импорт заменяет текущие данные после подтверждения.</div></div><div class="panel settings-block"><h2>Всегда под рукой</h2><p>В Chrome выберите «Установить приложение» или «Добавить на главный экран». В Safari: «Поделиться» → «На экран Домой».</p><div class="notice" id="offline-status">Офлайн-доступ подготавливается…</div><p class="hint">Расход топлива расчётный: километры × расход / 100. Пробки, прогрев и нагрузка могут менять фактический расход. Километраж указывается вручную.</p></div>`;
$('#content').innerHTML=html;
if(storageError)$('#content').insertAdjacentHTML('afterbegin','<div class="notice" role="alert">Сохранённые данные не удалось прочитать. Они защищены от перезаписи. <button class="quiet" data-action="export">Скачать исходные данные</button><button class="quiet" data-page="settings">Восстановить копию</button></div>');
if(undoStack.length)$('#content').insertAdjacentHTML('afterbegin','<div class="undo-notice" role="status"><span>Запись удалена</span><button class="quiet" data-action="undo-delete">Вернуть</button></div>');
if(page==='history'){
  $('#search').insertAdjacentHTML('beforebegin',`<div class="history-filter-panel"><div class="filter-label">Показать заказы</div><div class="segmented filter-status" style="--selected-index:${['all','planned','completed'].indexOf(statusFilter)}" role="group" aria-label="Статус заказов"><span class="segment-indicator" aria-hidden="true"></span>${[['all','Все'],['planned','В процессе'],['completed','Завершены']].map(([value,label])=>`<button type="button" data-status-filter="${value}" aria-pressed="${statusFilter===value}">${label}</button>`).join('')}</div><details class="customer-filter-panel" ${customerFilter?'open':''}><summary>Заказчик <span>${esc(customerFilter||'Все заказчики')}</span></summary><div class="customer-filter-options" role="group" aria-label="Фильтр по заказчику"><button type="button" class="choice-chip" data-customer-filter="" aria-pressed="${!customerFilter}">Все заказчики</button>${customers().map(customer=>`<button type="button" class="choice-chip" data-customer-filter="${esc(customer)}" aria-pressed="${customerFilter===customer}">${esc(customer)}</button>`).join('')}</div></details></div><p class="hint">Итоги ниже — по завершённым заказам.</p>`);
  document.querySelectorAll('[data-status-filter]').forEach(button=>button.onclick=()=>{
    const statuses=['all','planned','completed'],previous=statuses.indexOf(statusFilter),next=statuses.indexOf(button.dataset.statusFilter);
    if(previous===next)return;
    statusFilter=button.dataset.statusFilter;render();
    const position=index=>'translateX(calc('+index+' * (100% + 4px)))';
    animateUI($('.filter-status .segment-indicator'),[{transform:position(previous)},{transform:position(next)}],{duration:200});
    Array.from(document.querySelectorAll('.trip-card')).slice(0,8).forEach(card=>animateUI(card,[{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180}));
    document.querySelector('[data-status-filter="'+statusFilter+'"]')?.focus({preventScroll:true});
  });
  document.querySelectorAll('[data-customer-filter]').forEach(button=>button.onclick=()=>{customerFilter=button.dataset.customerFilter;render()});
}
if(page==='settings'){navigator.serviceWorker?.ready.then(()=>{if($('#offline-status'))$('#offline-status').textContent='Приложение сохранено для работы без интернета. Откройте его один раз онлайн на каждом устройстве.'});$('#settings-form').onsubmit=e=>{e.preventDefault();if(mutate(d=>d.settings.price=Number(new FormData(e.target).get('price'))))toast('Цена сохранена. Она применяется к новым заказам.')};$('#import-file').onchange=importFile}if(page==='history')$('#search').oninput=e=>{search=e.target.value;const pos=e.target.selectionStart;render();$('#search').focus();$('#search').setSelectionRange(pos,pos)}}
function modal(title,body){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=body;$('#modal').showModal()}
$('#close').onclick=()=>$('#modal').close();$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
function carForm(carId){const c=data.cars.find(c=>c.id===carId);modal(c?'Изменить машину':'Добавить машину',`<form id="car-form" class="fields"><label class="full">Название машины<input name="name" maxlength="100" placeholder="Например, Volkswagen Passat" value="${esc(c?.name||'')}" required></label><label class="full">Средний расход, л / 100 км<input name="consumption" type="number" min="0.1" max="100" step="0.1" placeholder="Например, 8.5" value="${c?.consumption||''}" required></label><div class="form-actions full"><button class="primary">Сохранить машину</button></div></form>`);$('#car-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),v={id:c?.id||id(),name:f.get('name').trim(),consumption:Number(f.get('consumption'))};if(!v.name)return;if(mutate(d=>{const i=d.cars.findIndex(x=>x.id===v.id);i<0?d.cars.push(v):d.cars[i]=v})){$('#modal').close();render();toast('Машина сохранена')}}}
function routeFields(r){return `<label>Откуда<input id="start" maxlength="100" placeholder="Могилёв" value="${esc(r?.start||'')}" required></label><div id="stops"></div><button type="button" class="quiet" id="add-stop">＋ Ещё остановка</button><label class="check"><input type="checkbox" id="round" ${r?.round?'checked':''}>Вернуться тем же путём (километраж × 2)</label><p class="hint">Для другого обратного пути добавьте его отдельными участками.</p>`}
function stopRow(l={to:'',km:''}){const el=document.createElement('div');el.className='stop';el.innerHTML=`<label>Куда<input class="to" maxlength="100" value="${esc(l.to)}" placeholder="Минск" required></label><label>Участок, км<input class="km" type="number" min="0.1" max="100000" step="0.1" value="${l.km}" required></label><button type="button" aria-label="Удалить участок" class="remove-stop">×</button>`;if(l.coords)el.dataset.coords=l.coords;$('#stops').append(el);el.querySelector('button').onclick=()=>{if($('#stops').children.length>1)el.remove();$('#stops').dispatchEvent(new Event('input',{bubbles:true}))}}
function setupRoute(r){(r?.legs||[{to:'',km:''}]).forEach(stopRow);$('#add-stop').onclick=()=>{if($('#stops').children.length<30)stopRow()}}
function readRoute(){return{start:$('#start').value.trim(),legs:[...document.querySelectorAll('.stop')].map(el=>({to:el.querySelector('.to').value.trim(),km:Number(el.querySelector('.km').value),...(el.dataset.coords?{coords:el.dataset.coords}:{})})),round:$('#round').checked}}
function routeForm(routeId){const r=data.routes.find(r=>r.id===routeId);modal(r?'Изменить маршрут':'Сохранить маршрут',`<form id="route-form">${routeFields(r)}<div class="form-actions"><button class="primary">Сохранить маршрут</button></div></form>`);setupRoute(r);$('#route-form').onsubmit=e=>{e.preventDefault();const v={id:r?.id||id(),...readRoute()};if(!v.start||v.legs.some(l=>!l.to))return;if(mutate(d=>{const i=d.routes.findIndex(x=>x.id===v.id);i<0?d.routes.push(v):d.routes[i]=v})){$('#modal').close();render();toast('Маршрут сохранён')}}}
function routeSummary(route){
  let previous=route.start;
  const segments=route.legs.map(leg=>{
    const segment=`<li><span>${esc(previous||'Откуда')} → ${esc(leg.to||'Куда')}</span><strong>${num(leg.km)} км</strong></li>`;
    previous=leg.to;return segment;
  }).join('');
  return `<ol class="route-timeline">${segments}${route.round?`<li><span>Обратно тем же путём → ${esc(route.start)}</span><strong>${num(totalKm({...route,round:false}))} км</strong></li>`:''}</ol><div class="route-distance"><span>Всего по маршруту</span><strong>${num(totalKm(route))} км</strong></div>`;
}
function tripView(tripId){
  const trip=data.trips.find(entry=>entry.id===tripId);if(!trip)return;
  const result=calc(trip);
  openTripEditor('Заказ',`<div class="order-heading"><span class="trip-status ${tripStatus(trip)}">${statusLabel(trip)}</span><span class="hint">${new Date(trip.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</span></div><h2 class="order-title">${esc(trip.customer||'Поездка')}</h2><p class="order-car">${esc(trip.carName)} · ${num(trip.consumption)} л / 100 км</p><section class="panel order-section"><h3>Маршрут</h3>${routeSummary(trip.route)}</section><section class="panel order-section"><h3>${tripStatus(trip)==='planned'?'Предварительный расчёт':'Расчёт заказа'}</h3><div class="metric-line"><span>За рейс</span><strong>${money(trip.fee)} BYN</strong></div><div class="metric-line"><span>Топливо · ${num(result.liters,2)} л</span><strong>${money(result.cost)} BYN</strong></div><p class="hint">${trip.price>0?`По цене ${money(trip.price)} BYN / л`:'Цена бензина не указана. Откройте «Изменить», чтобы добавить её.'}</p><div class="metric-line"><span>${trip.compensation?'Рейс + топливо':'Начислено без компенсации топлива'}</span><strong>${money(result.due)} BYN</strong></div><div class="metric-line"><span>После топлива</span><strong>${money(result.net)} BYN</strong></div></section>${trip.note?`<section class="panel order-section"><h3>Заметка</h3><p class="order-note">${esc(trip.note)}</p></section>`:''}<div class="order-actions">${tripStatus(trip)==='planned'?`<button class="primary" data-action="complete-trip" data-id="${esc(trip.id)}">Завершить заказ</button>`:''}<button data-action="edit-trip" data-id="${esc(trip.id)}">Изменить</button><button class="quiet" data-action="repeat-trip" data-id="${esc(trip.id)}">Повторить поездку</button><button class="quiet danger" data-action="delete-trip" data-id="${esc(trip.id)}">Удалить заказ</button></div>`);
}
function readDraft(key){
  try{const draft=JSON.parse(localStorage.getItem(DRAFT_PREFIX+key));return validDraft(draft)?draft:null}catch{return null}
}
function removeDraft(key){
  try{localStorage.removeItem(DRAFT_PREFIX+key)}catch{toast('Заказ сохранён, но черновик удалить не удалось.')}
}
function tripForm(tripId,routeId,seed,skipDraft=false){
  const trip=data.trips.find(entry=>entry.id===tripId),draftKey=trip?.id||'new',draft=readDraft(draftKey);
  if(draft&&!skipDraft){
    modal('Есть сохранённый черновик',`<p>Продолжить заполнение или начать заново?</p><div class="form-actions"><button class="quiet" id="discard-draft">Начать заново</button><button class="primary" id="resume-draft">Продолжить</button></div>`);
    $('#resume-draft').onclick=()=>{$('#modal').close();tripForm(tripId,routeId,draft,true)};
    $('#discard-draft').onclick=()=>{removeDraft(draftKey);$('#modal').close();tripForm(tripId,routeId,seed,true)};
    return;
  }
  const base=seed||trip,route=base?.route||data.routes.find(entry=>entry.id===routeId);
  if(!data.cars.length&&!base){
    modal('Сначала добавьте машину','<p>Для расчёта топлива нужен её средний расход.</p><div class="form-actions"><button class="primary" data-action="first-car">Добавить машину</button></div>');return;
  }
  const initialPrice=base?.price??data.settings.price;
  const vehicles=[
    ...(base?[{id:'snapshot',name:base.carName,consumption:base.consumption,snapshot:true}]:[]),
    ...data.cars.filter(car=>!base||car.name!==base.carName||car.consumption!==base.consumption)
  ];
  const initialStatus=base?tripStatus(base):'planned';
  openTripEditor(trip?'Изменить заказ':'Новый заказ',`<form id="trip-form" autocomplete="off"><p class="editor-intro">Маршрут, детали и расчёт — в одном заказе.</p><section class="form-section"><div class="section-caption"><span>01</span><h3>Когда едем</h3></div><div id="trip-date-picker"></div><fieldset class="status-field"><legend>Статус заказа</legend><div class="segmented"><span class="segment-indicator" aria-hidden="true"></span>${[['planned','В процессе'],['completed','Завершён']].map(([value,label])=>`<label><input class="choice-input" type="radio" name="trip-status" value="${value}" ${initialStatus===value?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset></section><section class="form-section"><div class="section-caption"><span>02</span><h3>Заказчик и машина</h3></div><label for="customer">Заказчик <span class="optional-label">необязательно</span></label><input id="customer" maxlength="100" placeholder="Имя или название хозяйства…" value="${esc(base?.customer||'')}"><div class="customer-suggestions" id="customer-suggestions" role="group" aria-label="Выбрать заказчика"></div><fieldset class="vehicle-field"><legend>На какой машине</legend><div class="vehicle-choices">${vehicles.map((car,index)=>`<label class="vehicle-choice"><input class="choice-input" type="radio" name="trip-car" value="${esc(car.id)}" ${index===0?'checked':''}><span class="vehicle-choice-content"><span class="vehicle-symbol" aria-hidden="true">${carIcon}</span><span class="vehicle-copy"><strong>${esc(car.name)}</strong><small>${num(car.consumption)} л / 100 км${car.snapshot?' · из заказа':''}</small></span><span class="choice-check" aria-hidden="true"></span></span></label>`).join('')}</div></fieldset></section><section class="form-section"><div class="section-caption"><span>03</span><h3>Куда едем</h3></div>${data.routes.length?`<details class="route-picker" ${!route?'open':''}><summary>Готовые маршруты <span>${data.routes.length}</span></summary><div class="route-choices">${data.routes.map(saved=>`<button type="button" class="route-choice" data-pick-route="${esc(saved.id)}" aria-pressed="false"><strong>${esc(name(saved))}</strong><span>${num(totalKm(saved))} км · ${saved.round?'туда и обратно':'в одну сторону'}</span></button>`).join('')}</div></details>`:'<p class="hint">Укажите точки и расстояние между ними.</p>'}<div class="route-edit-fields">${routeFields(route)}</div><div class="route-preview" id="route-preview"></div>${!trip?`<label class="check"><input type="checkbox" id="save-route" ${base?.saveRoute?'checked':''}>Сохранить маршрут для следующих поездок</label>`:''}</section><section class="form-section"><div class="section-caption"><span>04</span><h3>Стоимость и детали</h3></div><label class="fee-field" for="fee">Оплата за рейс<span class="fee-input"><input id="fee" type="number" inputmode="decimal" min="0" max="1000000000" step="0.01" value="${base?.fee??0}" required><span>BYN</span></span></label><details class="fuel-settings"><summary>Изменить стоимость бензина</summary><label>Цена бензина, BYN / л<input id="fuel-price" type="number" inputmode="decimal" min="0" max="1000" step="0.001" value="${initialPrice}" required></label><p class="hint">Только для этого заказа. Другие поездки сохранят свою цену.</p></details><label for="note">Заметка <span class="optional-label">необязательно</span></label><textarea id="note" maxlength="500" rows="2" placeholder="Что важно помнить о заказе…">${esc(base?.note||'')}</textarea><div class="result" id="result" aria-live="polite"></div></section><p class="hint draft-status" id="draft-status">Изменения сохраняются в черновик автоматически.</p><div class="form-actions editor-savebar"><div><span>Итого за заказ</span><strong id="save-total"></strong></div><button class="primary">${trip?'Сохранить':'Создать заказ'}</button></div></form>`);
  setupRoute(route);
  mountDatePicker($('#trip-date-picker'),{value:base?.date??today(),today:today(),onChange:()=>update()});
  const selectedCar=()=>{
    const selected=$('input[name="trip-car"]:checked').value;
    return selected==='snapshot'?{name:base.carName,consumption:base.consumption}:data.cars.find(car=>car.id===selected);
  };
  function customerChoices(){
    const query=$('#customer').value.trim().toLowerCase();
    const matches=customers().filter(customer=>!query||customer.toLowerCase().includes(query)).slice(0,8);
    $('#customer-suggestions').innerHTML=matches.map(customer=>`<button type="button" class="choice-chip" data-choose-customer="${esc(customer)}" aria-pressed="${customer===$('#customer').value}">${esc(customer)}</button>`).join('');
    $('#customer-suggestions').querySelectorAll('button').forEach(button=>button.onclick=()=>{
      $('#customer').value=button.dataset.chooseCustomer;customerChoices();update();
    });
  }
  customerChoices();
  const readTrip=()=>{
    const car=selectedCar();
    return {date:$('#date').value,route:readRoute(),carName:car.name,consumption:car.consumption,price:Number($('#fuel-price').value),fee:Number($('#fee').value),compensation:base?.compensation??true,paid:trip?.paid??false,note:$('#note').value.trim(),customer:$('#customer').value.trim(),status:$('input[name="trip-status"]:checked').value};
  };
  function result(){
    const entry=readTrip(),value=calc(entry);
    $('#route-preview').innerHTML=routeSummary(entry.route);
    $('#route-preview').hidden=!entry.route.start&&!entry.route.legs.some(leg=>leg.to||leg.km);
    $('#save-total').textContent=money(value.due)+' BYN';
    $('#result').innerHTML=`<div class="fuel-summary"><span>Топливо</span><strong>${num(value.liters,2)} л</strong></div><div class="split"><span>${num(value.km)} км × ${num(entry.consumption)} л / 100 км</span><span>${money(value.cost)} BYN</span></div><p class="hint">${entry.price>0?`Цена: ${money(entry.price)} BYN / л`:'Цена бензина пока не указана'}</p><div class="fuel-total"><span>${entry.compensation?'Рейс + топливо':'За рейс'}</span><strong>${money(value.due)} BYN</strong></div>`;
  }
  function update(){
    result();
    try{
      localStorage.setItem(DRAFT_PREFIX+draftKey,JSON.stringify({...readTrip(),saveRoute:$('#save-route')?.checked??false}));
      $('#draft-status').textContent='Черновик сохранён';
    }catch{$('#draft-status').textContent='Не удалось сохранить черновик. Не закрывайте форму до сохранения заказа.'}
  }
  $('#trip-form').oninput=event=>{if(event.target.id==='customer')customerChoices();update()};$('#trip-form').onchange=update;
  $('#trip-form').addEventListener('invalid',event=>{const details=event.target.closest('details');if(details)details.open=true},true);
  $('#add-stop').onclick=()=>{if($('#stops').children.length<30){stopRow();update()}};
  document.querySelectorAll('[data-pick-route]').forEach(button=>button.onclick=()=>{
    const saved=data.routes.find(entry=>entry.id===button.dataset.pickRoute);if(!saved)return;
    $('#start').value=saved.start;$('#round').checked=saved.round;$('#stops').innerHTML='';saved.legs.forEach(stopRow);
    document.querySelectorAll('[data-pick-route]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
    button.closest('details').open=false;update();
  });
  if(seed||routeId)update();else result();
  $('#trip-form').onsubmit=event=>{
    event.preventDefault();
    const value={...readTrip(),id:trip?.id||id()};
    const next=structuredClone(data),index=next.trips.findIndex(entry=>entry.id===value.id);
    if(index<0)next.trips.push(value);else next.trips[index]=value;
    if($('#save-route')?.checked)next.routes.push({id:id(),...value.route});
    if(!validData(next)){toast('Проверьте маршрут и числовые значения.');return}
    if(persist(next)){removeDraft(draftKey);closeTripEditor();render();tripView(value.id);toast('Заказ сохранён')}
  };
}
function download(content,type,filename){const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function exportBackup(){try{const content=storageError?localStorage.getItem(KEY):JSON.stringify(data,null,2);if(!content){toast('Исходные данные недоступны.');return}download(content,'application/json','reis-backup-'+today()+'.json')}catch{toast('Не удалось прочитать данные для экспорта.')}}
function clearDrafts(){try{for(const key of Object.keys(localStorage))if(key.startsWith(DRAFT_PREFIX))localStorage.removeItem(key)}catch{toast('Не удалось очистить старые черновики.')}}
function csv(){const cell=v=>'"'+String(v).replaceAll('"','""')+'"',rows=[['Дата','Статус','Заказчик','Маршрут','Машина','км','Литры','Топливо BYN','Рейс BYN','Рейс и топливо BYN','Заметка'],...filtered().map(t=>{const c=calc(t);return[t.date,statusLabel(t),t.customer||'',name(t.route),t.carName,c.km,c.liters.toFixed(2),c.cost.toFixed(2),t.fee,c.due.toFixed(2),t.note]})];download('\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n'),'text/csv;charset=utf-8','reis-'+today()+'.csv')}
async function importFile(e){const f=e.target.files[0];if(!f)return;try{if(f.size>10000000)throw Error();const d=JSON.parse(await f.text());if(!validData(d))throw Error();modal('Восстановить резервную копию?',`<p>В файле: ${d.trips.length} поездок, ${d.routes.length} маршрутов, ${d.cars.length} машин.</p><div class="notice">Текущие записи будут заменены. Перед восстановлением можно скачать их копию.</div><div class="form-actions"><button id="backup-first">Скачать текущую копию</button><button class="primary" id="confirm-import">Заменить данные</button></div>`);$('#backup-first').onclick=exportBackup;$('#confirm-import').onclick=()=>{if(persist(d,true)){clearDrafts();undoStack.length=0;closeTripEditor();$('#modal').close();render();toast('Данные восстановлены')}}}catch{toast('Файл не подходит: нужна корректная резервная копия Рейс.')}e.target.value=''}
function deleteRecord(kind,recordId){
  const index=data[kind]?.findIndex(entry=>entry.id===recordId);if(index===undefined||index<0)return;
  modal('Удалить запись?','<p>После удаления её можно вернуть кнопкой «Вернуть». Сохранённые поездки сохранят свои маршруты и машины.</p><div class="form-actions"><button id="cancel-delete">Оставить</button><button class="danger" id="confirm-delete">Удалить</button></div>');
  $('#cancel-delete').onclick=()=>$('#modal').close();
  $('#confirm-delete').onclick=()=>{
    const record=structuredClone(data[kind][index]);
    if(mutate(next=>next[kind]=next[kind].filter(entry=>entry.id!==recordId))){
      undoStack.push({kind,index,record});$('#modal').close();if(kind==='trips')closeTripEditor();render();toast('Запись удалена. Её можно вернуть.');
    }
  };
}
function undoDelete(){
  const removed=undoStack.at(-1);if(!removed)return;
  if(data[removed.kind].some(entry=>entry.id===removed.record.id)){toast('Эта запись уже есть.');return}
  if(mutate(next=>next[removed.kind].splice(Math.min(removed.index,next[removed.kind].length),0,removed.record))){
    undoStack.pop();render();toast('Запись восстановлена');
  }
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.page){const changed=page!==b.dataset.page;page=b.dataset.page;search='';render();window.scrollTo(0,0);if(changed)animateUI($('#content'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}])}if(b.dataset.period){const changed=period!==b.dataset.period;period=b.dataset.period;render();if(changed)animateUI($('#content'),[{opacity:0.45},{opacity:1}],{duration:160})}const a=b.dataset.action,i=b.dataset.id;if(a==='trip')tripForm(i);if(a==='view-trip')tripView(i);if(a==='edit-trip')tripForm(i);if(a==='undo-delete')undoDelete();if(a==='complete-trip'){if(mutate(next=>{const trip=next.trips.find(entry=>entry.id===i);if(trip)trip.status='completed'})){render();tripView(i);toast('Заказ завершён')}}if(a==='repeat-trip'){const trip=data.trips.find(entry=>entry.id===i);if(trip)tripForm(null,null,repeatTrip(trip,today(),data.settings.price))}if(a==='car')carForm(i);if(a==='route')routeForm(i);if(a==='use-route')tripForm(null,i);if(a==='first-car'){$('#modal').close();carForm()}if(a?.startsWith('delete-'))deleteRecord({'delete-trip':'trips','delete-car':'cars','delete-route':'routes'}[a],i);if(a==='export')exportBackup();if(a==='csv')csv();if(a==='import')$('#import-file').click()});
render();if(storageError)toast('Не удалось прочитать сохранённые данные. Исходная запись не перезаписана.');if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{if($('#offline-status'))$('#offline-status').textContent='Офлайн-версия пока недоступна. Откройте приложение по HTTPS и обновите страницу.'});


function closeTripEditor(animated=false){
  const editor=$('#trip-editor');if(!editor)return;
  const remove=()=>{if(!editor.isConnected)return;editor.remove();document.querySelectorAll('main,aside').forEach(element=>element.inert=false);$('#nav .nav-add')?.focus()};
  if(animated!==true){remove();return}
  if(editor.dataset.closing)return;
  editor.dataset.closing='true';
  editor.style.pointerEvents='none';
  const animation=animateUI(editor,[{opacity:1},{opacity:0}],{duration:140,easing:'ease-in'});
  if(animation)animation.finished.then(remove,()=>{});else remove();
}
function openTripEditor(title,body){closeTripEditor();document.querySelector('#dialog-body').innerHTML='';const editor=document.createElement('section');editor.id='trip-editor';editor.setAttribute('role','dialog');editor.setAttribute('aria-modal','true');editor.setAttribute('aria-label',title);editor.innerHTML='<div class="editor-shell"><header class="editor-header"><h2>'+esc(title)+'</h2><button type="button" class="icon-button editor-close" aria-label="Закрыть поездку">✕</button></header><div class="editor-body">'+body+'</div></div>';document.body.append(editor);document.querySelectorAll('main,aside').forEach(element=>element.inert=true);editor.querySelector('.editor-close').onclick=()=>closeTripEditor(true);editor.querySelector('.editor-close').focus();animateUI(editor,[{opacity:0},{opacity:1}],{duration:240})}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('#modal').open)closeTripEditor(true)});
