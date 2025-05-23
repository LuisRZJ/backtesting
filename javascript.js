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
    notes: document.getElementById('notes').value,
    pips: document.getElementById('pips').value
  };

  if (!trade.asset || !trade.resultMxn || !trade.lots || !trade.direction || 
      !trade.openTime || !trade.closeTime || !trade.openPrice || !trade.closePrice || !trade.pips) {
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
  document.getElementById('pips').value = '';

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

// --- Corregir renderizado de pips en tabla de trades ---
function renderTradesTable() {
  const trades = JSON.parse(localStorage.getItem('trades')) || [];
  const tableContainer = document.getElementById('tableContainer');
  if (trades.length === 0) {
    tableContainer.innerHTML = '<p>No hay trades registrados aún.</p>';
    return;
  }
  let html = '<div style="overflow-x:auto;">';
  html += '<table class="trades-table">';
  html += '<thead><tr>' +
      '<th>Activo</th>' +
      '<th>Dirección</th>' +
      '<th>Lotes</th>' +
      '<th>Resultado (MXN)</th>' +
      '<th>Resultado (Pips)</th>' +
      '<th>Fecha Apertura</th>' +
      '<th>Fecha Cierre</th>' +
      '<th>Precio Entrada</th>' +
      '<th>Precio Salida</th>' +
      '<th>Estrategia</th>' +
      '<th>Notas</th>' +
      '</tr></thead><tbody>';
  trades.slice().reverse().forEach(trade => {
    const formattedAsset = trade.asset.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
    const isCompra = trade.direction === 'long';
    const direction = isCompra ? 'COMPRA' : 'VENTA';
    const directionClass = isCompra ? 'trade-direction-compra' : 'trade-direction-venta';
    const openDate = new Date(trade.openTime);
    const closeDate = new Date(trade.closeTime);
    html += `<tr>` +
        `<td>${formattedAsset}</td>` +
        `<td class="${directionClass}">${direction}</td>` +
        `<td>${parseFloat(trade.lots).toFixed(3)}</td>` +
        `<td class="${parseFloat(trade.resultMxn) >= 0 ? 'positive' : 'negative'}">${parseFloat(trade.resultMxn).toFixed(2)}</td>` +
        `<td>${trade.pips ? parseFloat(trade.pips).toFixed(3) : '-'}</td>` +
        `<td>${openDate.toLocaleString('es-ES')}</td>` +
        `<td>${closeDate.toLocaleString('es-ES')}</td>` +
        `<td>${trade.openPrice}</td>` +
        `<td>${trade.closePrice}</td>` +
        `<td>${trade.strategy}</td>` +
        `<td>${trade.notes ? trade.notes : '-'}</td>` +
        `</tr>`;
  });
  html += '</tbody></table></div>';
  tableContainer.innerHTML = html;
}

function clearForm() {
  ['asset', 'resultMxn', 'lots', 'direction', 'openTime', 'closeTime', 'openPrice', 'closePrice', 'strategy', 'notes', 'pips']
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

  // Agrupar trades por fecha de cierre (local, YYYY-MM-DD)
  const tradesByDate = {};
  trades.forEach(trade => {
    const closeDate = new Date(trade.closeTime);
    // Obtener fecha local en formato YYYY-MM-DD
    const dateKey = closeDate.getFullYear() + '-' + String(closeDate.getMonth() + 1).padStart(2, '0') + '-' + String(closeDate.getDate()).padStart(2, '0');
    if (!tradesByDate[dateKey]) tradesByDate[dateKey] = [];
    tradesByDate[dateKey].push(trade);
  });

  // Ordenar fechas de más reciente a más antigua
  const sortedDates = Object.keys(tradesByDate).sort((a, b) => b.localeCompare(a));

  sortedDates.forEach(dateKey => {
    // Usar la fecha local del primer trade del grupo para el separador
    const firstTrade = tradesByDate[dateKey][0];
    const dateObj = new Date(firstTrade.closeTime);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = dateObj.toLocaleDateString('es-ES', options);
    const separator = document.createElement('div');
    separator.className = 'trade-day-separator';
    separator.innerHTML = `<hr class='trade-day-hr'><div class='trade-day-label'>${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</div>`;
    diaryContainer.appendChild(separator);

    // Mostrar los trades de ese día (más recientes primero)
    tradesByDate[dateKey].slice().reverse().forEach((trade, index) => {
      const tradeCard = document.createElement('div');
      tradeCard.className = `trade-card custom-trade-card ${parseFloat(trade.resultMxn) >= 0 ? 'gain' : 'loss'}`;

      // Calcular el índice real en el array original (no invertido)
      const realIndex = trades.length - 1 - trades.findIndex(t => t === trade);

      // Formatear el par de divisas
      const formattedAsset = trade.asset.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');

      // Traducir la dirección y asignar color
      const isCompra = trade.direction === 'long';
      const direction = isCompra ? 'COMPRA' : 'VENTA';
      const directionClass = isCompra ? 'trade-direction-compra' : 'trade-direction-venta';

      // Formatear fecha y hora de cierre
      const closeDate = new Date(trade.closeTime);
      const closeDateStr = closeDate.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' });
      const closeTimeStr = closeDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      // Formatear fecha y hora de apertura
      const openDate = new Date(trade.openTime);
      const openDateStr = openDate.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' });
      const openTimeStr = openDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      // Usar openTime y closeTime como identificadores únicos
      tradeCard.innerHTML = `
        <div class="trade-row trade-date-row">
          <span class="trade-date">${closeDateStr} | ${closeTimeStr}</span>
        </div>
        <div class="trade-row trade-asset-row">
          <span class="trade-asset">${formattedAsset}</span>
          <span class="trade-direction ${directionClass}">${direction}</span>
        </div>
        <div class="trade-row trade-details-row">
          <span class="trade-lots">${parseFloat(trade.lots).toFixed(3)}</span>
          <span class="trade-prices">${trade.openPrice} - ${trade.closePrice}</span>
          <span class="trade-pips">${trade.pips ? parseFloat(trade.pips).toFixed(3) + ' pips' : '-'}</span>
        </div>
        <div class="trade-row trade-result-row">
          <span class="trade-result ${parseFloat(trade.resultMxn) >= 0 ? 'positive' : 'negative'}">
            ${parseFloat(trade.resultMxn) >= 0 ? '+' : ''}${parseFloat(trade.resultMxn).toFixed(2)} MXN
          </span>
          <button class="btn-details" title="Ver detalles">🔍</button>
          <button class="btn-edit" title="Editar trade">✏️</button>
          <button class="btn-delete" onclick="deleteTradeById('${trade.openTime}','${trade.closeTime}','${trade.asset}','${trade.resultMxn}','${trade.lots}')" title="Eliminar trade">
            <span class="delete-icon">×</span>
          </button>
        </div>
      `;

      // Evento para mostrar detalles
      tradeCard.querySelector('.btn-details').onclick = function() {
        showTradeDetails(trade);
      };
      // Evento para editar trade
      tradeCard.querySelector('.btn-edit').onclick = function() {
        showEditTradeModal(trade);
      };

      diaryContainer.appendChild(tradeCard);
    });
  });
}

// Nueva función para eliminar trade por identificadores únicos
function deleteTradeById(openTime, closeTime, asset, resultMxn, lots) {
  if (confirm('¿Estás seguro de que deseas eliminar este trade?')) {
    let trades = JSON.parse(localStorage.getItem('trades')) || [];
    // Buscar el trade que coincida exactamente con todos los datos clave
    const index = trades.findIndex(t => t.openTime === openTime && t.closeTime === closeTime && t.asset === asset && t.resultMxn === resultMxn && t.lots === lots);
    if (index !== -1) {
      trades.splice(index, 1);
      localStorage.setItem('trades', JSON.stringify(trades));
      renderDiary();
      if (document.getElementById('statsContainer')) renderStats();
      if (typeof loadCardData === 'function') loadCardData();
    } else {
      alert('No se pudo encontrar el trade para eliminar.');
    }
  }
}

function showTradeDetails(trade) {
  // Si ya existe un modal, eliminarlo primero
  const oldModal = document.getElementById('trade-details-modal');
  if (oldModal) oldModal.remove();

  // Formatear datos
  const formattedAsset = trade.asset.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
  const isCompra = trade.direction === 'long';
  const direction = isCompra ? 'COMPRA' : 'VENTA';
  const directionClass = isCompra ? 'trade-direction-compra' : 'trade-direction-venta';
  const closeDate = new Date(trade.closeTime);
  const closeDateStr = closeDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const closeTimeStr = closeDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const openDate = new Date(trade.openTime);
  const openDateStr = openDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const openTimeStr = openDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  // Crear modal
  const modal = document.createElement('div');
  modal.id = 'trade-details-modal';
  modal.className = 'trade-details-modal-bg';
  modal.innerHTML = `
    <div class="trade-details-modal-card">
      <button class="trade-details-close" title="Cerrar">&times;</button>
      <h2>Detalles de la Operación</h2>
      <div class="trade-details-list">
        <div><strong>Activo:</strong> <span>${formattedAsset}</span></div>
        <div><strong>Dirección:</strong> <span class="${directionClass}">${direction}</span></div>
        <div><strong>Lotes:</strong> <span>${parseFloat(trade.lots).toFixed(3)}</span></div>
        <div><strong>Resultado:</strong> <span class="${parseFloat(trade.resultMxn) >= 0 ? 'positive' : 'negative'}">${parseFloat(trade.resultMxn) >= 0 ? '+' : ''}${parseFloat(trade.resultMxn).toFixed(2)} MXN</span></div>
        <div><strong>Resultado (Pips):</strong> <span>${trade.pips ? parseFloat(trade.pips).toFixed(3) : '-'}</span></div>
        <div><strong>Fecha de Apertura:</strong> <span>${openDateStr} | ${openTimeStr}</span></div>
        <div><strong>Fecha de Cierre:</strong> <span>${closeDateStr} | ${closeTimeStr}</span></div>
        <div><strong>Precio de Entrada:</strong> <span>${trade.openPrice}</span></div>
        <div><strong>Precio de Salida:</strong> <span>${trade.closePrice}</span></div>
        <div><strong>Estrategia:</strong> <span>${trade.strategy}</span></div>
        <div style='align-items: flex-start;'><strong>Notas:</strong> <span class='trade-details-list-notes'>${trade.notes ? trade.notes : '-'}</span></div>
      </div>
    </div>
  `;

  // Evento de cierre
  modal.querySelector('.trade-details-close').onclick = function() {
    modal.remove();
  };

  document.body.appendChild(modal);
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
  const trades = JSON.parse(localStorage.getItem('trades')) || [];
  const total = trades.length;
  const winningTrades = trades.filter(t => parseFloat(t.resultMxn) > 0).length;
  const losingTrades = trades.filter(t => parseFloat(t.resultMxn) < 0).length;
  const gains = trades.filter(t => parseFloat(t.resultMxn) > 0).reduce((sum, t) => sum + parseFloat(t.resultMxn), 0);
  const lossesArray = trades.filter(t => parseFloat(t.resultMxn) < 0).map(t => parseFloat(t.resultMxn));
  const losses = lossesArray.reduce((sum, val) => sum + val, 0);
  const pnl = gains + losses;
  const winRate = total ? (winningTrades / total * 100).toFixed(2) : '0.00';
  const best = total ? Math.max(...trades.map(t => parseFloat(t.resultMxn))) : 0;
  const worst = lossesArray.length ? Math.min(...lossesArray) : 0;
  const avgWin = winningTrades ? (gains / winningTrades).toFixed(2) : 0;
  const avgLoss = losingTrades ? (losses / losingTrades).toFixed(2) : 0;
  const profitFactor = Math.abs(losses) ? (gains / Math.abs(losses)).toFixed(2) : 0;

  // Calcular operaciones Break Even
  const breakevenTrades = trades.filter(t => parseFloat(t.resultMxn) === 0).length;

  // Cálculos de estrategias
  const strategyStats = {};
  trades.forEach(trade => {
    const strategy = trade.strategy || 'Sin estrategia';
    if (!strategyStats[strategy]) {
      strategyStats[strategy] = {
        total: 0,
        wins: 0,
        pnl: 0
      };
    }
    strategyStats[strategy].total++;
    strategyStats[strategy].pnl += parseFloat(trade.resultMxn);
    if (parseFloat(trade.resultMxn) > 0) {
      strategyStats[strategy].wins++;
    }
  });

  // Encontrar estrategia más rentable
  let mostProfitable = { name: 'N/A', pnl: 0 };
  Object.entries(strategyStats).forEach(([strategy, stats]) => {
    if (stats.pnl > mostProfitable.pnl) {
      mostProfitable = { name: strategy, pnl: stats.pnl };
    }
  });

  // Encontrar estrategia más operada
  let mostUsed = { name: 'N/A', total: 0 };
  Object.entries(strategyStats).forEach(([strategy, stats]) => {
    if (stats.total > mostUsed.total) {
      mostUsed = { name: strategy, total: stats.total };
    }
  });

  // Encontrar estrategia más fiable
  let mostReliable = { name: 'N/A', winRate: 0 };
  Object.entries(strategyStats).forEach(([strategy, stats]) => {
    const winRate = (stats.wins / stats.total) * 100;
    if (winRate > mostReliable.winRate) {
      mostReliable = { name: strategy, winRate: winRate };
    }
  });

  // Actualizar estadísticas generales
  const totalTradesElement = document.getElementById('totalTrades');
  const winningTradesElement = document.getElementById('winningTrades');
  const losingTradesElement = document.getElementById('losingTrades');
  const winRateElement = document.getElementById('winRate');
  const totalProfitElement = document.getElementById('totalProfit');
  const maxDrawdownElement = document.getElementById('maxDrawdown');
  const profitRiskRatioElement = document.getElementById('profitRiskRatio');
  const breakevenTradesElement = document.getElementById('breakevenTrades');

  if (totalTradesElement) totalTradesElement.textContent = total;
  if (winningTradesElement) winningTradesElement.textContent = winningTrades;
  if (losingTradesElement) losingTradesElement.textContent = losingTrades;
  if (breakevenTradesElement) breakevenTradesElement.textContent = breakevenTrades;
  if (winRateElement) {
    winRateElement.textContent = `${winRate}%`;
    if (parseFloat(winRate) >= 80) {
      winRateElement.className = 'stat-value winrate-excellent';
    } else if (parseFloat(winRate) >= 51) {
      winRateElement.className = 'stat-value winrate-good';
    } else if (parseFloat(winRate) >= 30) {
      winRateElement.className = 'stat-value winrate-poor';
    } else {
      winRateElement.className = 'stat-value winrate-bad';
    }
  }

  // Actualizar estadísticas de rendimiento
  if (totalProfitElement) {
    totalProfitElement.textContent = `${pnl.toFixed(2)} MXN`;
    totalProfitElement.className = `stat-value ${pnl >= 0 ? 'positive' : 'negative'}`;
  }
  if (maxDrawdownElement) {
    maxDrawdownElement.textContent = `${worst.toFixed(2)} MXN`;
    maxDrawdownElement.className = `stat-value ${worst >= 0 ? 'positive' : 'negative'}`;
  }
  if (profitRiskRatioElement) {
    profitRiskRatioElement.textContent = profitFactor;
    profitRiskRatioElement.className = `stat-value ${profitFactor >= 1 ? 'positive' : 'negative'}`;
  }

  // Actualizar estadísticas de estrategias
  const mostProfitableElement = document.getElementById('mostProfitableStrategy');
  const mostUsedElement = document.getElementById('mostUsedStrategy');
  const mostReliableElement = document.getElementById('mostReliableStrategy');

  if (mostProfitableElement) {
    mostProfitableElement.textContent = `${mostProfitable.name} (${mostProfitable.pnl.toFixed(2)} MXN)`;
    mostProfitableElement.className = `stat-value ${mostProfitable.pnl >= 0 ? 'positive' : 'negative'}`;
  }
  if (mostUsedElement) {
    mostUsedElement.textContent = `${mostUsed.name} (${mostUsed.total} ops)`;
  }
  if (mostReliableElement) {
    mostReliableElement.textContent = `${mostReliable.name} (${mostReliable.winRate.toFixed(1)}%)`;
    if (mostReliable.winRate >= 80) {
      mostReliableElement.className = 'stat-value winrate-excellent';
    } else if (mostReliable.winRate >= 51) {
      mostReliableElement.className = 'stat-value winrate-good';
    } else if (mostReliable.winRate >= 30) {
      mostReliableElement.className = 'stat-value winrate-poor';
    } else {
      mostReliableElement.className = 'stat-value winrate-bad';
    }
  }

  // Cálculo de PNL Pips y Promedio Pips por Trade
  const tradesWithPips = trades.filter(t => t.pips !== undefined && t.pips !== null && t.pips !== '');
  const totalPips = tradesWithPips.reduce((sum, t) => sum + parseFloat(t.pips), 0);
  const avgPips = tradesWithPips.length ? (totalPips / tradesWithPips.length) : 0;

  // Actualizar tarjetas de pips
  const totalPipsElement = document.getElementById('totalPips');
  const avgPipsElement = document.getElementById('avgPips');
  if (totalPipsElement) totalPipsElement.textContent = `${totalPips.toFixed(3)} pips`;
  if (avgPipsElement) avgPipsElement.textContent = `${avgPips.toFixed(3)} pips`;

  // Cálculo de Max. Ganancia (MXN) y Promedio Ganancia (MXN)
  const tradesWithMxn = trades.filter(t => t.resultMxn !== undefined && t.resultMxn !== null && t.resultMxn !== '');
  const maxProfit = tradesWithMxn.length ? Math.max(...tradesWithMxn.map(t => parseFloat(t.resultMxn))) : 0;
  const avgProfit = tradesWithMxn.length ? (tradesWithMxn.reduce((sum, t) => sum + parseFloat(t.resultMxn), 0) / tradesWithMxn.length) : 0;

  // Actualizar tarjetas de ganancias monetarias
  const maxProfitElement = document.getElementById('maxProfit');
  const avgProfitElement = document.getElementById('avgProfit');
  if (maxProfitElement) maxProfitElement.textContent = `$${maxProfit.toFixed(2)}`;
  if (avgProfitElement) avgProfitElement.textContent = `$${avgProfit.toFixed(2)}`;

  // === Cálculo de Holding Promedio ===
  const tradesWithTimes = trades.filter(t => t.openTime && t.closeTime);
  let avgHoldingMs = 0;
  if (tradesWithTimes.length > 0) {
    const totalHoldingMs = tradesWithTimes.reduce((sum, t) => {
      const open = new Date(t.openTime);
      const close = new Date(t.closeTime);
      return sum + (close - open);
    }, 0);
    avgHoldingMs = totalHoldingMs / tradesWithTimes.length;
  }
  // Convertir a formato legible (horas, minutos)
  function formatDuration(ms) {
    if (!ms || ms <= 0) return '-';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }
  const avgHoldingElement = document.getElementById('avgHolding');
  if (avgHoldingElement) avgHoldingElement.textContent = formatDuration(avgHoldingMs);

  // === Cálculo de Horario Favorito (franjas de 4 horas) ===
  const hourRanges = [
    { label: '00:00-03:59', start: 0, end: 3 },
    { label: '04:00-07:59', start: 4, end: 7 },
    { label: '08:00-11:59', start: 8, end: 11 },
    { label: '12:00-15:59', start: 12, end: 15 },
    { label: '16:00-19:59', start: 16, end: 19 },
    { label: '20:00-23:59', start: 20, end: 23 }
  ];
  const hourCounts = Array(hourRanges.length).fill(0);
  tradesWithTimes.forEach(t => {
    const open = new Date(t.openTime);
    const hour = open.getHours();
    for (let i = 0; i < hourRanges.length; i++) {
      if (hour >= hourRanges[i].start && hour <= hourRanges[i].end) {
        hourCounts[i]++;
        break;
      }
    }
  });
  let maxCount = Math.max(...hourCounts);
  let favoriteRange = '-';
  if (maxCount > 0) {
    const idx = hourCounts.indexOf(maxCount);
    favoriteRange = hourRanges[idx].label + ` (${maxCount} ops)`;
  }
  const favoriteHourElement = document.getElementById('favoriteHour');
  if (favoriteHourElement) favoriteHourElement.textContent = favoriteRange;

  // === Cálculo de Calificación de Rendimiento ===
  let performanceScore = 0;
  const maxPossibleScore = 6; // Aumentar a 6 criterios

  // Calcular valores individuales de los criterios
  const winRateValue = total ? (winningTrades / total * 100).toFixed(2) : '0.00';
  const pnlValue = pnl.toFixed(2);
  const drawdownValue = worst.toFixed(2); // 'worst' ya es el drawdown máximo (más negativo)
  const profitFactorValue = profitFactor;
  const avgPipsValue = avgPips.toFixed(3);
  const avgProfitValue = avgProfit.toFixed(2); // Obtener el valor del promedio de ganancia (ya calculado previamente)

  // Determinar si cada criterio suma un punto y actualizar los elementos HTML

  // Criterio 1: Win Rate
  const newWinRateThreshold = 60; // New threshold
  const winRateMet = parseFloat(winRateValue) >= newWinRateThreshold;
  if (winRateMet) { performanceScore += 1; }
  const winRateCriterionValueElement = document.querySelector('#criterion-winrate .criterion-value');
  const winRateCriterionScoreElement = document.querySelector('#criterion-winrate .criterion-score');

  if (winRateCriterionValueElement) winRateCriterionValueElement.textContent = `${winRateValue}%`;
  if (winRateCriterionScoreElement) {
      winRateCriterionScoreElement.textContent = winRateMet ? '✓' : '✗';
      winRateCriterionScoreElement.className = `criterion-score ${winRateMet ? 'scored' : 'not-scored'}`;
  }

  // Criterio 2: PNL Final
  const pnlMet = pnl > 0;
  if (pnlMet) { performanceScore += 1; }
  const pnlElement = document.querySelector('#criterion-pnl .criterion-value');
  const pnlScoreElement = document.querySelector('#criterion-pnl .criterion-score');
  if (pnlElement) pnlElement.textContent = `${pnlValue} MXN`;
  if (pnlScoreElement) {
      pnlScoreElement.textContent = pnlMet ? '✓' : '✗';
      pnlScoreElement.className = `criterion-score ${pnlMet ? 'scored' : 'not-scored'}`;
  }

  // Criterio 3: Drawdown Máximo
  const drawdownValueElement = document.querySelector('#criterion-drawdown .criterion-value');
  const drawdownScoreElement = document.querySelector('#criterion-drawdown .criterion-score');

   // Ajuste: Si no hay trades perdedores (losses === 0), el drawdown es 0, lo cual es excelente.
   if (losses === 0 && total > 0) { // Si hay trades pero no perdedores, drawdown es 0, esto es bueno.
       performanceScore += 1;
        if (drawdownValueElement) drawdownValueElement.textContent = `${drawdownValue} MXN`;
        if (drawdownScoreElement) {
            drawdownScoreElement.textContent = '✓';
            drawdownScoreElement.className = 'criterion-score scored';
        }
   } else { // Hay trades perdedores o no hay trades.
       const drawdownMetAdjusted = pnl > 0 && Math.abs(parseFloat(drawdownValue)) <= Math.abs(losses);
        if (drawdownMetAdjusted) { performanceScore += 1; }
        if (drawdownValueElement) drawdownValueElement.textContent = `${drawdownValue} MXN`;
        if (drawdownScoreElement) {
            drawdownScoreElement.textContent = drawdownMetAdjusted ? '✓' : '✗';
            drawdownScoreElement.className = `criterion-score ${drawdownMetAdjusted ? 'scored' : 'not-scored'}`;
        }
   }


  // Criterio 4: Ratio Beneficio/Riesgo
  const newProfitFactorThreshold = 150.00; // New threshold (assuming this is the factor value)
  const profitFactorMet = parseFloat(profitFactorValue) >= newProfitFactorThreshold;
  if (profitFactorMet) { performanceScore += 1; }
  const ratioElement = document.querySelector('#criterion-ratio .criterion-value');
  const ratioScoreElement = document.querySelector('#criterion-ratio .criterion-score');
  if (ratioElement) ratioElement.textContent = profitFactorValue;
  if (ratioScoreElement) {
      ratioScoreElement.textContent = profitFactorMet ? '✓' : '✗';
      ratioScoreElement.className = `criterion-score ${profitFactorMet ? 'scored' : 'not-scored'}`;
  }

  // Criterio 5: Promedio Pips por Trade
  const newAvgPipsThreshold = 5; // New threshold
  const avgPipsMet = avgPips > newAvgPipsThreshold;
  if (avgPipsMet) { performanceScore += 1; }
  const avgPipsCriterionValueElement = document.querySelector('#criterion-avgpips .criterion-value');
  const avgPipsCriterionScoreElement = document.querySelector('#criterion-avgpips .criterion-score');

  if (avgPipsCriterionValueElement) avgPipsCriterionValueElement.textContent = `${avgPipsValue} pips`;
  if (avgPipsCriterionScoreElement) {
      avgPipsCriterionScoreElement.textContent = avgPipsMet ? '✓' : '✗';
      avgPipsCriterionScoreElement.className = `criterion-score ${avgPipsMet ? 'scored' : 'not-scored'}`;
  }

  // Criterio 6: Promedio Ganancia (MXN)
  const newAvgProfitThreshold = 10; // New threshold (ajustar según necesites)
  const avgProfitMet = parseFloat(avgProfitValue) > newAvgProfitThreshold;
   // Asegurarse de que haya trades ganadores para considerar este criterio
  if (winningTrades > 0 && avgProfitMet) { performanceScore += 1; }
  const avgProfitCriterionValueElement = document.querySelector('#criterion-avgprofit .criterion-value');
  const avgProfitCriterionScoreElement = document.querySelector('#criterion-avgprofit .criterion-score');

  if (avgProfitCriterionValueElement) avgProfitCriterionValueElement.textContent = `${avgProfitValue} MXN`;
   if (avgProfitCriterionScoreElement) {
       // Solo mostrar ✓ o ✗ si hay trades ganadores para evaluar este criterio
       if (winningTrades > 0) {
           avgProfitCriterionScoreElement.textContent = avgProfitMet ? '✓' : '✗';
           avgProfitCriterionScoreElement.className = `criterion-score ${avgProfitMet ? 'scored' : 'not-scored'}`;
       } else {
           avgProfitCriterionScoreElement.textContent = '-'; // No aplicable si no hay ganancias
           avgProfitCriterionScoreElement.className = 'criterion-score'; // Sin color
       }
   }


  // Calcular porcentaje de calificación
  const ratingPercentage = total > 0 ? (performanceScore / maxPossibleScore) * 100 : 0;

  // Determinar descripción de la calificación
  let ratingDescription = 'Sin datos';
   if (total > 0) {
      if (ratingPercentage >= 80) {
          ratingDescription = 'Excelente';
      } else if (ratingPercentage >= 60) {
          ratingDescription = 'Bueno';
      } else if (ratingPercentage >= 40) {
          ratingDescription = 'Regular';
      } else {
          ratingDescription = 'Malo';
      }
   } else {
        ratingDescription = 'Aún no hay trades';
   }


  const ratingSummaryElement = document.getElementById('performanceRatingSummary');
  if (ratingSummaryElement) {
      if (total === 0) {
          ratingSummaryElement.textContent = 'Aún no hay trades para calcular el rendimiento.';
          // Restablecer estilos si no hay datos
          ratingSummaryElement.style.color = '';
          ratingSummaryElement.style.fontWeight = '';
      } else {
           ratingSummaryElement.textContent = `Tu rendimiento general es ${ratingDescription} (${ratingPercentage.toFixed(0)}%)`;

           // Cambiar color basado en el porcentaje
           if (ratingPercentage < 30) {
               ratingSummaryElement.style.color = '#f44336'; // Rojo
               ratingSummaryElement.style.fontWeight = 'bold';
           } else if (ratingPercentage >= 31 && ratingPercentage <= 70) {
               ratingSummaryElement.style.color = '#FF9800'; // Naranja
               ratingSummaryElement.style.fontWeight = 'bold';
           } else if (ratingPercentage >= 71) {
               ratingSummaryElement.style.color = '#4CAF50'; // Verde
               ratingSummaryElement.style.fontWeight = 'bold';
           } else {
               // Color por defecto si no cae en los rangos (aunque teóricamente siempre caerá)
               ratingSummaryElement.style.color = '';
               ratingSummaryElement.style.fontWeight = '';
           }
      }
  }

  // === Actualizar Barra de Progreso ===
  const progressBarFillElement = document.getElementById('performanceProgressBarFill');
  const progressBarMarkerElement = document.getElementById('performanceProgressBarMarker');

  if (progressBarFillElement) {
      // Asegurarse de que el porcentaje esté entre 0 y 100
      const clampedPercentage = Math.max(0, Math.min(100, ratingPercentage));
      progressBarFillElement.style.width = `${clampedPercentage}%`;
  }

  if (progressBarMarkerElement) {
      // Posicionar el marcador. El left es el porcentaje, pero necesitamos ajustarlo un poco si está muy cerca de los bordes
      // Para un marcador centrado, la posición left debería ser el porcentaje.
      // Sin embargo, para que no se salga del borde, podemos limitarlo.
      // Por ejemplo, si es 0%, left debería ser 0%. Si es 100%, left debería ser 100%.
      // Ya que el marcador está centrado horizontalmente con transform: translateX(-50%), left = 50% lo pone al medio.
      // Si left = 0%, el centro del marcador está en el borde izquierdo.
      // Si left = 100%, el centro del marcador está en el borde derecho.
      // Queremos que la punta del marcador (el centro) esté en la posición correcta.
      // El marcador tiene un ancho de 16px (8px left + 8px right borders). Con transform: translateX(-50%), se ajusta.
      // left: 0% pone la punta en 0.
      // left: 100% pone la punta en 100.
      const clampedPercentage = Math.max(0, Math.min(100, ratingPercentage));
      progressBarMarkerElement.style.left = `${clampedPercentage}%`;

      // Opcional: Ajustar un poco la posición si está muy cerca de los bordes para que la flecha no se corte
      // Esto es más complejo y quizás no necesario con translateX(-50%)
      // if (clampedPercentage < 5) { progressBarMarkerElement.style.left = '5%'; }
      // if (clampedPercentage > 95) { progressBarMarkerElement.style.left = '95%'; }
  }
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

// === EVOLUCIÓN DE CAPITAL Y SALDO ACTUAL ===

// Instancias de los 3 gráficos
let capitalChartInstances = {
    monthly: null,
    yearly: null,
    all: null
};

function getCapitalHistory(period) {
    let initialCapital = parseFloat(localStorage.getItem('initialCapital') || '0');
    let trades = JSON.parse(localStorage.getItem('trades')) || [];
    // Buscar la fecha más antigua entre el saldo inicial y el trade más antiguo
    let firstTradeDate = trades.length > 0 ? new Date(Math.min(...trades.map(t => new Date(t.openTime).getTime()))) : new Date();
    let capitalStartDate = localStorage.getItem('capitalStartDate');
    let startDate;
    const today = new Date();
    switch(period) {
        case 'monthly':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'yearly':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
        case 'all':
        default:
            // Usar la fecha más antigua entre el saldo inicial y el primer trade
            if (capitalStartDate) {
                let capDate = new Date(capitalStartDate);
                startDate = capDate < firstTradeDate ? capDate : firstTradeDate;
            } else {
                startDate = firstTradeDate;
            }
    }
    // Incluir todos los trades desde la fecha de inicio
    const tradesAfterStart = trades
        .filter(trade => new Date(trade.openTime) >= startDate)
        .sort((a, b) => new Date(a.openTime) - new Date(b.openTime));
    let capitalHistory = [{ date: startDate, value: initialCapital }];
    let currentCapital = initialCapital;
    tradesAfterStart.forEach(trade => {
        currentCapital += parseFloat(trade.resultMxn);
        capitalHistory.push({ date: new Date(trade.openTime), value: currentCapital });
    });
    return capitalHistory;
}

function renderCapitalChart(period) {
    const canvasId = 'capitalChart-' + period;
    const ctx = document.getElementById(canvasId).getContext('2d');
    const capitalHistory = getCapitalHistory(period);
    if (capitalChartInstances[period]) {
        capitalChartInstances[period].destroy();
    }
    capitalChartInstances[period] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: capitalHistory.map(p => p.date.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })),
            datasets: [{
                label: 'Evolución del Capital',
                data: capitalHistory.map(p => p.value),
                borderColor: '#1de9b6',
                backgroundColor: 'rgba(29,233,182,0.08)',
                tension: 0.3,
                pointRadius: 2,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: true, beginAtZero: false } }
        }
    });
}

function showCapitalChart(period) {
    // Oculta todos los canvas y muestra solo el seleccionado
    document.querySelectorAll('.capitalChartCanvas').forEach(c => c.style.display = 'none');
    document.getElementById('capitalChart-' + period).style.display = 'block';
}

function updateCapitalHeader(period) {
    const username = localStorage.getItem('username') || 'Usuario';
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) welcomeMessage.textContent = `Hola, ${username}`;

    let initialCapital = parseFloat(localStorage.getItem('initialCapital') || '0');
    let trades = JSON.parse(localStorage.getItem('trades')) || [];
    if (trades.length === 0) {
        // Sin trades, mostrar solo el saldo inicial
        document.getElementById('capital-balance').textContent = `$${initialCapital.toFixed(2)}`;
        document.getElementById('capital-roi').textContent = `+$0.00 | ROI: 0%`;
        return;
    }

    // Ordenar trades por fecha de apertura
    trades = trades.slice().sort((a, b) => new Date(a.openTime) - new Date(b.openTime));

    // Agrupar trades por periodo
    function getPeriodKey(date, period) {
        const d = new Date(date);
        if (period === 'monthly') {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else if (period === 'yearly') {
            return `${d.getFullYear()}`;
        } else if (period === 'weekly') {
            // Semana ISO: lunes como primer día
            const temp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = temp.getUTCDay() || 7;
            temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(temp.getUTCFullYear(),0,1));
            const weekNum = Math.ceil((((temp - yearStart) / 86400000) + 1)/7);
            return `${temp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        }
        return 'all';
    }

    // Agrupar trades por periodo
    const periods = {};
    trades.forEach(trade => {
        const key = getPeriodKey(trade.openTime, period);
        if (!periods[key]) periods[key] = [];
        periods[key].push(trade);
    });
    const periodKeys = Object.keys(periods).sort();

    // Calcular balances acumulativos por periodo
    let balances = [];
    let lastBalance = initialCapital;
    periodKeys.forEach((key, idx) => {
        const pnl = periods[key].reduce((sum, t) => sum + parseFloat(t.resultMxn), 0);
        const balance = lastBalance + pnl;
        balances.push({ key, pnl, balance });
        lastBalance = balance;
    });

    // Determinar el periodo actual
    const now = new Date();
    const currentKey = getPeriodKey(now, period);
    let currentIdx = periodKeys.indexOf(currentKey);

    let balance, ganancia, roi, base;
    if (currentIdx === -1) {
        // No hay trades en el periodo actual
        balance = balances.length > 0 ? balances[balances.length - 1].balance : initialCapital;
        ganancia = 0;
        base = balances.length > 0 ? balances[balances.length - 1].balance : initialCapital;
        roi = 0;
    } else {
        const current = balances[currentIdx];
        balance = current.balance;
        ganancia = current.pnl;
        base = currentIdx === 0 ? initialCapital : balances[currentIdx-1].balance;
        roi = base > 0 ? (ganancia / base) * 100 : 0;
    }

    // Mostrar datos
    const balanceElement = document.getElementById('capital-balance');
    const roiElement = document.getElementById('capital-roi');
    if (balanceElement) {
        balanceElement.textContent = `$${balance.toFixed(2)}`;
        balanceElement.style.color = balance >= base ? '#2ecc71' : '#e74c3c';
        balanceElement.style.fontWeight = 'bold';
        balanceElement.style.fontSize = '2.2em';
    }
    if (roiElement) {
        roiElement.textContent = `${ganancia >= 0 ? '+' : ''}$${ganancia.toFixed(2)} | ROI: ${roi >= 0 ? '' : '-'}${Math.abs(roi).toFixed(0)}%`;
        roiElement.style.color = roi >= 0 ? '#00b894' : '#e74c3c';
        roiElement.style.fontWeight = 'bold';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateCapitalHeader('monthly');
    document.querySelectorAll('.period-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const period = this.dataset.period;
            updateCapitalHeader(period);
        });
    });
});

// Agregar función para mostrar el modal de edición
function showEditTradeModal(trade) {
  // Si ya existe un modal, eliminarlo primero
  const oldModal = document.getElementById('trade-details-modal');
  if (oldModal) oldModal.remove();

  // Crear modal con formulario editable
  const modal = document.createElement('div');
  modal.id = 'trade-details-modal';
  modal.className = 'trade-details-modal-bg';
  modal.innerHTML = `
    <div class="trade-details-modal-card">
      <button class="trade-details-close" title="Cerrar">&times;</button>
      <h2>Editar Operación</h2>
      <form id="edit-trade-form" class="trade-details-list">
        <div><strong>Activo:</strong> <input type="text" name="asset" value="${trade.asset}" required></div>
        <div><strong>Dirección:</strong> 
          <select name="direction" required>
            <option value="long" ${trade.direction === 'long' ? 'selected' : ''}>COMPRA</option>
            <option value="short" ${trade.direction === 'short' ? 'selected' : ''}>VENTA</option>
          </select>
        </div>
        <div><strong>Lotes:</strong> <input type="number" step="0.001" name="lots" value="${trade.lots}" required></div>
        <div><strong>Resultado:</strong> <input type="number" step="0.01" name="resultMxn" value="${trade.resultMxn}" required> MXN</div>
        <div><strong>Resultado (Pips):</strong> <input type="number" step="0.001" min="-999.999" max="999.999" name="pips" value="${trade.pips ? trade.pips : ''}" required placeholder="Ej: 25.500 o -12.345"></div>
        <div><strong>Fecha de Apertura:</strong> <input type="datetime-local" name="openTime" value="${trade.openTime}" required></div>
        <div><strong>Fecha de Cierre:</strong> <input type="datetime-local" name="closeTime" value="${trade.closeTime}" required></div>
        <div><strong>Precio de Entrada:</strong> <input type="number" step="0.00001" name="openPrice" value="${trade.openPrice}" required></div>
        <div><strong>Precio de Salida:</strong> <input type="number" step="0.00001" name="closePrice" value="${trade.closePrice}" required></div>
        <div><strong>Estrategia:</strong> 
          <select name="strategy" required>
            <option value="Script CCI" ${trade.strategy === 'Script CCI' ? 'selected' : ''}>Script CCI</option>
            <option value="Script RSI" ${trade.strategy === 'Script RSI' ? 'selected' : ''}>Script RSI</option>
            <option value="Script MACD" ${trade.strategy === 'Script MACD' ? 'selected' : ''}>Script MACD</option>
            <option value="Script AO" ${trade.strategy === 'Script AO' ? 'selected' : ''}>Script AO</option>
            <option value="Script TII" ${trade.strategy === 'Script TII' ? 'selected' : ''}>Script TII</option>
            <option value="Script DeMarker" ${trade.strategy === 'Script DeMarker' ? 'selected' : ''}>Script DeMarker</option>
            <option value="Script Estocastico" ${trade.strategy === 'Script Estocastico' ? 'selected' : ''}>Script Estocastico</option>
            <option value="Script Cruce de MMs" ${trade.strategy === 'Script Cruce de MMs' ? 'selected' : ''}>Script Cruce de MMs</option>
            <option value="Script SAR" ${trade.strategy === 'Script SAR' ? 'selected' : ''}>Script SAR</option>
            <option value="Script BMSB" ${trade.strategy === 'Script BMSB' ? 'selected' : ''}>Script BMSB</option>
            <option value="Script CDM-RSI" ${trade.strategy === 'Script CDM-RSI' ? 'selected' : ''}>Script CDM-RSI</option>
            <option value="Script EMA Grupos" ${trade.strategy === 'Script EMA Grupos' ? 'selected' : ''}>Script EMA Grupos</option>
            <option value="Script FCT" ${trade.strategy === 'Script FCT' ? 'selected' : ''}>Script FCT</option>
            <option value="Señales app" ${trade.strategy === 'Señales app' ? 'selected' : ''}>Señales app</option>
            <option value="Análisis técnico" ${trade.strategy === 'Análisis técnico' ? 'selected' : ''}>Análisis técnico</option>
          </select>
        </div>
        <div style='align-items: flex-start;'><strong>Notas:</strong> <textarea name="notes" class='trade-details-list-notes'>${trade.notes ? trade.notes : ''}</textarea></div>
        <div style="margin-top:18px; text-align:right;">
          <button type="submit" class="btn" style="margin-right:10px;">Guardar</button>
          <button type="button" class="btn clear" id="cancel-edit-trade">Cancelar</button>
        </div>
      </form>
    </div>
  `;

  // Evento de cierre
  modal.querySelector('.trade-details-close').onclick = function() {
    modal.remove();
  };
  modal.querySelector('#cancel-edit-trade').onclick = function() {
    modal.remove();
  };

  // Evento de guardado
  modal.querySelector('#edit-trade-form').onsubmit = function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedTrade = {
      asset: formData.get('asset'),
      direction: formData.get('direction'),
      lots: formData.get('lots'),
      resultMxn: formData.get('resultMxn'),
      pips: formData.get('pips'),
      openTime: formData.get('openTime'),
      closeTime: formData.get('closeTime'),
      openPrice: formData.get('openPrice'),
      closePrice: formData.get('closePrice'),
      strategy: formData.get('strategy'),
      notes: formData.get('notes')
    };
    // Buscar y actualizar el trade en localStorage
    let trades = JSON.parse(localStorage.getItem('trades')) || [];
    const index = trades.findIndex(t => t.openTime === trade.openTime && t.closeTime === trade.closeTime && t.asset === trade.asset && t.resultMxn === trade.resultMxn && t.lots === trade.lots);
    if (index !== -1) {
      trades[index] = updatedTrade;
      localStorage.setItem('trades', JSON.stringify(trades));
      modal.remove();
      renderDiary();
      if (document.getElementById('statsContainer')) renderStats();
      if (typeof loadCardData === 'function') loadCardData();
      if (document.getElementById('tableContainer')) renderTradesTable();
    } else {
      alert('No se pudo encontrar el trade para editar.');
    }
  };

  document.body.appendChild(modal);
}
