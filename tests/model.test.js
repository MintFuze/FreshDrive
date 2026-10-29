import{test}from'node:test';import assert from'node:assert/strict';import{totalKm,calculate,validData}from'../dist/model.js';
test('roundtrip doubles all segments exactly once',()=>assert.equal(totalKm({legs:[{km:200},{km:70}],round:true}),540));
test('fuel compensation and net income',()=>{const c=calculate(400,8,2.5,100,true);assert.deepEqual(c,{km:400,liters:32,cost:80,due:180,net:100});assert.equal(calculate(400,8,2.5,100,false).net,20)});
test('imports reject invalid and negative values',()=>{const d={version:1,cars:[],routes:[],trips:[],settings:{price:2.5}};assert.ok(validData(d));assert.ok(!validData({...d,settings:{price:-1}}));assert.ok(!validData({...d,trips:[{}]}))});
