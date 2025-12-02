// --- helpers ---
function clearArea(){ document.getElementById('gameArea').innerHTML=''; }
function loadMenu(){ clearArea(); const a=document.getElementById('gameArea'); a.innerHTML=`<h2>选择一个游戏</h2><p class='small'>在上方选择一个游戏。</p>`; }

function showGameOver(msg, score, retryToStart){
  const area=document.getElementById('gameArea');
  const existing = area.querySelector('.game-over-card'); if(existing) existing.remove();
  const card = document.createElement('div');
  card.className='game-over-card';
  card.innerHTML = `<div>${msg}</div><div style='margin-top:8px'>最终得分：${score}</div><div style='margin-top:12px'><button id='retryBtn'>重试</button><button id='menuBtn'>返回菜单</button></div>`;
  area.appendChild(card);
  const retryBtn = document.getElementById('retryBtn');
  const menuBtn = document.getElementById('menuBtn');
  if(retryBtn) retryBtn.addEventListener('click', ()=>{ card.remove(); if(typeof retryToStart === 'function') retryToStart(); });
  if(menuBtn) menuBtn.addEventListener('click', ()=>{ card.remove(); loadMenu(); });
}

function buildGrid(id, size, handler){ const container = document.getElementById(id); if(!container) return; container.className='grid'; container.style.gridTemplateColumns = `repeat(${size},1fr)`; container.innerHTML=''; for(let i=0;i<size*size;i++){ const cell=document.createElement('div'); cell.className='cell'; cell.dataset.index=i; cell.addEventListener('click', ()=> handler(i, cell)); container.appendChild(cell);} }
function resetGridColors(id){ const cells=document.querySelectorAll('#'+id+' .cell'); cells.forEach(c=>{ c.style.background=''; c.classList.remove('flash','active'); }); }

// ------------------ SIMON SAYS ------------------
let simonSeq = [], simonPlay = [], simonGridSize = 3, simonScore = 0, simonHigh = parseInt(localStorage.getItem('simonHigh')||'0'), simonLives = 3, simonAccept = false;

function loadSimon(){
  clearArea();
  const area = document.getElementById('gameArea');
  area.innerHTML = `
    <h2>西蒙说</h2>
    <div class='grid-wrapper' id='simonWrapper'>
      <div id='simonStart' class='start-overlay'>开始</div>
      <div id='simonGrid' class='hidden'></div>
    </div>
    <p id='simonStats' class='hidden'>生命：<span id='simonLives'></span> | 得分：<span id='simonScore'></span> | 最佳：<span id='simonHigh'>${simonHigh}</span></p>
    <p id='simonInstructions' class='instructions'>观察闪烁的单元格序列，然后按相同顺序重复。</p>
  `;
  const start = document.getElementById('simonStart'); if(start) start.addEventListener('click', startSimon);
}

function startSimon(){
  simonLives = 3; simonSeq = []; simonScore = 0; simonPlay = [];
  const stats = document.getElementById('simonStats'); if(stats) stats.classList.remove('hidden');
  const livesEl = document.getElementById('simonLives'); if(livesEl) livesEl.textContent = '❤'.repeat(simonLives);
  const scoreEl = document.getElementById('simonScore'); if(scoreEl) scoreEl.textContent = simonScore;
  const startEl = document.getElementById('simonStart'); if(startEl) startEl.remove();
  const gridEl = document.getElementById('simonGrid'); if(gridEl) gridEl.classList.remove('hidden');
  buildGrid('simonGrid', simonGridSize, onSimonClick);
  nextSimon();
}

function nextSimon(){ simonPlay = []; const max = simonGridSize * simonGridSize; simonSeq.push(Math.floor(Math.random() * max)); playSimon(); }

function playSimon(){ simonAccept = false; const cells = document.querySelectorAll('#simonGrid .cell'); if(!cells || cells.length===0) { simonAccept = true; return; } let i = 0; function flash(){ if(i >= simonSeq.length){ setTimeout(()=>{ simonAccept = true; }, 300); return; } const idx = simonSeq[i]; const c = cells[idx]; if(!c){ i++; setTimeout(flash, 150); return; } c.classList.add('flash'); setTimeout(()=>{ c.classList.remove('flash'); i++; setTimeout(flash, 150); }, 420); } flash(); }

function onSimonClick(i, cell){ if(!simonAccept) return; simonPlay.push(i); const pos = simonPlay.length - 1; if(i !== simonSeq[pos]){
    // wrong
    cell.style.background = 'red'; simonLives--; const livesEl = document.getElementById('simonLives'); if(livesEl) livesEl.textContent = '❤'.repeat(simonLives);
    simonAccept = false;
    if(simonLives <= 0){ if(simonScore > simonHigh) localStorage.setItem('simonHigh', simonScore); showGameOver('游戏结束 — 西蒙说', simonScore, loadSimon); return; }
    // replay same pattern for retry
    setTimeout(()=>{ resetGridColors('simonGrid'); simonPlay = []; playSimon(); }, 700);
    return;
  }
  // correct step
  cell.classList.add('active'); setTimeout(()=>cell.classList.remove('active'), 120);
  if(simonPlay.length === simonSeq.length){ simonScore++; const scoreEl = document.getElementById('simonScore'); if(scoreEl) scoreEl.textContent = simonScore; simonAccept = false; setTimeout(nextSimon, 400); }
}

// ------------------ VISUAL MEMORY ------------------
let vLevel = 1, vBest = parseInt(localStorage.getItem('visualHigh')||'0'), vSize = 3, vPattern = [], vInput = [], vLives = 3, vAccept = false;

function loadVisual(){
  clearArea();
  const area = document.getElementById('gameArea');
  area.innerHTML = `
    <h2>视觉记忆</h2>
    <div class='grid-wrapper' id='vWrapper'>
      <div id='vStart' class='start-overlay'>开始</div>
      <div id='visualGrid' class='hidden'></div>
    </div>
    <p id='vStats' class='hidden'>生命：<span id='vlives'></span> | 关卡：<span id='vlevel'></span> | 最佳：<span id='vbest'>${vBest}</span></p>
    <p id='vInstructions' class='instructions'>记住哪些单元格被高亮显示，然后点击所有它们。每2关网格会变大。</p>
  `;
  const start = document.getElementById('vStart'); if(start) start.addEventListener('click', startVisual);
}

function startVisual(){
  vLevel = 1; vSize = 3; vLives = 3; vPattern = []; vInput = [];
  const stats = document.getElementById('vStats'); if(stats) stats.classList.remove('hidden');
  const livesEl = document.getElementById('vlives'); if(livesEl) livesEl.textContent = '❤'.repeat(vLives);
  const levelEl = document.getElementById('vlevel'); if(levelEl) levelEl.textContent = vLevel;
  const startEl = document.getElementById('vStart'); if(startEl) startEl.remove();
  const gridEl = document.getElementById('visualGrid'); if(gridEl) gridEl.classList.remove('hidden');
  showVisualLevelScreen();
}

function showVisualLevelScreen(){
  const wrapper = document.getElementById('vWrapper'); if(!wrapper) return;
  const card = document.createElement('div'); card.className = 'level-overlay'; card.textContent = '第 ' + vLevel + ' 关';
  wrapper.appendChild(card);
  setTimeout(()=>{ card.remove(); startVisualLevel(); }, 900);
}

function startVisualLevel(){
  vInput = []; vAccept = false;
  buildGrid('visualGrid', vSize, onVisualClick);
  // choose pattern
  const total = vSize * vSize; const count = Math.max(1, Math.floor(total / 3)); const used = new Set();
  while(used.size < count) used.add(Math.floor(Math.random() * total));
  vPattern = [...used];
  showVPattern();
}

function showVPattern(){ const cells = document.querySelectorAll('#visualGrid .cell'); vPattern.forEach(i=>{ if(cells[i]) cells[i].classList.add('flash'); }); setTimeout(()=>{ vPattern.forEach(i=>{ if(cells[i]) cells[i].classList.remove('flash'); }); vAccept = true; }, 900); }

function endVisual(){ if(vLevel - 1 > vBest){ vBest = vLevel - 1; localStorage.setItem('visualHigh', vBest); } showGameOver('游戏结束 — 视觉记忆', vLevel - 1, loadVisual); }

function onVisualClick(i, cell){
  if(!vAccept) return;
  if(!vPattern.includes(i)){
    cell.style.background = 'red';
    vLives--;
    const livesEl = document.getElementById('vlives'); if(livesEl) livesEl.textContent = '❤'.repeat(vLives);
    vAccept = false;
    if(vLives <= 0){ setTimeout(endVisual, 500); return; }
    // retry same level with new pattern
    setTimeout(()=>{ resetGridColors('visualGrid'); vInput = []; startVisualLevel(); }, 700);
    return;
  }

  if(!cell.classList.contains('active')) cell.classList.add('active');
  vInput.push(i);
  const uniq = Array.from(new Set(vInput));

  if(uniq.length === vPattern.length){
    // completed one pattern successfully
    vLevel++;
    const levelEl = document.getElementById('vlevel'); if(levelEl) levelEl.textContent = vLevel;
    // increase grid size every 2 patterns (after two successful patterns)
    // i.e. when vLevel becomes 3,5,7,... we increase size
    if(vLevel > 1 && ((vLevel - 1) % 2 === 0)){
      vSize++;
    }
    vAccept = false;
    setTimeout(()=>{ resetGridColors('visualGrid'); vInput = []; showVisualLevelScreen(); }, 700);
  }
}

// ------------------ NUMBER MEMORY ------------------
let nLevel = 1, nBest = parseInt(localStorage.getItem('numberHigh')||'0'), nLives = 3, nCurrent = '';

function loadNumber(){
  clearArea();
  const area = document.getElementById('gameArea');
  area.innerHTML = `
    <h2>数字记忆</h2>
    <div class='grid-wrapper' id='nWrapper'>
      <div id='nStart' class='start-overlay'>开始</div>
      <div id='nArea' class='grid'></div>
    </div>
    <p id='nStats' class='hidden'>生命：<span id='nlives'></span> | 关卡：<span id='nlevel'></span> | 最佳：<span id='nbest'>${nBest}</span></p>
    <p id='nInstructions' class='instructions'>记住显示的数字，然后在提示时输入。每关数字会变长。</p>
  `;
  const start = document.getElementById('nStart'); if(start) start.addEventListener('click', startNumber);
}

function startNumber(){
  nLevel = 1; nLives = 3;
  const stats = document.getElementById('nStats'); if(stats) stats.classList.remove('hidden');
  const livesEl = document.getElementById('nlives'); if(livesEl) livesEl.textContent = '❤'.repeat(nLives);
  const levelEl = document.getElementById('nlevel'); if(levelEl) levelEl.textContent = nLevel;
  const startEl = document.getElementById('nStart'); if(startEl) startEl.remove();
  showNumberLevelScreen();
}

function showNumberLevelScreen(){ const wrapper = document.getElementById('nWrapper'); if(!wrapper) return; const card = document.createElement('div'); card.className='level-overlay'; card.textContent = '第 ' + nLevel + ' 关'; wrapper.appendChild(card); setTimeout(()=>{ card.remove(); nextNumberRound(); }, 900); }

function nextNumberRound(){ const digits = Math.max(1, nLevel); const min = Math.pow(10, digits - 1); const max = Math.pow(10, digits) - 1; nCurrent = String(Math.floor(Math.random() * (max - min + 1) + min)); const area = document.getElementById('nArea'); if(!area) return; area.innerHTML = `<div style='font-size:36px;font-weight:700;margin:10px 0'>${nCurrent}</div>`; setTimeout(()=>{ area.innerHTML = `<input id='numInput' type='text' placeholder='输入数字' /><div style='margin-top:8px'><button id='submitNumBtn'>提交</button></div>`; const input = document.getElementById('numInput'); if(input) input.focus(); const btn = document.getElementById('submitNumBtn'); if(btn) btn.addEventListener('click', submitNumber); }, 2500); }

function submitNumber(){ const el = document.getElementById('numInput'); if(!el) return; const val = el.value.trim(); if(val === nCurrent){ nLevel++; const levelEl = document.getElementById('nlevel'); if(levelEl) levelEl.textContent = nLevel; setTimeout(showNumberLevelScreen, 300); return; } nLives--; const livesEl = document.getElementById('nlives'); if(livesEl) livesEl.textContent = '❤'.repeat(nLives); if(nLives <= 0){ if(nLevel - 1 > nBest){ nBest = nLevel - 1; localStorage.setItem('numberHigh', nBest); } showGameOver('游戏结束 — 数字记忆', nLevel - 1, loadNumber); return; } setTimeout(showNumberLevelScreen, 300); }

// ------------------ CHIMP TEST ------------------
let cLevel = 1, cBest = parseInt(localStorage.getItem('chimpHigh')||'0'), cSize = 4, cNumbers = [], cNextClick = 1, cLives = 3, cAccept = false;

function loadChimp(){
  clearArea();
  const area = document.getElementById('gameArea');
  area.innerHTML = `
    <h2>黑猩猩测试</h2>
    <div class='grid-wrapper' id='cWrapper'>
      <div id='cStart' class='start-overlay'>开始</div>
      <div id='chimpGrid' class='hidden'></div>
    </div>
    <p id='cStats' class='hidden'>生命：<span id='clives'></span> | 关卡：<span id='clevel'></span> | 最佳：<span id='cbest'>${cBest}</span></p>
    <p id='cInstructions' class='instructions'>记住数字的位置，然后按从1到最大数字的顺序点击它们。</p>
  `;
  const start = document.getElementById('cStart'); if(start) start.addEventListener('click', startChimp);
}

function startChimp(){
  cLevel = 1; cSize = 4; cLives = 3; cNextClick = 1;
  const stats = document.getElementById('cStats'); if(stats) stats.classList.remove('hidden');
  const livesEl = document.getElementById('clives'); if(livesEl) livesEl.textContent = '❤'.repeat(cLives);
  const levelEl = document.getElementById('clevel'); if(levelEl) levelEl.textContent = cLevel;
  const startEl = document.getElementById('cStart'); if(startEl) startEl.remove();
  const gridEl = document.getElementById('chimpGrid'); if(gridEl) gridEl.classList.remove('hidden');
  showChimpLevelScreen();
}

function showChimpLevelScreen(){
  const wrapper = document.getElementById('cWrapper'); if(!wrapper) return;
  const card = document.createElement('div'); card.className = 'level-overlay'; card.textContent = '第 ' + cLevel + ' 关';
  wrapper.appendChild(card);
  setTimeout(()=>{ card.remove(); startChimpLevel(); }, 900);
}

function startChimpLevel(){
  cNextClick = 1; cAccept = false;
  const count = cLevel + 3; // Start with 4 numbers, increase by 1 each level
  cNumbers = [];
  const positions = [];
  const total = cSize * cSize;
  
  // Generate random positions
  while(positions.length < count){
    const pos = Math.floor(Math.random() * total);
    if(!positions.includes(pos)) positions.push(pos);
  }
  
  // Assign numbers to positions
  for(let i = 0; i < count; i++){
    cNumbers[positions[i]] = i + 1;
  }
  
  buildChimpGrid();
  showChimpNumbers();
}

function buildChimpGrid(){
  const container = document.getElementById('chimpGrid');
  if(!container) return;
  container.className = 'grid';
  container.style.gridTemplateColumns = `repeat(${cSize},1fr)`;
  container.innerHTML = '';
  for(let i = 0; i < cSize * cSize; i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.dataset.number = cNumbers[i] || '';
    if(cNumbers[i]){
      cell.textContent = cNumbers[i];
      cell.style.fontSize = '24px';
      cell.style.fontWeight = '700';
    }
    cell.addEventListener('click', ()=> onChimpClick(i, cell));
    container.appendChild(cell);
  }
}

function showChimpNumbers(){
  const cells = document.querySelectorAll('#chimpGrid .cell');
  cells.forEach(cell => {
    if(cell.dataset.number){
      cell.style.background = '#4caf50';
      cell.style.color = 'white';
    }
  });
  
  // Allow clicking immediately, numbers stay visible until number 1 is clicked
  cAccept = true;
}

function hideChimpNumbers(){
  const cells = document.querySelectorAll('#chimpGrid .cell');
  cells.forEach(cell => {
    if(cell.dataset.number){
      cell.style.background = '';
      cell.style.color = '';
      cell.textContent = '';
    }
  });
}

function onChimpClick(i, cell){
  if(!cAccept) return;
  const expectedNum = cNumbers[i];
  
  if(!expectedNum || expectedNum !== cNextClick){
    // Wrong click
    cell.style.background = 'red';
    cLives--;
    const livesEl = document.getElementById('clives'); if(livesEl) livesEl.textContent = '❤'.repeat(cLives);
    cAccept = false;
    if(cLives <= 0){
      if(cLevel - 1 > cBest){
        cBest = cLevel - 1;
        localStorage.setItem('chimpHigh', cBest);
      }
      showGameOver('游戏结束 — 黑猩猩测试', cLevel - 1, loadChimp);
      return;
    }
    // Retry same level
    setTimeout(()=>{
      const cells = document.querySelectorAll('#chimpGrid .cell');
      cells.forEach(c => c.style.background = '');
      startChimpLevel();
    }, 700);
    return;
  }
  
  // Correct click - hide numbers when clicking number 1
  if(cNextClick === 1){
    hideChimpNumbers();
  }
  
  cell.style.background = '#4caf50';
  cell.style.color = 'white';
  cell.textContent = expectedNum;
  cNextClick++;
  
  // Check if level complete
  if(cNextClick > cLevel + 3){
    cLevel++;
    const levelEl = document.getElementById('clevel'); if(levelEl) levelEl.textContent = cLevel;
    // Increase grid size every 3 levels
    if(cLevel > 1 && (cLevel - 1) % 3 === 0){
      cSize++;
    }
    cAccept = false;
    setTimeout(()=>{
      const cells = document.querySelectorAll('#chimpGrid .cell');
      cells.forEach(c => {
        c.style.background = '';
        c.style.color = '';
        c.textContent = '';
      });
      showChimpLevelScreen();
    }, 700);
  }
}

// attach menu buttons
document.getElementById('btnSimon').addEventListener('click', loadSimon);
document.getElementById('btnVisual').addEventListener('click', loadVisual);
document.getElementById('btnNumber').addEventListener('click', loadNumber);
document.getElementById('btnChimp').addEventListener('click', loadChimp);

// initial menu
loadMenu();

