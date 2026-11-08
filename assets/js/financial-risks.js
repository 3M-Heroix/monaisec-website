(() => {
  const $ = id => document.getElementById(id);
  let records = [], filtered = [];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const unique = a => [...new Set(a)].sort();
  const list = (id, arr) => $(id).innerHTML = arr.map(x => `<li>${esc(x)}</li>`).join('');
  function render(){
    const q=$('query').value.trim().toLowerCase(), cat=$('category').value, exp=$('exposure').value;
    filtered=records.filter(r=> (!cat||r.category===cat)&&(!exp||r.agent_exposure===exp)&&(!q||JSON.stringify(r).toLowerCase().includes(q)));
    $('resultCount').textContent=`${filtered.length} of ${records.length} records`;
    $('records').innerHTML=filtered.length?filtered.map(r=>`<article class="risk-card"><div class="risk-card-top"><span class="risk-tag">${esc(r.category)}</span><span class="risk-exposure">${esc(r.agent_exposure)}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><div class="risk-chips">${r.financial_functions.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="risk-card-foot"><span>${esc(r.id)} · ${r.sources.length} sources</span><button class="risk-open" data-id="${esc(r.id)}">Explore risk ↗</button></div></article>`).join(''):'<div class="empty-state">No risk channels match these filters. Try a broader search or reset the filters.</div>';
    $('records').querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>openRecord(b.dataset.id)));
  }
  function openRecord(id){
    const r=records.find(x=>x.id===id); if(!r)return;
    $('modalId').textContent=r.id; $('modalTitle').textContent=r.title; $('modalSubtitle').textContent=`${r.category} · ${r.agent_exposure}`;
    $('detailGrid').innerHTML=`<div><strong>Financial functions</strong><span>${esc(r.financial_functions.join(' · '))}</span></div><div><strong>Evidence classification</strong><span>${esc(r.evidence_class)}</span></div>`;
    $('modalPathway').textContent=r.agent_pathway; $('modalTransmission').textContent=r.transmission;
    list('modalConsequences',r.potential_consequences); list('modalIndicators',r.monitoring_indicators); list('modalControls',r.control_themes); $('modalEvidence').textContent=r.evidence_note;
    const related=[...r.related_threats.map(id=>`<a href="threats.html#${encodeURIComponent(id)}">${esc(id)}</a>`),...r.related_regulations.map(id=>`<a href="regulatory.html#${encodeURIComponent(id)}">${esc(id)}</a>`)];
    $('modalRelated').innerHTML=related.length?related.join(' · '):'No linked records yet.';
    $('modalSources').innerHTML=r.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`).join(''); $('modal').classList.add('open'); document.body.style.overflow='hidden';
  }
  function close(){ $('modal').classList.remove('open'); document.body.style.overflow=''; }
  function csv(){const cols=['id','title','category','agent_exposure','summary','agent_pathway','transmission','evidence_class','evidence_note'];const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[cols.join(','),...filtered.map(r=>cols.map(c=>quote(r[c])).join(','))];const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='monaisec-financial-risk-observatory.csv';a.click();URL.revokeObjectURL(a.href);}
  async function init(){
    try{const res=await fetch('data/financial-risks.json');if(!res.ok)throw Error(`HTTP ${res.status}`);const data=await res.json();records=data.records||[];
      $('totalCount').textContent=records.length; $('categoryCount').textContent=unique(records.map(r=>r.category)).length; $('functionCount').textContent=unique(records.flatMap(r=>r.financial_functions)).length; $('sourceCount').textContent=unique(records.flatMap(r=>r.sources.map(s=>s.url))).length;
      unique(records.map(r=>r.category)).forEach(v=>$('category').insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));
      $('datasetMeta').textContent=`${data.dataset_title} · v${data.dataset_version} · Last reviewed ${data.last_reviewed}. ${data.scope}`;
      $('year').textContent=new Date().getFullYear(); render();
    }catch(e){$('records').innerHTML=`<div class="empty-state">The risk dataset could not be loaded. Run this website through a local HTTP server or check that data/financial-risks.json is deployed. (${esc(e.message)})</div>`;$('resultCount').textContent='Dataset unavailable';}
  }
  ['query','category','exposure'].forEach(id=>$(id).addEventListener(id==='query'?'input':'change',render));
  $('reset').addEventListener('click',()=>{$('query').value='';$('category').value='';$('exposure').value='';render();}); $('export').addEventListener('click',csv); $('closeModal').addEventListener('click',close); $('modal').addEventListener('click',e=>{if(e.target===$('modal'))close();}); document.addEventListener('keydown',e=>{if(e.key==='Escape')close();}); init();
})();
