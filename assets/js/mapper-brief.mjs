import {suggestProfile} from './brief-profile.mjs';

const byId = id => document.getElementById(id);
const input = byId('brief-file');
const drop = byId('brief-drop');
const paste = byId('brief-text');
const status = byId('brief-status');
const review = byId('brief-review');
const list = byId('brief-suggestions');
const apply = byId('brief-apply');
const checked = byId('brief-confirm');
const confirmation = byId('brief-confirmation');
let importedFields = new Map();
let revision = 0;

function clearBrief({restore = true} = {}) {
  revision++;
  if (restore && importedFields.size) {
    byId('results').classList.add('hidden');
    for (const [field, {previous, applied}] of importedFields) {
      const select = byId(field);
      if (select.value === applied) select.value = previous;
    }
  }
  importedFields = new Map();
  input.value = '';
  paste.value = '';
  status.textContent = '';
  list.replaceChildren();
  review.hidden = true;
  confirmation.hidden = true;
  checked.checked = false;
}

function showSuggestions(pages) {
  list.replaceChildren();
  for (const {field, matches} of suggestProfile(pages)) {
    const select = byId(field);
    const row = document.createElement('li');
    const title = select.parentElement.firstChild.textContent.trim();
    const label = document.createElement('label');
    if (matches.length === 1) {
      const [{value}] = matches;
      const choice = document.createElement('input');
      choice.type = 'checkbox';
      choice.dataset.field = field;
      choice.value = value;
      choice.checked = true;
      label.append(choice, `${title} · ${[...select.options].find(option => option.value === value).text}`);
    } else {
      label.textContent = `${title} · conflicting statements, choose manually`;
    }
    row.append(label);
    for (const {page, excerpt} of matches) {
      const evidence = document.createElement('small');
      evidence.textContent = `${page ? `Page ${page}` : 'Pasted text'} · “${excerpt}”`;
      row.append(evidence);
    }
    list.append(row);
  }
  review.hidden = false;
  confirmation.hidden = false;
  checked.checked = false;
  apply.disabled = !list.querySelector('input');
  status.textContent = list.childElementCount
    ? 'Review these suggestions, then check every field in the profile.'
    : 'No clear settings found. Complete the profile manually or try a more explicit description.';
  byId('brief-review-title').focus();
}

async function readPdf(file) {
  clearBrief();
  const current = revision;
  list.replaceChildren();
  review.hidden = false;
  apply.disabled = true;
  confirmation.hidden = false;
  checked.checked = false;
  status.textContent = 'Reading PDF in this browser…';
  let task;
  try {
    if (!/\.pdf$/i.test(file.name) || file.size > 10_000_000) {
      throw new Error('Choose a PDF up to 10 MB.');
    }
    const data = new Uint8Array(await file.arrayBuffer());
    if (!new TextDecoder().decode(data.subarray(0, 1024)).includes('%PDF-')) {
      throw new Error('This file does not appear to be a PDF.');
    }
    const pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
    if (current !== revision) return;
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
    task = pdfjs.getDocument({data, isEvalSupported: false, useWasm: false});
    const pdf = await task.promise;
    if (pdf.numPages > 30) throw new Error('Choose a PDF with no more than 30 pages.');
    const pages = [];
    let characters = 0;
    for (let i = 1; i <= pdf.numPages && current === revision; i++) {
      const {items} = await (await pdf.getPage(i)).getTextContent();
      const text = items.filter(item => 'str' in item).map(item => item.str + (item.hasEOL ? '\n' : '')).join('');
      characters += text.length;
      if (characters > 150_000) throw new Error('This PDF has too much text. Try a shorter brief.');
      pages.push({text, page: i});
    }
    if (current !== revision) return;
    if (!pages.some(page => /[\p{L}\p{N}]/u.test(page.text))) {
      status.textContent = 'No selectable text found. Paste a description or complete the form manually.';
      return;
    }
    showSuggestions(pages);
  } catch (error) {
    if (current !== revision) return;
    const message = error.name === 'PasswordException'
      ? 'This PDF is password-protected. Use an unlocked copy or paste a description.'
      : error.message;
    status.textContent = `${message || 'Could not read this PDF.'} You can complete the form manually.`;
  } finally {
    if (task) await task.destroy().catch(() => {});
  }
}

input.addEventListener('change', () => { if (input.files[0]) readPdf(input.files[0]); });
for (const event of ['dragenter', 'dragover']) {
  drop.addEventListener(event, e => { e.preventDefault(); drop.classList.add('is-dragging'); });
}
drop.addEventListener('dragleave', e => {
  if (!drop.contains(e.relatedTarget)) drop.classList.remove('is-dragging');
});
drop.addEventListener('drop', e => {
  e.preventDefault();
  drop.classList.remove('is-dragging');
  const files = e.dataTransfer.files;
  if (files.length === 1) readPdf(files[0]);
  else status.textContent = 'Drop one PDF at a time.';
});
byId('brief-analyse').addEventListener('click', () => {
  if (!paste.value.trim()) {
    status.textContent = 'Paste a description before looking for suggested settings.';
    return;
  }
  const text = paste.value;
  clearBrief();
  paste.value = text;
  showSuggestions([{text}]);
});
apply.addEventListener('click', () => {
  for (const choice of list.querySelectorAll('input:checked')) {
    const field = choice.dataset.field;
    const select = byId(field);
    const prior = importedFields.get(field);
    const previous = prior?.applied === select.value ? prior.previous : select.value;
    importedFields.set(field, {previous, applied: choice.value});
    select.value = choice.value;
  }
  checked.checked = false;
  byId('results').classList.add('hidden');
  status.textContent = 'Selected settings applied. Review the full profile below.';
  byId('jurisdiction').focus();
});
byId('brief-clear').addEventListener('click', () => { clearBrief(); input.focus(); });
byId('profile-fields').addEventListener('change', () => { checked.checked = false; });
byId('run').addEventListener('click', e => {
  if (confirmation.hidden || checked.checked) return;
  e.stopImmediatePropagation();
  status.textContent = 'Confirm that you reviewed the full profile before running the assessment.';
  checked.focus();
}, {capture: true});
byId('reset').addEventListener('click', () => clearBrief({restore: false}));

const emailButton = byId('report-email-open');
const emailSlot = byId('report-email-slot');
const emailStatus = byId('report-email-status');
const mailOrigin = 'https://api.monaisec.com';
emailButton.addEventListener('click', async () => {
  if (!emailSlot.hidden) {
    emailSlot.hidden = true;
    emailButton.setAttribute('aria-expanded', 'false');
    return;
  }
  emailButton.disabled = true;
  emailStatus.textContent = 'Checking email availability…';
  try {
    if (!emailSlot.firstChild) {
      const response = await fetch(`${mailOrigin}/mapper-report/status`, {signal: AbortSignal.timeout(5000)});
      if (!response.ok || !(await response.json()).available) throw new Error('Email is unavailable');
      const frame = document.createElement('iframe');
      frame.title = 'Email the MONAISEC PDF';
      frame.src = `${mailOrigin}/mapper-report`;
      frame.referrerPolicy = 'no-referrer';
      emailSlot.append(frame);
    }
    emailSlot.hidden = false;
    emailButton.setAttribute('aria-expanded', 'true');
    emailStatus.textContent = '';
  } catch {
    emailStatus.textContent = 'Email delivery is currently unavailable. You can download the PDF above.';
  } finally {
    emailButton.disabled = false;
  }
});
