if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => console.log('Service Worker registrado:', registration))
      .catch(error => console.error('Error al registrar el Service Worker:', error));
  });
}

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

  // Calcular el uso de almacenamiento de forma más precisa
  const jsonString = JSON.stringify(trades);
  const storageUsed = jsonString.length * 2; // Cada carácter en UTF-16 usa 2 bytes
  const storageUsedKB = (storageUsed / 1024).toFixed(2);
  const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(4);

  // Calcular tamaño promedio por trade y estimación de trades restantes
  const avgSizePerTrade = total > 0 ? storageUsed / total : 0;
  const remainingTrades5MB = Math.floor((5 * 1024 * 1024 - storageUsed) / avgSizePerTrade);
  const remainingTrades10MB = Math.floor((10 * 1024 * 1024 - storageUsed) / avgSizePerTrade);

  // Calcular estimaciones basadas en uso real
  const tradesPerYear = 600; // Asumimos 600 trades por año
  const yearsEstimate5MB = Math.floor(remainingTrades5MB / tradesPerYear);
  const yearsEstimate10MB = Math.floor(remainingTrades10MB / tradesPerYear);

  // Función para determinar la clase y descripción de la tasa de aciertos
  const getWinRateInfo = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 80) return { class: 'winrate-excellent', desc: 'excelente' };
    if (numRate >= 51) return { class: 'winrate-good', desc: 'buena' };
    if (numRate >= 30) return { class: 'winrate-poor', desc: 'regular' };
    return { class: 'winrate-bad', desc: 'mala' };
  };

  const winRateInfo = getWinRateInfo(winRate);

  document.getElementById('statsContainer').innerHTML = `
    <div class="storage-info">
      Has registrado un total de ${total} trades, lo que supone un uso de memoria de ${storageUsedKB} KB (${storageUsedMB} MB)
      <div class="storage-limit-info">El límite de LocalStorage es aproximadamente 5-10 MB</div>
      ${total > 0 ? `
        <div class="storage-limit-info">
          En base a un límite de 5MB y el tamaño promedio del registro (${(avgSizePerTrade / 1024).toFixed(2)} KB por trade), 
          se estima que esa capacidad te permita registrar un restante de ${remainingTrades5MB.toLocaleString()} trades.
        </div>
        <div class="storage-limit-info">
          Si el límite fuera de 10MB, podrías registrar aproximadamente ${remainingTrades10MB.toLocaleString()} trades adicionales.
        </div>
        <div class="storage-capacity-info">
          <strong>Capacidad a largo plazo:</strong>
          <ul>
            <li>Con el límite de 5MB: Podrías registrar aproximadamente ${yearsEstimate5MB} años más de operaciones (asumiendo ${tradesPerYear} trades por año)</li>
            <li>Con el límite de 10MB: Podrías registrar aproximadamente ${yearsEstimate10MB} años más de operaciones</li>
          </ul>
        </div>
      ` : ''}
    </div>
    <div>1. Trades Totales: ${total}</div>
    <div>2. Ganancia Total: <span class="${gains >= 0 ? 'positive' : 'negative'}">${gains.toFixed(2)} MXN</span></div>
    <div>3. Acumulado de Pérdidas: <span class="${losses >= 0 ? 'positive' : 'negative'}">${losses.toFixed(2)} MXN</span></div>
    <div>4. P&L Neto: <span class="${pnl >= 0 ? 'positive' : 'negative'}">${pnl.toFixed(2)} MXN</span></div>
    <div>5. Tasa de Aciertos: <span class="${winRateInfo.class}">${winRate}%</span> | <span class="winrate-legend">Tienes una <span class="${winRateInfo.class}">${winRateInfo.desc}</span> tasa de aciertos</span></div>
    <div>6. Mejor Trade: ${best.toFixed(2)} MXN</div>
    <div>7. Peor Trade: ${worst.toFixed(2)} MXN</div>
  `;
}

function saveData() {
  if (!trades.length) { 
    alert('No hay datos para guardar.'); 
    return; 
  }
  const data = JSON.stringify(trades);
  localStorage.setItem('trades', data);
  alert('✅ Los datos han sido guardados exitosamente en el almacenamiento local del navegador.\n\nLos datos permanecerán disponibles incluso después de cerrar el navegador.');
}

function clearData() {
  if (confirm('⚠️ ¿Estás seguro que deseas eliminar todos los datos guardados?\n\nEsta acción no se puede deshacer.')) {
    trades = [];
    localStorage.removeItem('trades');
    renderDiary(); 
    renderStats();
    alert('🗑️ Todos los datos han sido eliminados exitosamente del almacenamiento local.');
  }
}

window.onload = function() {
  const saved = localStorage.getItem('trades');
  if (saved) {
    try { 
      trades = JSON.parse(saved); 
    } catch (e) { 
      trades = []; 
    }
  }
};
