#!/usr/bin/env node
'use strict';
// Auditoría independiente de los 16 recorridos: categorías, productos, imágenes y WhatsApp.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');

function simulate(source){
 const elements={};
 const element=id=>elements[id]??={dataset:{},children:Array.from({length:4},()=>({classList:{toggle(){}}})),addEventListener(){},contains(){return true},querySelectorAll(){return []},innerHTML:'',textContent:''};
 const start=source.indexOf('// GALYON Asesor de Cultivos');assert(start>=0);
 const advisorSlice = source.slice(start);
 const advisorEnd = advisorSlice.indexOf('\n// Video Background') !== -1 ? advisorSlice.indexOf('\n// Video Background') : advisorSlice.length;
 const cleanCode = advisorSlice.slice(0, advisorEnd);
 const code=cleanCode.replace('(()=>{','function createAdvisor(){').replace(/ render\(\);\n\}\)\(\);\s*$/, ' return {data,chooseSymptoms,partsForCrop,result,agentForResult:typeof agentForResult==="function"?agentForResult:null,visualFor:typeof visualFor==="function"?visualFor:null,render,setStep(value){step=value},farmCrops,gardenCrops};\n}\ncreateAdvisor();');
 return vm.runInNewContext(code,{document:{getElementById:element},window:{scrollTo(){}},encodeURIComponent,HTMLImageElement:class{},requestAnimationFrame(){}});
}

const source=fs.readFileSync(path.join(__dirname,'script.js'),'utf8');
const sim=simulate(source);
const expected={
 'Toda la planta':[['maiz_amarillamiento_general',null],['maiz_crecimiento_desigual',null],['maiz_marchitez_general',null],['maiz_caidas_secamiento',null]],
 'Hojas':[['maiz_manchas','Bacillus subtilis'],['maiz_roya',null],['maiz_oruga','Bacillus thuringiensis'],['maiz_clorosis_intervenal',null]],
 'Raíces o tallo':[['maiz_base_pudricion','Trichoderma spp.'],['maiz_raices_deterioradas','Trichoderma spp.'],['maiz_galerias_tallo','Bacillus thuringiensis'],['maiz_tallo_quebradizo',null]],
 'Frutos o mazorcas':[['maiz_granos_manchas','Bacillus amyloliquefaciens'],['maiz_pudricion_mazorca','Bacillus amyloliquefaciens'],['maiz_perforaciones_mazorca','Bacillus thuringiensis'],['maiz_mal_llenado_mazorca',null]]
};
const seen=new Set(),photos=new Set();let tested=0;
Object.assign(sim.data,{area:'Finca o plantación',crop:'Maíz'});
assert.deepEqual(Array.from(sim.partsForCrop(),x=>x.text),['Toda la planta','Hojas','Raíces o tallo','Mazorcas de maíz']);
for(const[part,cases]of Object.entries(expected)){
 sim.data.part=part;
 const options=sim.chooseSymptoms();assert.deepEqual(Array.from(options,x=>x.key),[...cases.map(x=>x[0]),'otro']);
 for(const[key,microbe]of cases){
  assert(!seen.has(key));seen.add(key);const symptom=options.find(x=>x.key===key);
  if(symptom.image){assert(!photos.has(symptom.image));photos.add(symptom.image);assert(fs.existsSync(path.join(__dirname,'assets','asesor',symptom.image+'.webp')));}
  sim.data.symptom=key;const html=sim.result();assert(html.includes('CAUSA PROBABLE A VERIFICAR'));
  assert(html.includes('Qué buscamos conseguir'));assert(html.includes('Qué hacer en campo'));assert(!html.includes('quizás'));
  const hasProduct=html.includes('class="advisor-product"');assert.equal(hasProduct,Boolean(microbe),key);
  if(microbe){assert(html.includes(microbe));assert(/GALYON (BACT|TRICHO|INSECTA) — /.test(html));}
  const href=html.match(/class="advisor-cta advisor-cta-v523" href="([^"]+)"/)[1];const url=new URL(href);assert.equal(url.hostname,'wa.me');
  const message=url.searchParams.get('text');assert(message.includes('Cultivo: Maíz'));assert(message.includes(symptom.text));assert(message.includes('Causa probable a verificar:'));assert(message.includes('Objetivos:'));assert(message.includes('Acciones de campo:'));
  if(microbe)assert(message.includes(microbe));else assert(message.includes('Sin bioinsumo asignado automáticamente.'));
  assert(!/<img[^>]*src="(?:undefined|null|)"/.test(html));
  const visual=sim.visualFor(symptom,'symptoms');
  const evidence=html.match(/class="advisor-evidence-image"><img src="([^"]+)"/);
  assert(evidence,key+' sin referencia visual');assert.equal(evidence[1],'assets/asesor/'+(sim.agentForResult?.()?.image||visual.image)+'.webp');
  tested++;
 }
 sim.data.symptom='otro';const unknown=sim.result();assert(unknown.includes('https://wa.me/'));assert(!unknown.includes('class="advisor-product"'));
}
assert.equal(tested,16);assert.equal(photos.size,12);
console.log('16 recorridos de Maíz y cuatro opciones de consulta libre: OK');

// Uso opcional en una revisión: comparar todos los diagnósticos de otros cultivos con un script anterior.
if(process.argv[2]){
 const baseline=simulate(fs.readFileSync(process.argv[2],'utf8'));let compared=0;
 const withoutEvidence=html=>html.replace(/<div class="advisor-evidence-image">[\s\S]*?<\/div>/g,'').replace(/advisor-evidence is-text-only/g,'advisor-evidence');
 for(const [part,cases] of Object.entries(expected)){for(const [key] of cases){Object.assign(sim.data,{area:'Finca o plantación',crop:'Maíz',part,symptom:key});Object.assign(baseline.data,sim.data);assert.equal(withoutEvidence(sim.result()),withoutEvidence(baseline.result()),'Resultado de Maíz modificado: '+key);}}
 console.log('16 diagnósticos y mensajes de Maíz idénticos; solo cambia su referencia visual.');
 for(const[area,crops]of [['Finca o plantación',sim.farmCrops],['Huerto o jardín',sim.gardenCrops]]){
  for(const crop of crops){if(crop.key==='Maíz')continue;
   Object.assign(sim.data,{area,crop:crop.key});Object.assign(baseline.data,{area,crop:crop.key});
   for(const part of sim.partsForCrop()){
    sim.data.part=baseline.data.part=part.key;const symptoms=sim.chooseSymptoms();
    assert.equal(JSON.stringify(symptoms),JSON.stringify(baseline.chooseSymptoms()),crop.key);
    for(const symptom of symptoms){sim.data.symptom=baseline.data.symptom=symptom.key;assert.equal(withoutEvidence(sim.result()),withoutEvidence(baseline.result()),crop.key+' / '+part.key+' / '+symptom.key);compared++;}
   }
  }
 }
 console.log(compared+' diagnósticos y mensajes de otros cultivos idénticos; solo cambian referencias visuales.');
}
