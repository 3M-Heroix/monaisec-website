const $ = selector => document.querySelector(selector);
let assessment = null;
let activeTab = 'applicable';
let records = [];
let rules = [];

async function load() {
  const urls = ['../data/regulatory-records-v2.json', '../data/obligations-v2.json'];
  [records, rules] = await Promise.all(urls.map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url} (HTTP ${response.status})`);
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error(`Missing records in ${url}`);
    return rows;
  }));
}

function readProfile() {
  const fields = ['jurisdiction', 'role', 'activity', 'autonomy', 'authority', 'impact', 'eu',
    'personal', 'thirdparty', 'algo', 'highrisk', 'regulated'];
  return Object.fromEntries(fields.map(id => [id, $(`#${id}`).value]));
}

function evaluate(rule, profile) {
  const positive = [];
  const checks = [];
  const exclusions = [];
  const reference = reason => ({status: 'reference', reasons: [reason]});
  const require = (value, yes, no, unknown) => {
    if (value === 'yes') positive.push(yes);
    else if (value === 'no') exclusions.push(no);
    else checks.push(unknown);
  };

  if (rule.jurisdictions.includes('International')) {
    return reference('International guidance for use as a contextual reference.');
  }
  if (!rule.jurisdictions.includes(profile.jurisdiction)) {
    if (!rule.jurisdictions.includes('European Union') || profile.eu === 'no') {
      return reference('Different primary jurisdiction. Retain for cross-border review.');
    }
    checks.push('An EU connection was reported from outside the primary jurisdiction. Verify territorial scope.');
  }

  if (rule.activities.includes(profile.activity)) positive.push('Financial activity matches the mapped scope.');
  else checks.push('Verify whether the activity falls within the functional scope.');
  if (rule.roles.includes(profile.role)) positive.push('Organisation role matches the mapped scope.');
  else checks.push('Verify the entity, provider or deployer role against the source.');

  if (rule.id.startsWith('OBL-EU-AIA-')) {
    require(profile.highrisk, 'Profile indicates a high-risk classification.',
      'Profile indicates the system was assessed as outside the high-risk category.',
      'Determine the AI Act classification from intended purpose, Annex III and applicable product law.');
    if (profile.eu === 'no') checks.push('Establish the territorial connection for this use.');
  }
  if (rule.id.startsWith('OBL-EU-DORA-') || rule.id === 'OBL-SG-MAS-AI' || rule.id === 'OBL-UK-SYSC') {
    require(profile.regulated, 'Profile indicates a regulated financial institution.',
      'Profile indicates the institution is outside the regulated perimeter.',
      'Confirm the regulated-entity category and relevant permissions.');
  }
  if (rule.id === 'OBL-EU-MIFID-17') {
    require(profile.algo, 'Profile indicates potential algorithmic trading.',
      'Profile indicates no algorithmic trading.',
      'Determine whether the activity meets the algorithmic-trading definition.');
    require(profile.regulated, 'Profile indicates a regulated institution.',
      'Profile indicates the organisation is outside the regulated perimeter.',
      'Confirm the regulated-entity category.');
    if (profile.regulated === 'yes' && profile.role !== 'regulated-financial-entity') {
      checks.push('Confirm that the deploying entity is an investment firm in scope.');
    }
  }
  if (rule.id === 'OBL-US-SEC-MA') {
    checks.push('Confirm that the deploying entity is a broker-dealer with or providing market access.');
  }
  if (rule.id === 'OBL-GDPR-22') {
    if (profile.personal === 'no') exclusions.push('Profile indicates no personal-data processing.');
    else positive.push('Profile indicates personal-data processing.');
    if (profile.eu === 'no') checks.push('Establish GDPR territorial scope.');
    if (profile.impact === 'significant') checks.push('Verify whether any decision with significant effects is based solely on automated processing for Article 22.');
  }

  const context = [];
  if (profile.authority === 'transact' || profile.autonomy === 'high') {
    context.push('Review execution controls and human intervention for the stated authority or autonomy.');
  }
  if (profile.thirdparty !== 'no' && rule.domains.includes('third-party-risk')) {
    context.push('Review contracts, concentration and exit controls for third-party dependencies.');
  }
  const status = exclusions.length ? 'reference' : checks.length ? 'conditional' : 'applicable';
  return {status, reasons: [...exclusions, ...checks, ...positive, ...context]};
}
function run(){const profile=readProfile();const mapped=rules.map(rule=>({rule,...evaluate(rule,profile)}));assessment={generatedAt:new Date().toISOString(),engineVersion:'2.0.1-preview',profile,methodology:'Rule-based research triage; no legal conclusion. Legal force and applicability conditions remain distinct.',results:mapped,questions:questions(profile)};$('#results').classList.remove('hidden');render();$('#results').scrollIntoView({behavior:'smooth'});}
function questions(p){let q=[];if(p.highrisk==='unknown'&&p.jurisdiction==='European Union')q.push('Has the AI Act classification been documented against the current consolidated Act, intended purpose, Annex III and any relevant product legislation?');if(p.algo==='unknown'&&p.activity==='trading')q.push('Does the agent determine order parameters or initiate orders automatically, and does that meet the MiFID II algorithmic-trading definition?');if(p.regulated==='unknown')q.push('What regulated-entity category and permissions apply to the deploying institution?');if(p.personal!=='no'||p.eu!=='no')q.push('Do prompts, memory, retrieved documents, tool calls, logs or outputs contain personal data, and who determines purposes and means?');if(p.thirdparty!=='no')q.push('Which model, hosting, orchestration and data providers are material ICT dependencies, and what contractual / exit / concentration controls exist?');if(p.authority==='transact'||p.autonomy==='high')q.push('What transaction limits, dual controls, approval gates, identity boundaries, circuit breakers and tested emergency-stop mechanisms constrain the agent?');q.push('Which legal entity owns the deployment, and where are users, customers, systems, data and regulated activities located?');q.push('Have the current consolidated legal texts, national transposition, effective dates, exemptions and regulator interpretations been checked by counsel?');return [...new Set(q)]}
function render(){const counts={applicable:assessment.results.filter(x=>x.status==='applicable').length,conditional:assessment.results.filter(x=>x.status==='conditional').length,reference:assessment.results.filter(x=>x.status==='reference').length};$('#stats').innerHTML=[['Potentially applicable',counts.applicable],['Conditional / verify',counts.conditional],['Contextual references',counts.reference],['Source records',records.length]].map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join('');document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));const list=assessment.results.filter(x=>x.status===activeTab);$('#obligation-list').innerHTML=list.length?list.map(x=>card(x)).join(''):'<p>No items in this category for the selected profile. This is not proof that no other law applies.</p>';$('#questions').innerHTML=assessment.questions.map(q=>`<li>${esc(q)}</li>`).join('')}
function card(x){let r=x.rule;return `<article class="ob-card"><div class="ob-top"><div><div class="tag">${esc(r.id)} · ${esc(r.basis)}</div><h3>${esc(r.title)}</h3></div><span class="force">${esc(r.force)}</span></div><p>${esc(r.requirement)}</p><p><b>Why surfaced:</b> ${x.reasons.map(esc).join(' ')}</p><p><b>Condition:</b> ${esc(r.condition)}</p><details><summary>Evidence, controls & source</summary><p><b>Evidence to collect</b></p><ul>${r.evidence.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><p><b>Control domains:</b> ${r.controls.map(esc).join(' · ')}</p><a href="${r.source}" target="_blank" rel="noopener">Open primary / official source ↗</a></details></article>`}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
$('#run').addEventListener('click',run);$('#reset').addEventListener('click',()=>{document.querySelectorAll('select').forEach(s=>s.selectedIndex=0);$('#results').classList.add('hidden');assessment=null;activeTab='applicable'});document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tab;render()}));$('#export').addEventListener('click',()=>assessment&&download('monaisec-assessment-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(assessment,null,2),'application/json'));$('#csv').addEventListener('click',()=>{if(!assessment)return;const rows=[['ID','Basis','Title','Status','Force','Condition','Requirement','Source'],...assessment.results.map(x=>[x.rule.id,x.rule.basis,x.rule.title,x.status,x.rule.force,x.rule.condition,x.rule.requirement,x.rule.source])];download('monaisec-obligations.csv',rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv')});load().then(() => {
  $('#data-status').hidden = true;
  $('#run').disabled = false;
}).catch(error => {
  console.error(error);
  $('#data-status').textContent = 'Regulatory data could not be loaded. Reload the page to try again.';
});
