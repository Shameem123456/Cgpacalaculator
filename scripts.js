// ---------- State ----------
let subjectCount = 0;

// Default grade cutoffs (10 -> 1) as requested (95,85,75,65,55,45,35,25,15,5)
let customGrades = {
  g10:95,g9:85,g8:75,g7:65,g6:55,g5:45,g4:35,g3:25,g2:15,g1:5
};
let customEnabled = true;
let minInternalPercent = 30;
let minExternalPercent = 30;
let globalFailPercent = 35; // global fail mark (combined %)
let failCondsEnabled = true;

// ---------- Helpers ----------
const $ = id => document.getElementById(id);

// Toggle theme (dark is default)
function toggleDarkMode(){
  document.body.classList.toggle("dark");
}

// ---------- Subjects UI ----------
function addSubject(){
  subjectCount++;
  const cont = $('subjects-container');

  const div = document.createElement('div');
  div.className = 'subject';
  div.id = `subject-${subjectCount}`;

  // Added subject name and internal/external totals (and kept original structure)
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h4 style="margin:0">Subject ${subjectCount}</h4>
      <div class="muted small">#${subjectCount}</div>
    </div>

    <div class="row">
      <div class="col">
        <label>Subject Name</label>
        <input type="text" id="name-${subjectCount}" placeholder="Subject ${subjectCount}">
      </div>

      <div class="col">
        <label>Credit (≥1)</label>
        <input type="number" id="credit-${subjectCount}" value="3" min="1">
      </div>

      <div class="col">
        <label><input type="checkbox" id="use-components-${subjectCount}" onchange="toggleSubjectMode(${subjectCount})"> Use External + Internal</label>
        <div class="muted small">Enable to input external & internal marks separately</div>
      </div>
    </div>

    <div id="simple-${subjectCount}">
      <label>Total Marks (max)</label>
      <input type="number" id="total-${subjectCount}" min="1" placeholder="e.g., 100">
      <label>Marks Scored (total)</label>
      <input type="number" id="scored-${subjectCount}" min="0" placeholder="e.g., 78">
    </div>

    <div id="components-${subjectCount}" style="display:none">
      <label>External - Total</label><input type="number" id="ext-total-${subjectCount}" min="0" placeholder="e.g., 70">
      <label>External - Scored</label><input type="number" id="ext-scored-${subjectCount}" min="0" placeholder="e.g., 50">
      <label>Internal - Total</label><input type="number" id="int-total-${subjectCount}" min="0" placeholder="e.g., 30">
      <label>Internal - Scored</label><input type="number" id="int-scored-${subjectCount}" min="0" placeholder="e.g., 28">
    </div>

    <div class="muted small">Note: Check the failing mark in the setting.if it is less than the mark required,then the grade is point zero for the given subject.</div>
  `;

  cont.appendChild(div);

  attachValidationHandlers(subjectCount);
  validateAllSubjects();
}

function removeSubject(){
  if(subjectCount === 0) return;
  const el = $(`subject-${subjectCount}`);
  if(el) el.remove();
  subjectCount--;
  validateAllSubjects();
}

function toggleSubjectMode(i){
  const use = $(`use-components-${i}`).checked;
  $(`simple-${i}`).style.display = use ? 'none' : 'block';
  $(`components-${i}`).style.display = use ? 'block' : 'none';
  validateSubject(i);
  validateAllSubjects();
}

// ---------- Validation ----------
function markInvalid(el, msg){
  if(!el) return;
  el.classList.add('invalid');
  el.title = msg || '';
}
function clearInvalid(el){
  if(!el) return;
  el.classList.remove('invalid');
  el.title = '';
}

function validateSubject(i){
  const errors = [];
  const subj = $(`subject-${i}`);
  if(!subj) return errors;

  // clear previously flagged inputs
  subj.querySelectorAll('input').forEach(inp => clearInvalid(inp));

  const nameEl = $(`name-${i}`);
  const creditEl = $(`credit-${i}`);
  const credit = creditEl ? parseFloat(creditEl.value) : NaN;
  if(!creditEl || isNaN(credit) || credit < 1){
    errors.push('Credit must be a number ≥ 1');
    markInvalid(creditEl, 'Credit must be ≥ 1');
  }

  const useComp = $(`use-components-${i}`) ? $(`use-components-${i}`).checked : false;
  if(useComp){
    const eT = parseFloat($(`ext-total-${i}`)?.value);
    const eS = parseFloat($(`ext-scored-${i}`)?.value);
    const iT = parseFloat($(`int-total-${i}`)?.value);
    const iS = parseFloat($(`int-scored-${i}`)?.value);

    // totals present and >0
    if(isNaN(eT) || eT <= 0){
      markInvalid($(`ext-total-${i}`), 'External total must be > 0');
      errors.push('External total must be > 0');
    }
    if(isNaN(iT) || iT <= 0){
      markInvalid($(`int-total-${i}`), 'Internal total must be > 0');
      errors.push('Internal total must be > 0');
    }

    // obtained present
    if(isNaN(eS)){
      markInvalid($(`ext-scored-${i}`), 'Enter external scored');
      errors.push('External scored required');
    }
    if(isNaN(iS)){
      markInvalid($(`int-scored-${i}`), 'Enter internal scored');
      errors.push('Internal scored required');
    }

    // obtained <= totals
    if(!isNaN(eT) && !isNaN(eS) && eS > eT){
      errors.push('External scored cannot exceed external total');
      markInvalid($(`ext-scored-${i}`), 'External scored cannot exceed external total');
    }
    if(!isNaN(iT) && !isNaN(iS) && iS > iT){
      errors.push('Internal scored cannot exceed internal total');
      markInvalid($(`int-scored-${i}`), 'Internal scored cannot exceed internal total');
    }

  } else {
    const t = parseFloat($(`total-${i}`)?.value);
    const s = parseFloat($(`scored-${i}`)?.value);
    if(isNaN(t) || t <= 0){
      errors.push('Total marks must be provided and > 0');
      markInvalid($(`total-${i}`), 'Total marks required and > 0');
    }
    if(isNaN(s)){
      errors.push('Scored marks must be provided');
      markInvalid($(`scored-${i}`), 'Enter scored marks');
    }
    if(!isNaN(t) && !isNaN(s) && s > t){
      errors.push('Scored marks cannot exceed total marks');
      markInvalid($(`scored-${i}`), 'Scored cannot exceed total');
    }
  }

  return errors;
}

function validateAllSubjects(){
  const messages = [];
  for(let i=1;i<=subjectCount;i++){
    const msgs = validateSubject(i);
    if(msgs.length) messages.push(`Subject ${i}: ${msgs.join('; ')}`);
  }

  const summary = $('validation-summary');
  const calcBtn = $('calculate-sgpa');
  if(messages.length){
    summary.style.display = 'block';
    summary.textContent = messages.join('\n');
    if(calcBtn) calcBtn.disabled = true;
    return false;
  } else {
    summary.style.display = 'none';
    summary.textContent = '';
    if(calcBtn) calcBtn.disabled = false;
    return true;
  }
}

function attachValidationHandlers(i){
  const subj = $(`subject-${i}`);
  if(!subj) return;
  subj.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      clearInvalid(inp);
      validateSubject(i);
      validateAllSubjects();
    });
  });
  const cb = $(`use-components-${i}`);
  if(cb) cb.addEventListener('change', ()=>{ validateSubject(i); validateAllSubjects(); });
}

// ---------- Gradepoint calculation ----------
function gradePointFromPercent(p){
  if(!customEnabled){
    // fallback fixed mapping
    return p>=95?10: p>=85?9: p>=75?8: p>=65?7: p>=55?6: p>=45?5: p>=35?4: p>=25?3: p>=15?2: p>=5?1:0;
  }
  if(p >= customGrades.g10) return 10;
  if(p >= customGrades.g9) return 9;
  if(p >= customGrades.g8) return 8;
  if(p >= customGrades.g7) return 7;
  if(p >= customGrades.g6) return 6;
  if(p >= customGrades.g5) return 5;
  if(p >= customGrades.g4) return 4;
  if(p >= customGrades.g3) return 3;
  if(p >= customGrades.g2) return 2;
  if(p >= customGrades.g1) return 1;
  return 0;
}

// ---------- SGPA Calculation & Dashboard ----------
let lastSGPAResult = null; // keep data to allow editing

function handleCalculateSGPA(){
  if(!validateAllSubjects()){
    alert('Please fix validation errors before calculating.');
    return;
  }
  // compute per-subject and aggregated SGPA
  let totalCredits = 0;
  let weightedSum = 0;
  let highest = -1, lowest = 101, pass=0, fail=0;
  const rows = [];

  for(let i=1;i<=subjectCount;i++){
    const name = ($(`name-${i}`)?.value || '').trim() || `Subject ${i}`;
    const credit = parseFloat($(`credit-${i}`).value) || 0;
    const useComp = $(`use-components-${i}`).checked;

    let extT = parseFloat($(`ext-total-${i}`)?.value);
    let extS = parseFloat($(`ext-scored-${i}`)?.value);
    let intT = parseFloat($(`int-total-${i}`)?.value);
    let intS = parseFloat($(`int-scored-${i}`)?.value);
    let totT = parseFloat($(`total-${i}`)?.value);
    let totS = parseFloat($(`scored-${i}`)?.value);

    extT = isNaN(extT)?0:extT; extS = isNaN(extS)?0:extS;
    intT = isNaN(intT)?0:intT; intS = isNaN(intS)?0:intS;
    totT = isNaN(totT)?0:totT; totS = isNaN(totS)?0:totS;

    let maxTotal=0, scored=0;
    if(useComp){
      maxTotal = extT + intT;
      scored = extS + intS;
    } else {
      maxTotal = totT;
      scored = totS;
    }

    const percent = maxTotal>0 ? (scored / maxTotal) * 100 : 0;

    // failing by component if enabled
    let failedByComponent = false;
    if(failCondsEnabled && useComp){
      if(extT>0){
        const ep = (extS / extT) * 100;
        if(ep < minExternalPercent) failedByComponent = true;
      }
      if(intT>0){
        const ip = (intS / intT) * 100;
        if(ip < minInternalPercent) failedByComponent = true;
      }
    }

    // global fail by combined percentage
    if(percent < globalFailPercent) failedByComponent = true;

    const gp = failedByComponent ? 0 : gradePointFromPercent(percent);

    if(credit>0){
      weightedSum += gp * credit;
      totalCredits += credit;
    }

    if(maxTotal>0){
      if(percent > highest) highest = percent;
      if(percent < lowest) lowest = percent;
    }

    if(gp>0) pass++; else fail++;

    rows.push({
      idx:i, name, credit, maxTotal, scored,
      internal: useComp ? `${intS}/${intT}` : '-',
      external: useComp ? `${extS}/${extT}` : '-',
      percent, gp, gpTimes: gp*credit
    });
  }

  const sgpa = totalCredits>0 ? (weightedSum / totalCredits) : 0;

  // store last result for editing
  lastSGPAResult = { rows, sgpa, highest, lowest, pass, fail };

  // render dashboard table
  renderSGPADashboard();
}

function renderSGPADashboard(){
  if(!lastSGPAResult) return;
  const rows = lastSGPAResult.rows;
  const tbody = $('sgpa-table').querySelector('tbody');
  tbody.innerHTML = '';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.credit}</td>
      <td>${r.maxTotal}</td>
      <td>${r.scored}</td>
      <td>${r.internal}</td>
      <td>${r.external}</td>
      <td>${r.percent.toFixed(2)}%</td>
      <td>${r.gp}</td>
      <td>${r.gpTimes}</td>
    `;
    tbody.appendChild(tr);
  });

  $('dashboard-sgpa-val').innerText = lastSGPAResult.sgpa.toFixed(2);
  $('dash-highest').innerText = lastSGPAResult.highest>=0 ? lastSGPAResult.highest.toFixed(2)+'%' : '-';
  $('dash-lowest').innerText = lastSGPAResult.lowest<=100 ? lastSGPAResult.lowest.toFixed(2)+'%' : '-';
  $('dash-pass').innerText = lastSGPAResult.pass;
  $('dash-fail').innerText = lastSGPAResult.fail;

  // hide main area, show sgpa dashboard
  $('main-area').style.display = 'none';
  $('sgpa-dashboard').style.display = 'block';
  window.scrollTo({top:0,behavior:'smooth'});
}

function closeSGPADashboard(){
  $('sgpa-dashboard').style.display = 'none';
  $('main-area').style.display = 'block';
  window.scrollTo({top:0,behavior:'smooth'});
}

function editSGPA(){
  // returns to the form for editing; inputs are preserved, so just show the main form
  $('sgpa-dashboard').style.display = 'none';
  $('main-area').style.display = 'block';
  window.scrollTo({top:0,behavior:'smooth'});
}

// ---------- CGPA calculation & Dashboard ----------
let lastCGPAResult = null;

function generateCGPAInputs(){
  const cnt = parseInt($('num-semesters').value) || 0;
  const wrap = $('cgpa-inputs');
  wrap.innerHTML = '';
  for(let i=1;i<=cnt;i++){
    const div = document.createElement('div');
    div.className = 'sem-row';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <label>Semester ${i} — SGPA</label>
      <input type="number" min="0" step="0.01" id="sem-sgpa-${i}" placeholder="e.g., 8.25">
      <label>Semester ${i} — Credits (≥1)</label>
      <input type="number" min="1" step="1" id="sem-credit-${i}" value="20">
    `;
    wrap.appendChild(div);
  }
}

function validateCGPAInputs(){
  const msgs = [];
  const cnt = parseInt($('num-semesters').value) || 0;
  if(cnt <= 0){ msgs.push('Enter number of semesters and create fields.'); }
  for(let i=1;i<=cnt;i++){
    const sg = parseFloat($(`sem-sgpa-${i}`)?.value);
    const cr = parseFloat($(`sem-credit-${i}`)?.value);
    if(isNaN(sg) || sg < 0){ msgs.push(`Semester ${i}: Enter valid SGPA (≥0)`); if($(`sem-sgpa-${i}`)) $(`sem-sgpa-${i}`).classList.add('invalid'); }
    if(isNaN(cr) || cr < 1){ msgs.push(`Semester ${i}: Credits must be ≥1`); if($(`sem-credit-${i}`)) $(`sem-credit-${i}`).classList.add('invalid'); }
  }
  return msgs;
}

function clearCGPAInvalids(){
  const cnt = parseInt($('num-semesters').value) || 0;
  for(let i=1;i<=cnt;i++){
    if($(`sem-sgpa-${i}`)) $(`sem-sgpa-${i}`).classList.remove('invalid');
    if($(`sem-credit-${i}`)) $(`sem-credit-${i}`).classList.remove('invalid');
  }
}

function handleCalculateCGPA(){
  clearCGPAInvalids();
  const errors = validateCGPAInputs();
  if(errors.length){
    alert('Fix errors:\n' + errors.join('\n'));
    return;
  }

  const cnt = parseInt($('num-semesters').value) || 0;
  let totalWeighted = 0, totalCredits = 0;
  const rows = [];
  for(let i=1;i<=cnt;i++){
    const sg = parseFloat($(`sem-sgpa-${i}`).value) || 0;
    const cr = parseFloat($(`sem-credit-${i}`).value) || 0;
    totalWeighted += sg * cr;
    totalCredits += cr;
    rows.push({ idx:i, sg, cr, product: (sg*cr) });
  }
  const cgpa = totalCredits > 0 ? (totalWeighted / totalCredits) : 0;
  lastCGPAResult = { rows, cgpa, totalCredits };

  renderCGPADashboard();
}

function renderCGPADashboard(){
  if(!lastCGPAResult) return;
  const tbody = $('cgpa-table').querySelector('tbody');
  tbody.innerHTML = '';
  lastCGPAResult.rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>Sem ${r.idx}</td><td>${r.sg.toFixed(2)}</td><td>${r.cr}</td><td>${r.product.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });

  $('dashboard-cgpa-val').innerText = lastCGPAResult.cgpa.toFixed(2);
  $('dash-sems').innerText = lastCGPAResult.rows.length;
  $('cgpa-credits').innerText = lastCGPAResult.totalCredits;

  $('main-area').style.display = 'none';
  $('cgpa-dashboard').style.display = 'block';
  window.scrollTo({top:0,behavior:'smooth'});
}

function closeCGPADashboard(){
  $('cgpa-dashboard').style.display = 'none';
  $('main-area').style.display = 'block';
  window.scrollTo({top:0,behavior:'smooth'});
}

function editCGPA(){
  $('cgpa-dashboard').style.display = 'none';
  $('main-area').style.display = 'block';
  window.scrollTo({top:0,behavior:'smooth'});
}

// ---------- Print Dashboard ----------
function printDashboard(type){
  // hide other dashboards so print CSS picks correct one; print CSS will show only dashboards
  if(type === 'sgpa'){
    $('cgpa-dashboard').style.display = 'none';
    $('sgpa-dashboard').style.display = 'block';
  } else if(type === 'cgpa'){
    $('sgpa-dashboard').style.display = 'none';
    $('cgpa-dashboard').style.display = 'block';
  }
  window.print();
}

// ---------- Settings (modal) ----------
function openSettingsModal(){
  $('settings-modal').style.display = 'flex';
}
function closeSettingsModal(){
  $('settings-modal').style.display = 'none';
}
function toggleSettings() {
  const panel = document.getElementById("settings-panel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}
function saveSettings(){
  // read inputs
  const newGrades = {
    g10: parseFloat($('g10').value),
    g9: parseFloat($('g9').value),
    g8: parseFloat($('g8').value),
    g7: parseFloat($('g7').value),
    g6: parseFloat($('g6').value),
    g5: parseFloat($('g5').value),
    g4: parseFloat($('g4').value),
    g3: parseFloat($('g3').value),
    g2: parseFloat($('g2').value),
    g1: parseFloat($('g1').value)
  };

  const errBox = $('settings-error');
  errBox.style.display = 'none';
  errBox.textContent = '';

  // Validate numbers and order (descending)
  const vals = [newGrades.g10,newGrades.g9,newGrades.g8,newGrades.g7,newGrades.g6,newGrades.g5,newGrades.g4,newGrades.g3,newGrades.g2,newGrades.g1];
  for(let i=0;i<vals.length;i++){
    if(isNaN(vals[i]) || vals[i] < 0 || vals[i] > 100){
      errBox.style.display = 'block';
      errBox.textContent = 'All grade cutoffs must be numbers between 0 and 100.';
      return;
    }
    if(i>0 && vals[i] >= vals[i-1]){
      errBox.style.display = 'block';
      errBox.textContent = 'Cutoffs must be in strictly descending order (g10 > g9 > g8 ...).';
      return;
    }
  }

  // read component mins and fail mark
  const newMinInternal = parseFloat($('min-internal').value);
  const newMinExternal = parseFloat($('min-external').value);
  const newGlobalFail = parseFloat($('global-fail').value);

  if(isNaN(newMinInternal) || newMinInternal < 0 || newMinInternal > 100 ||
     isNaN(newMinExternal) || newMinExternal < 0 || newMinExternal > 100 ||
     isNaN(newGlobalFail) || newGlobalFail < 0 || newGlobalFail > 100){
    errBox.style.display = 'block';
    errBox.textContent = 'Min percentages and global fail must be valid (0–100).';
    return;
  }

  // everything OK — save
  customGrades = {...newGrades};
  minInternalPercent = newMinInternal;
  minExternalPercent = newMinExternal;
  globalFailPercent = newGlobalFail;
  failCondsEnabled = true;
  customEnabled = true;

  alert('Settings saved.');
  closeSettingsModal();
}

// ---------- Download entries ----------
function downloadAllEntries(){
  let txt = 'SGPA & CGPA Entries Export\n\n';
  for(let i=1;i<=subjectCount;i++){
    const name = $(`name-${i}`)?.value || `Subject ${i}`;
    const credit = $(`credit-${i}`) ? $(`credit-${i}`).value : '';
    const use = $(`use-components-${i}`) ? $(`use-components-${i}`).checked : false;
    txt += `Subject ${i} — ${name} — Credit: ${credit} — Mode: ${use ? 'Components' : 'Total'}\n`;
    if(use){
      txt += `  External: ${$(`ext-scored-${i}`)?.value || 0}/${$(`ext-total-${i}`)?.value || 0}\n`;
      txt += `  Internal: ${$(`int-scored-${i}`)?.value || 0}/${$(`int-total-${i}`)?.value || 0}\n`;
    } else {
      txt += `  Total: ${$(`scored-${i}`)?.value || 0}/${$(`total-${i}`)?.value || 0}\n`;
    }
  }
  const cnt = parseInt($('num-semesters').value) || 0;
  if(cnt>0){
    txt += '\nCGPA Semesters:\n';
    for(let i=1;i<=cnt;i++){
      txt += `Sem ${i}: SGPA ${$(`sem-sgpa-${i}`)?.value || '-'}  Credits ${$(`sem-credit-${i}`)?.value || '-'}\n`;
    }
  }
  const blob = new Blob([txt], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'SGPA_CGPA_Entries.txt';
  a.click();
}

// ---------- Init ----------
(function init(){
  // add one subject by default
  addSubject();

  // hook fail conds display (keep compatibility with original settings checkbox if present)
  const enableFail = $('enable-fail-conds');
  if(enableFail){
    enableFail.addEventListener('change', e=>{
      $('fail-conds-panel').style.display = e.target.checked ? 'block' : 'none';
      failCondsEnabled = e.target.checked;
    });
  }

  // initial validation
  setTimeout(()=>validateAllSubjects(), 150);
})();
