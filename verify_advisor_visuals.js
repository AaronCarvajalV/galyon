#!/usr/bin/env node
'use strict';
// Verifica las asociaciones por cultivo/órgano sin alterar datos ni resultados.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('script.js','utf8');
const elements={};
const element=id=>elements[id]??={dataset:{},children:Array.from({length:4},()=>({classList:{toggle(){}}})),addEventListener(){},contains(){return true},querySelectorAll(){return[]}};
const advisorStart = source.indexOf('// GALYON Asesor de Cultivos');
const advisorSlice = source.slice(advisorStart);
const advisorEnd = advisorSlice.indexOf('\n// Video Background') !== -1 ? advisorSlice.indexOf('\n// Video Background') : advisorSlice.length;
const cleanCode = advisorSlice.slice(0, advisorEnd);
const code = cleanCode.replace('(()=>{','function advisor(){').replace(/ render\(\);\n\}\)\(\);\s*$/,' return {data,partsForCrop,chooseSymptoms,farmCrops,farmCropCovers,grid,visualFor,result,agentForResult,advisorCardImages};\n}\nadvisor();');
const sim=vm.runInNewContext(code,{document:{getElementById:element},window:{},encodeURIComponent});
let cards=0,replaced=0,covers=0,results=0;const used=new Set();
for(const crop of sim.farmCrops){
 if(crop.key==='Otro cultivo')continue;
 Object.assign(sim.data,{area:'Finca o plantación',crop:crop.key});
 assert(fs.existsSync('assets/asesor/'+sim.farmCropCovers[crop.key]+'.webp'));covers++;
 const parts=sim.partsForCrop();
 const partImages=new Set(Array.from(parts,item=>sim.visualFor(item,'parts').image));assert.equal(partImages.size,parts.length,'Categorías con imagen repetida: '+crop.key);
 const check=(items,kind)=>{
  const snapshot=JSON.stringify(items),html=sim.grid(items,kind),groupImages=new Set();
  for(const item of items){
   if(item.key==='otro')continue;
   const key=[crop.key,kind==='parts'?'':sim.data.part,kind,item.key].join('|');
   const image=sim.advisorCardImages[key]||item.image;
   assert(image,'Sin imagen: '+key);assert(fs.existsSync('assets/asesor/'+image+'.webp'),image);
   assert(html.includes('data-advisor-value="'+item.key+'"'));cards++;
   assert(!groupImages.has(image),'Imagen repetida dentro de '+crop.key+' / '+sim.data.part);groupImages.add(image);
   if(kind==='symptoms'){
    assert(!partImages.has(image),'Una categoría reutiliza la imagen de un síntoma: '+key);
    sim.data.symptom=item.key;const result=sim.result();
    const evidence=result.match(/class="advisor-evidence-image"><img src="([^"]+)"/);
    assert(evidence,'Resultado sin imagen: '+key);assert.equal(evidence[1],'assets/asesor/'+(sim.agentForResult()?.image||image)+'.webp','Referencia incorrecta en resultado: '+key);
    if(sim.agentForResult())assert(result.includes('ilustración de referencia'));else if(sim.advisorCardImages[key])assert(result.includes('ILUSTRACIÓN DE REFERENCIA'));results++;
   }
   if(sim.advisorCardImages[key]){used.add(key);replaced++;assert(html.includes('aria-description="Ilustración generada de referencia"'));}
  }
  assert.equal(JSON.stringify(items),snapshot,'Datos mutados');
 };
 check(parts,'parts');
 for(const part of parts){sim.data.part=part.key;check(sim.chooseSymptoms(),'symptoms');}
}
assert.equal(cards,123);assert.equal(used.size,Object.keys(sim.advisorCardImages).length);
const ledger=JSON.parse(fs.readFileSync('docs/asesor-imagenes-revision.json','utf8'));
assert.equal(ledger.entries.length,43);assert.equal(ledger.completed_illustrations,43);
for(const entry of ledger.entries){assert.equal(entry.status,'integrated');assert(fs.existsSync(entry.asset));for(const ref of entry.refs){const key=[ref.crop,ref.part,ref.kind==='part'?'parts':'symptoms',ref.key].join('|');assert.equal(sim.advisorCardImages[key],entry.slug);}}
const second=JSON.parse(fs.readFileSync('docs/asesor-imagenes-segunda-revision.json','utf8'));
assert.equal(second.entries.length,25);assert.equal(second.status,'reviewed');
for(const entry of second.entries){
 assert(fs.existsSync(entry.asset));const key=[entry.crop,entry.part,entry.kind,entry.key].join('|');
 if(entry.status==='restored-original'){
  assert.equal(sim.advisorCardImages[key],undefined);Object.assign(sim.data,{area:'Finca o plantación',crop:entry.crop,part:entry.part});
  const original=sim.chooseSymptoms().find(item=>item.key===entry.key),visual=sim.visualFor(original,entry.kind);
  assert.equal(visual.image,entry.slug);assert(!visual.referenceImage,'La foto real no debe etiquetarse como ilustración');
 }else{assert.equal(entry.status,'reviewed');assert.equal(sim.advisorCardImages[key],entry.slug);}
}
assert.equal(covers,8);assert.equal(results,91);
console.log(`${cards+covers} tarjetas revisadas; ${replaced} asociaciones verificadas; ${results} resultados con referencia de agente o síntoma según el caso. Sin repeticiones entre opciones distintas del mismo grupo.`);
