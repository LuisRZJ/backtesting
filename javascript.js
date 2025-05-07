let trades = [];
document.getElementById('tab-entry-btn').addEventListener('click', () => showTab('entry'));
document.getElementById('tab-diary-btn').addEventListener('click', () => showTab('diary'));
document.getElementById('tab-stats-btn').addEventListener('click', () => showTab('stats'));

function showTab(tab) {
  ['entry', 'diary', 'stats'].forEach(t => document.getElementById('tab-' + t).classList.remove('active'));
  ['entry', 'diary', 'stats'].forEach(t => document.getElementById('tab-' + t + '-btn').classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('tab-' + tab + '-btn').classList.add('active');
  if (tab === 'diary') renderDiary();
  if (tab === 'stats') renderStats();
}

function addTrade() {
  const asset = document.getElementById('asset').value;
  const resultMxn = parseFloat(document.getElementById('resultMxn').value);
  const lots = parseFloat(document.getElementById('lots').value);
  const direction = document.getElementById('direction').value;
  const openTime = document.getElementById('openTime').value;
  const closeTime = document.getElementById('closeTime').value;
  const openPrice = parseFloat(document.getElementById('openPrice').value);
  const closePrice = parseFloat(document.getElementById('closePrice').value);
  const strategy = document.getElementById('strategy').value;
  const notes = document.getElementById('notes').value;
  if (!asset || isNaN(resultMxn) || isNaN(lots) || !openTime || !closeTime || isNaN(openPrice) || isNaN(closePrice)) {
    alert('Completa todos los campos obligatorios con valores válidos.');
    return;
  }
  trades.push({ asset, resultMxn, lots, direction, openTime, closeTime, openPrice, closePrice, strategy, notes });
  clearForm();
}

function clearForm() {
  ['asset', 'resultMxn', 'lots', 'direction', 'openTime', 'closeTime', 'openPrice', 'closePrice', 'strategy', 'notes']
    .forEach(id => document.getElementById(id).value = '');
}

function renderDiary() {
  const diaryContainer = document.getElementById('diaryContainer');
  diaryContainer.innerHTML = '';
  trades.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = `trade-card ${t.resultMxn > 0 ? 'gain' : 'loss'}`;
    card.innerHTML = `
      <div class="trade-header">
        <h3>Trade #${i + 1}</h3>
        <p><strong>Activo:</strong> ${t.asset}</p>
      </div>
      <div class="trade-body">
        <p><strong>Resultado:</strong> ${t.resultMxn.toFixed(2)} MXN</p>
        <p><strong>Lotes:</strong> ${t.lots.toFixed(2)}</p>
        <p><strong>Dirección:</strong> ${t.direction}</p>
        <p><strong>Apertura:</strong> ${t.openTime.replace('T', ' ')}</p>
        <p><strong>Cierre:</strong> ${t.closeTime.replace('T', ' ')}</p>
        <p><strong>Precio Apertura:</strong> ${t.openPrice.toFixed(4)}</p>
        <p><strong>Precio Cierre:</strong> ${t.closePrice.toFixed(4)}</p>
        <p><strong>Estrategia:</strong> ${t.strategy}</p>
        <p><strong>Notas:</strong> ${t.notes}</p>
      </div>
    `;
    diaryContainer.appendChild(card);
  });
}

function renderStats() {
  const total = trades.length;
  const gains = trades.filter(t => t.resultMxn > 0).reduce((sum, t) => sum + t.resultMxn, 0);
  const lossesArray = trades.filter(t => t.resultMxn < 0).map(t => t.resultMxn);
  const losses = lossesArray.reduce((sum, val) => sum + val, 0);
  const pnl = gains + losses;
  const winRate = total ? (trades.filter(t => t.resultMxn > 0).length / total * 100).toFixed(2) : '0.00';
  const best = total ? Math.max(...trades.map(t => t.resultMxn)) : 0;
  const worst = lossesArray.length ? Math.min(...lossesArray) : 0;
  document.getElementById('statsContainer').innerHTML = `
    <div>1. Trades Totales: ${total}</div>
    <div>2. Ganancia Total: ${gains.toFixed(2)} MXN</div>
    <div>3. Acumulado de Pérdidas: ${losses.toFixed(2)} MXN</div>
    <div>4. P&L Neto: ${pnl.toFixed(2)} MXN</div>
    <div>5. Tasa de Aciertos: ${winRate}%</div>
    <div>6. Mejor Trade: ${best.toFixed(2)} MXN</div>
    <div>7. Peor Trade: ${worst.toFixed(2)} MXN</div>
  `;
}

function saveData() {
  if (!trades.length) { alert('No hay datos para guardar.'); return; }
  const data = JSON.stringify(trades);
  document.cookie = 'trades=' + encodeURIComponent(data) + ';path=/;max-age=' + (60 * 60 * 24 * 365) + ';';
  localStorage.setItem('trades', data);
  alert('Datos guardados en cookies y localStorage.');
}

function clearData() {
  trades = [];
  document.cookie = 'trades=;path=/;max-age=0';
  localStorage.removeItem('trades');
  renderDiary(); renderStats();
  alert('Datos eliminados de local y cookies.');
}

window.onload = function() {
  let saved = localStorage.getItem('trades');
  if (!saved) {
    const match = document.cookie.match(/(?:^|;\s*)trades=([^;]+)/);
    if (match) saved = decodeURIComponent(match[1]);
  }
  if (saved) {
    try { trades = JSON.parse(saved); } catch (e) { trades = []; }
  }
};
