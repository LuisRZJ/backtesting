if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => console.log('Service Worker registrado:', registration))
      .catch(error => console.error('Error al registrar el Service Worker:', error));
  });
}

function showTab(tab) {
  ['entry', 'diary', 'stats'].forEach(t => document.getElementById('tab-' + t).classList.remove('active'));
  ['entry', 'diary', 'stats'].forEach(t => document.getElementById('tab-' + t + '-btn').classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('tab-' + tab + '-btn').classList.add('active');
  if (tab === 'diary') renderDiary();
  if (tab === 'stats') renderStats();
}

function addTrade() {
  const trade = {
    asset: document.getElementById('asset').value,
    resultMxn: document.getElementById('resultMxn').value,
    lots: document.getElementById('lots').value,
    direction: document.getElementById('direction').value,
    openTime: document.getElementById('openTime').value,
    closeTime: document.getElementById('closeTime').value,
    openPrice: document.getElementById('openPrice').value,
    closePrice: document.getElementById('closePrice').value,
    strategy: document.getElementById('strategy').value,
    notes: document.getElementById('notes').value
  };

  if (!trade.asset || !trade.resultMxn || !trade.lots || !trade.direction || 
      !trade.openTime || !trade.closeTime || !trade.openPrice || !trade.closePrice) {
    alert('Por favor, completa todos los campos requeridos');
    return;
  }

  const trades = JSON.parse(localStorage.getItem('trades')) || [];
  trades.push(trade);
  localStorage.setItem('trades', JSON.stringify(trades));

  document.getElementById('resultMxn').value = '';
  document.getElementById('lots').value = '';
  document.getElementById('openTime').value = '';
  document.getElementById('closeTime').value = '';
  document.getElementById('openPrice').value = '';
  document.getElementById('closePrice').value = '';
  document.getElementById('notes').value = '';

  alert('Trade agregado correctamente');
  
  if (typeof loadCardData === 'function') {
    loadCardData();
  }
  if (document.getElementById('diaryContainer')) {
    renderDiary();
  }
  if (document.getElementById('statsContainer')) {
    renderStats();
  }
}

function clearForm() {
  ['asset', 'resultMxn', 'lots', 'direction', 'openTime', 'closeTime', 'openPrice', 'closePrice', 'strategy', 'notes']
    .forEach(id => document.getElementById(id).value = '');
}

function renderDiary() {
  const diaryContainer = document.getElementById('diaryContainer');
  if (!diaryContainer) return;

  const trades = JSON.parse(localStorage.getItem('trades')) || [];
  diaryContainer.innerHTML = '';

  if (trades.length === 0) {
    diaryContainer.innerHTML = '<p>No hay trades registrados aún.</p>';
    return;
  }

  trades.slice().reverse().forEach((trade, index) => {
    const tradeCard = document.createElement('div');
    tradeCard.className = `trade-card ${parseFloat(trade.resultMxn) >= 0 ? 'gain' : 'loss'}`;
    
    // Calcular el índice real en el array original (no invertido)
    const realIndex = trades.length - 1 - index;
    
    // Formatear el par de divisas
    const formattedAsset = trade.asset.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
    
    // Traducir la dirección
    const direction = trade.direction === 'long' ? 'Compra' : 'Venta';
    
    tradeCard.innerHTML = `
      <div class="trade-header">
        <h3>${formattedAsset} - ${direction}</h3>
        <button class="btn-delete" onclick="deleteTrade(${realIndex})" title="Eliminar trade">
          <span class="delete-icon">×</span>
        </button>
      </div>
      <div class="trade-body">
        <p>Resultado: ${parseFloat(trade.resultMxn).toFixed(2)} MXN</p>
        <p>Lotes: ${trade.lots}</p>
        <p>Apertura: ${new Date(trade.openTime).toLocaleString()}</p>
        <p>Cierre: ${new Date(trade.closeTime).toLocaleString()}</p>
        <p>Precio de Apertura: ${trade.openPrice}</p>
        <p>Precio de Cierre: ${trade.closePrice}</p>
        <p>Estrategia: ${trade.strategy}</p>
        ${trade.notes ? `<p>Notas: ${trade.notes}</p>` : ''}
      </div>
    `;
    
    diaryContainer.appendChild(tradeCard);
  });
}

function deleteTrade(index) {
  if (confirm('¿Estás seguro de que deseas eliminar este trade?')) {
    const trades = JSON.parse(localStorage.getItem('trades')) || [];
    trades.splice(index, 1);
    localStorage.setItem('trades', JSON.stringify(trades));
    
    // Actualizar la vista
    renderDiary();
    
    // Actualizar otras vistas si existen
    if (document.getElementById('statsContainer')) {
      renderStats();
    }
    if (typeof loadCardData === 'function') {
      loadCardData();
    }
  }
}

function renderStats() {
  const statsContainer = document.getElementById('statsContainer');
  if (!statsContainer) return;

  const trades = JSON.parse(localStorage.getItem('trades')) || [];
  const total = trades.length;
  const gains = trades.filter(t => parseFloat(t.resultMxn) > 0).reduce((sum, t) => sum + parseFloat(t.resultMxn), 0);
  const lossesArray = trades.filter(t => parseFloat(t.resultMxn) < 0).map(t => parseFloat(t.resultMxn));
  const losses = lossesArray.reduce((sum, val) => sum + val, 0);
  const pnl = gains + losses;
  const winRate = total ? (trades.filter(t => parseFloat(t.resultMxn) > 0).length / total * 100).toFixed(2) : '0.00';
  const best = total ? Math.max(...trades.map(t => parseFloat(t.resultMxn))) : 0;
  const worst = lossesArray.length ? Math.min(...lossesArray) : 0;

  // Función para determinar la clase y descripción de la tasa de aciertos
  const getWinRateInfo = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 80) return { class: 'winrate-excellent', desc: 'excelente' };
    if (numRate >= 51) return { class: 'winrate-good', desc: 'buena' };
    if (numRate >= 30) return { class: 'winrate-poor', desc: 'regular' };
    return { class: 'winrate-bad', desc: 'mala' };
  };

  const winRateInfo = getWinRateInfo(winRate);

  statsContainer.innerHTML = `
    <div style="margin-top: 20px;">
      <div>1. Trades Totales: ${total}</div>
      <div>2. Ganancia Total: <span class="${gains >= 0 ? 'positive' : 'negative'}">${gains.toFixed(2)} MXN</span></div>
      <div>3. Acumulado de Pérdidas: <span class="${losses >= 0 ? 'positive' : 'negative'}">${losses.toFixed(2)} MXN</span></div>
      <div>4. P&L Neto: <span class="${pnl >= 0 ? 'positive' : 'negative'}">${pnl.toFixed(2)} MXN</span></div>
      <div>5. Tasa de Aciertos: <span class="${winRateInfo.class}">${winRate}%</span> | <span class="winrate-legend">Tienes una <span class="${winRateInfo.class}">${winRateInfo.desc}</span> tasa de aciertos</span></div>
      <div>6. Mejor Trade: ${best.toFixed(2)} MXN</div>
      <div>7. Peor Trade: ${worst.toFixed(2)} MXN</div>
    </div>
  `;
}

function saveData() {
  const trades = JSON.parse(localStorage.getItem('trades')) || [];
  localStorage.setItem('trades', JSON.stringify(trades));
  alert('Datos guardados correctamente');
}

function clearData() {
  if (confirm('¿Estás seguro de que deseas eliminar todos los datos?')) {
    localStorage.removeItem('trades');
    alert('Datos eliminados correctamente');
    location.reload();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('diaryContainer')) {
    renderDiary();
  }
  
  if (document.getElementById('statsContainer')) {
    renderStats();
  }
});
