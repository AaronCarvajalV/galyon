#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements={};const element=id=>elements[id]??={dataset:{},children:Array.from({length:4},()=>({classList:{toggle(){}}})),addEventListener(){},contains(){return true},querySelectorAll(){return[]}};
const source=fs.readFileSync('script.js','utf8');
const advisorStart = source.indexOf('// GALYON Asesor de Cultivos');
const advisorSlice = source.slice(advisorStart);
const advisorEnd = advisorSlice.indexOf('\n// Video Background') !== -1 ? advisorSlice.indexOf('\n// Video Background') : advisorSlice.length;
const cleanCode = advisorSlice.slice(0, advisorEnd);
const code = cleanCode.replace('(()=>{','function advisor(){').replace(/ render\(\);\n\}\)\(\);\s*$/,' return {data,partsForCrop,chooseSymptoms,farmCrops,agentForResult,result};\n}\nadvisor();');
const sim=vm.runInNewContext(code,{document:{getElementById:element},window:{},encodeURIComponent});
const ledger=JSON.parse(fs.readFileSync('docs/asesor-agentes-referencia.json','utf8'));
const reached=new Set();let agents=0,fallbacks=0;
for(const crop of sim.farmCrops){
 if(crop.key==='Otro cultivo')continue;
 Object.assign(sim.data,{area:'Finca o plantación',crop:crop.key});
 for(const part of sim.partsForCrop()){
  sim.data.part=part.key;
  for(const symptom of sim.chooseSymptoms()){
   sim.data.symptom=symptom.key;
   const route=crop.key+'|'+symptom.key,id=ledger.routes[route],agent=sim.agentForResult(),html=sim.result();
   if(id){
    reached.add(route);agents++;assert.equal(agent.id,id);assert.equal(agent.image,ledger.agents[id].image);
    assert(fs.existsSync('assets/asesor/'+agent.image+'.webp'));assert(html.includes('data-agent-id="'+id+'"'));assert(html.includes(agent.scientific));assert(html.includes('ilustración de referencia'));
    assert.equal(agent.example,crop.key==='Caña de azúcar'&&symptom.key==='cana_barrenador');
   }else{fallbacks++;assert.equal(agent,null);assert(!html.includes('data-agent-id='));}
   const href=html.match(/class="advisor-cta[^>]+href="([^"]+)"/)[1];const message=new URL(href.replaceAll('&amp;','&')).searchParams.get('text');assert(message.includes(crop.key));
  }
 }
 sim.data.symptom='otro';assert.equal(sim.agentForResult(),null);
}
assert.equal(reached.size,Object.keys(ledger.routes).length);
Object.assign(sim.data,{area:'Finca o plantación',crop:'Cacao',part:'parte inexistente',symptom:'cacao_blanco'});assert.equal(sim.agentForResult(),null,'No asociar síntomas ajenos al órgano');
Object.assign(sim.data,{area:'Huerto o jardín',crop:'Cacao',part:'Frutos',symptom:'cacao_blanco'});assert.equal(sim.agentForResult(),null,'Huerto conserva sus referencias');
assert.equal(Object.keys(ledger.agents).length,14);
console.log(`${reached.size} asociaciones, ${agents} resultados con agente y ${fallbacks} sin agente específico: OK; WhatsApp y límites de categoría verificados.`);
