import{test}from'node:test';import assert from'node:assert/strict';import{totalKm,calculate,validData}from'../dist/model.js';
test('roundtrip doubles all segments exactly once',()=>assert.equal(totalKm({legs:[{km:200},{km:70}],round:true}),540));
test('fuel compensation and net income',()=>{const c=calculate(400,8,2.5,100,true);assert.deepEqual(c,{km:400,liters:32,cost:80,due:180,net:100});assert.equal(calculate(400,8,2.5,100,false).net,20)});
test('imports reject invalid and negative values',()=>{const d={version:1,cars:[],routes:[],trips:[],settings:{price:2.5}};assert.ok(validData(d));assert.ok(!validData({...d,settings:{price:-1}}));assert.ok(!validData({...d,trips:[{}]}))});
import{tripStatus,repeatTrip,summarizeTrips,validDraft}from'../dist/model.js';
const sample=()=>({id:'trip-1',date:'2026-10-29',carName:'Тест',price:2.5,consumption:8,fee:100,compensation:true,paid:false,note:'Яблоки',customer:'Сад',route:{start:'А',legs:[{to:'Б',km:400}],round:false}});

test('repeating uses today and current price without changing the original snapshot',()=>{
  const original={...sample(),status:'completed',paid:true};
  const repeated=repeatTrip(original,'2026-10-30',3);
  assert.equal(repeated.id,undefined);
  assert.equal(repeated.date,'2026-10-30');
  assert.equal(repeated.status,'planned');
  assert.equal(repeated.paid,false);
  assert.equal(repeated.customer,'Сад');
  assert.equal(repeated.fee,100);
  assert.equal(repeated.price,3);
  assert.equal(original.price,2.5);
  repeated.route.legs[0].km=10;
  assert.equal(original.route.legs[0].km,400);
});

test('planned orders do not count until completed, independent of payment',()=>{
  const legacy=sample(),planned={...sample(),status:'planned',paid:true};
  assert.equal(tripStatus(legacy),'completed');
  assert.deepEqual(summarizeTrips([legacy,planned]),{km:400,liters:32,cost:80,due:180,net:100});
  planned.status='completed';
  assert.equal(summarizeTrips([legacy,planned]).due,360);
  planned.status='planned';
  assert.equal(summarizeTrips([legacy,planned]).due,180);
});

test('explicitly filling an old order price recalculates only that order',()=>{
  const original={...sample(),price:0},other=sample();
  assert.equal(summarizeTrips([original,other]).due,280);
  original.price=3;
  assert.equal(summarizeTrips([original,other]).due,376);
  assert.equal(other.price,2.5);
  assert.equal(summarizeTrips([original,other]).due,376);
  const repeated=repeatTrip({...original,price:0},'2026-10-30',4);
  assert.equal(repeated.price,4);
});

test('new fields survive backup roundtrip and legacy backups remain valid',()=>{
  const backup={version:1,cars:[],routes:[],trips:[sample()],settings:{price:3}};
  assert.ok(validData(backup));
  backup.trips.push({...sample(),id:'trip-2',status:'planned'});
  assert.ok(validData(JSON.parse(JSON.stringify(backup))));
  backup.trips[1].status='unpaid';
  assert.equal(validData(backup),false);
  delete backup.trips[1].status;backup.trips[1].customer={};
  assert.equal(validData(backup),false);
});

test('partial drafts restore safely but cannot be imported as saved orders',()=>{
  const draft={...sample(),status:'planned',saveRoute:true,route:{start:'',legs:[{to:'',km:0}],round:true}};
  assert.ok(validDraft(JSON.parse(JSON.stringify(draft))));
  assert.equal(validData({version:1,cars:[],routes:[],trips:[draft],settings:{price:3}}),false);
  assert.equal(validDraft({...draft,price:-1}),false);
  assert.equal(validDraft({...draft,route:{...draft.route,legs:[null]}}),false);
  assert.equal(validDraft({...draft,consumption:Infinity}),false);
});
