// --- helpers ---
function clearArea(){ document.getElementById('gameArea').innerHTML=''; }
function loadMenu(){ clearArea(); const a=document.getElementById('gameArea'); a.innerHTML=`<h2>Select a game</h2><p class='small'>Choose a game above.</p>`; }

function showGameOver(msg, score, retryToStart){
  const area=document.getElementById('gameArea');
  const existing = area.querySelector('.game-over-card'); if(existing) existing.remove();
  const card = document.createElement('div');
  card.className='game-over-card';
  card.innerHTML = `<div>${msg}</div><div style='margin-top:8px'>Final Score: ${score}</div><div style='margin-top:12px'><button id='retryBtn'>Retry</button><button id='menuBtn'>Return to Menu</button></div>`;
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
    <h2>Simon Says</h2>
    <div class='grid-wrapper' id='simonWrapper'>
      <div id='simonStart' class='start-overlay'>START</div>
      <div id='simonGrid' class='hidden'></div>
    </div>
    <p id='simonStats' class='hidden'>Lives: <span id='simonLives'></span> | Score: <span id='simonScore'></span> | Best: <span id='simonHigh'>${simonHigh}</span></p>
    <p id='simonInstructions' class='instructions'>Watch the sequence of flashing cells and repeat it in the same order.</p>
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
    if(simonLives <= 0){ if(simonScore > simonHigh) localStorage.setItem('simonHigh', simonScore); showGameOver('Game Over — Simon', simonScore, loadSimon); return; }
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
    <h2>Visual Memory</h2>
    <div class='grid-wrapper' id='vWrapper'>
      <div id='vStart' class='start-overlay'>START</div>
      <div id='visualGrid' class='hidden'></div>
    </div>
    <p id='vStats' class='hidden'>Lives: <span id='vlives'></span> | Level: <span id='vlevel'></span> | Best: <span id='vbest'>${vBest}</span></p>
    <p id='vInstructions' class='instructions'>Remember which cells were highlighted, then click all of them. The grid gets larger every 2 levels.</p>
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
  const card = document.createElement('div'); card.className = 'level-overlay'; card.textContent = 'Level ' + vLevel;
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

function endVisual(){ if(vLevel - 1 > vBest){ vBest = vLevel - 1; localStorage.setItem('visualHigh', vBest); } showGameOver('Game Over — Visual', vLevel - 1, loadVisual); }

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
    <h2>Number Memory</h2>
    <div class='grid-wrapper' id='nWrapper'>
      <div id='nStart' class='start-overlay'>START</div>
      <div id='nArea' class='grid'></div>
    </div>
    <p id='nStats' class='hidden'>Lives: <span id='nlives'></span> | Level: <span id='nlevel'></span> | Best: <span id='nbest'>${nBest}</span></p>
    <p id='nInstructions' class='instructions'>Remember the number shown, then enter it when prompted. The numbers get longer each level.</p>
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

function showNumberLevelScreen(){ const wrapper = document.getElementById('nWrapper'); if(!wrapper) return; const card = document.createElement('div'); card.className='level-overlay'; card.textContent = 'Level ' + nLevel; wrapper.appendChild(card); setTimeout(()=>{ card.remove(); nextNumberRound(); }, 900); }

function nextNumberRound(){ const digits = Math.max(1, nLevel); const min = Math.pow(10, digits - 1); const max = Math.pow(10, digits) - 1; nCurrent = String(Math.floor(Math.random() * (max - min + 1) + min)); const area = document.getElementById('nArea'); if(!area) return; area.innerHTML = `<div style='font-size:28px;font-weight:700;margin:10px 0'>${nCurrent}</div>`; setTimeout(()=>{ area.innerHTML = `<input id='numInput' type='text' placeholder='Enter number' /><div style='margin-top:8px'><button id='submitNumBtn'>Submit</button></div>`; const input = document.getElementById('numInput'); if(input) input.focus(); const btn = document.getElementById('submitNumBtn'); if(btn) btn.addEventListener('click', submitNumber); }, 1200); }

function submitNumber(){ const el = document.getElementById('numInput'); if(!el) return; const val = el.value.trim(); if(val === nCurrent){ nLevel++; const levelEl = document.getElementById('nlevel'); if(levelEl) levelEl.textContent = nLevel; setTimeout(showNumberLevelScreen, 300); return; } nLives--; const livesEl = document.getElementById('nlives'); if(livesEl) livesEl.textContent = '❤'.repeat(nLives); if(nLives <= 0){ if(nLevel - 1 > nBest){ nBest = nLevel - 1; localStorage.setItem('numberHigh', nBest); } showGameOver('Game Over — Number Memory', nLevel - 1, loadNumber); return; } setTimeout(showNumberLevelScreen, 300); }

// attach menu buttons
document.getElementById('btnSimon').addEventListener('click', loadSimon);
document.getElementById('btnVisual').addEventListener('click', loadVisual);
document.getElementById('btnNumber').addEventListener('click', loadNumber);

// initial menu
loadMenu();

