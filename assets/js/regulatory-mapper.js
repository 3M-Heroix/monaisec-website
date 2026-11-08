(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const state = { regulations: [], rules: [], controls: [], sources: [], watch: null, lastAssessment: null };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const readJSON = async path => { const r = await fetch(path, {cache:"no-store"}); if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); };
  const profile = () => ({
    jurisdiction:$("jurisdiction").value, sector:$("sector").value, usecase:$("usecase").value,
    regulated:$("regulated").value, autonomy:$("autonomy").value, authority:$("authority").value,
    personalData:$("personalData").checked, euData:$("euData").checked, thirdParty:$("thirdParty").checked,
    customerImpact:$("customerImpact").checked, humanOversight:$("humanOversight").checked, euMarket:$("euMarket").checked
  });
  const recordFor = id => state.regulations.find(r => r.id === id);
  const matches = (rule,p) => {
    const t = rule.triggers || {};
    if (t.jurisdictions && !t.jurisdictions.includes(p.jurisdiction) && !(t.allowEuMarket && (p.euMarket || p.euData))) return false;
    if (t.sectors && !t.sectors.includes(p.sector)) return false;
    if (t.regulated && !t.regulated.includes(p.regulated)) return false;
    if (t.usecases && !t.usecases.includes(p.usecase)) return false;
    if (t.any && !t.any.some(k => !!p[k])) return false;
    if (t.all && !t.all.every(k => !!p[k])) return false;
    if (t.authority && !t.authority.includes(p.authority)) return false;
    return true;
  };
  function runMapping() {
    const p = profile();
    const results = state.rules.filter(r => matches(r,p)).map(rule => {
      const record = recordFor(rule.regulation_id);
      if (!record) return null;
      return {rule,record};
    }).filter(Boolean);
    results.sort((a,b) => (a.rule.rank||9)-(b.rule.rank||9));
    state.lastAssessment = {generated_at:new Date().toISOString(),profile:p,results:results.map(x=>({regulation_id:x.record.id,classification:x.rule.classification,reason:x.rule.reason,review_questions:x.rule.review_questions}))};
    $("results").hidden = false;
    $("resultIntro").textContent = `${p.jurisdiction} · ${p.sector} · ${p.usecase} · ${p.autonomy.replaceAll("_"," ")}`;
    $("candidateCount").textContent = results.length;
    $("bindingCount").textContent = results.filter(x=>x.record.legal_force==="Binding").length;
    $("reviewCount").textContent = results.filter(x=>x.rule.classification!=="potential").length;
    $("mappedRecords").innerHTML = results.length ? results.map(({rule,record}) => {
      const tag = rule.classification==="potential" ? "tag-direct" : rule.classification==="voluntary" ? "tag-voluntary" : "tag-context";
      const label = rule.classification==="potential" ? "Potentially applicable — verify" : rule.classification==="voluntary" ? "Voluntary reference" : "Contextual — applicability review";
      const url = record.primary_text_url || record.source_url || "#";
      return `<article class="record"><div class="record-top"><div><div class="meta">${esc(record.jurisdiction)} · ${esc(record.issuer)}</div><h3>${esc(record.short_title || record.title)}</h3><div class="muted">${esc(record.instrument_type)} · ${esc(record.legal_force)} · ${esc(record.status)}</div></div><span class="tag ${tag}">${label}</span></div><p>${esc(rule.reason)}</p><p class="why"><b>What to verify:</b> ${esc(rule.review_questions.join(" "))}</p><p class="verify">MONAISEC mapping status: analyst-authored candidate mapping. Legal applicability is not determined by this tool. Record last verified: ${esc(record.last_verified || "not recorded")}.</p><a href="${esc(url)}" target="_blank" rel="noopener">Open primary source ↗</a></article>`;
    }).join("") : `<div class="record"><h3>No curated mapping matched this profile</h3><p>That does not mean no law applies. Expand the jurisdictional analysis and consult local financial-services, privacy, outsourcing, consumer-protection and market-conduct rules.</p></div>`;
    renderControls(results);
    $("results").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function renderControls(results) {
    const domains = new Set(results.flatMap(x=>x.rule.control_ids||[]));
    const controls = state.controls.filter(c=>domains.has(c.id));
    $("controlList").innerHTML = controls.map(c=>`<label class="control-item"><input type="checkbox" data-control="${esc(c.id)}"><span><b>${esc(c.title)}</b><small>${esc(c.prompt)}</small></span></label>`).join("") || `<p class="muted">No mapped controls for this profile. Review the instrument texts directly.</p>`;
    $("controlList").querySelectorAll("input").forEach(el=>el.addEventListener("change",updateCoverage));
    updateCoverage();
  }
  function updateCoverage(){
    const all=[...$("controlList").querySelectorAll("input")], done=all.filter(x=>x.checked).length;
    $("coverageFill").style.width=(all.length?done/all.length*100:0)+"%";
    $("coverageText").textContent=`${done} of ${all.length} discussion items marked addressed`;
  }
  function exportAssessment(){
    if(!state.lastAssessment) return;
    const payload={...state.lastAssessment,control_discussion:[...$("controlList").querySelectorAll("input")].map(x=>({control_id:x.dataset.control,addressed:x.checked})),disclaimer:"Research scoping aid only. Not legal advice or a legal applicability determination."};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="monaisec-regulatory-assessment.json";a.click();URL.revokeObjectURL(a.href);
  }
  function renderWatch(){
    const w=state.watch||{}, items=w.items||[];
    $("watchCount").textContent=items.length;
    $("sourceCount").textContent=state.sources.length;
    $("watchUpdated").textContent=w.last_checked_at ? new Date(w.last_checked_at).toLocaleString() : "Not run yet";
    $("watchStatus").textContent=w.last_checked_at ? "COLLECTION SNAPSHOT" : "AWAITING FIRST RUN";
    $("watchItems").innerHTML=items.slice(0,12).map(i=>`<div class="watch-item"><div><a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.title)}</a><small>${esc(i.publisher||i.source_id)} · ${esc(i.published||"Date not supplied")} · ${esc((i.matched_terms||[]).join(", "))}</small></div><span class="tag tag-context">Needs review</span></div>`).join("") || `<div class="record"><p class="muted">No review candidates yet. Run the scheduled GitHub workflow after integration, or trigger it manually from the repository Actions tab.</p></div>`;
    $("sourceLinks").innerHTML=state.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join("");
  }
  async function init(){
    $("year")?.remove();
    try{
      const [db,rules,feeds,watch,additions]=await Promise.all([
        readJSON("data/regulations.json"),readJSON("data/mapper-rules.json"),
        readJSON("data/regulatory-sources.json"),readJSON("data/regulatory-watch.json").catch(()=>({items:[]})),
        readJSON("data/regulatory-records-additions.json").catch(()=>({records:[]}))
      ]);
      state.regulations=[...(db.records||[]),...(additions.records||[])];state.rules=rules.mappings||[];state.controls=rules.controls||[];state.sources=feeds.sources||[];state.watch=watch;
      renderWatch();
      $("mapBtn").addEventListener("click",runMapping);
      $("reset").addEventListener("click",()=>{document.querySelectorAll(".profile-grid select").forEach((s,i)=>s.selectedIndex=0);document.querySelectorAll(".checks input").forEach((c,i)=>c.checked=[true,false,true,false,true,false][i]);$("results").hidden=true;});
      $("export").addEventListener("click",exportAssessment);
      $("mapBtn").click();
    }catch(err){
      $("watchStatus").textContent="DATA LOAD ERROR";
      $("watchItems").innerHTML=`<div class="record"><h3>Could not load MONAISEC data</h3><p>${esc(err.message)}</p><p class="muted">Check that this page is at the repository root and the existing data/regulations.json file is present.</p></div>`;
      console.error(err);
    }
  }
  init();
})();