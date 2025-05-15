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
        </div>
        <div class="trade-row trade-result-row">
          <span class="trade-result ${parseFloat(trade.resultMxn) >= 0 ? 'positive' : 'negative'}">
            ${parseFloat(trade.resultMxn) >= 0 ? '+' : ''}${parseFloat(trade.resultMxn).toFixed(2)} MXN
          </span>
          <button class="btn-details" title="Ver detalles">🔍</button>
          <button class="btn-delete" onclick="deleteTradeById('${trade.openTime}','${trade.closeTime}','${trade.asset}','${trade.resultMxn}','${trade.lots}')" title="Eliminar trade">
            <span class="delete-icon">×</span>
          </button>
        </div>
      `;

      // Evento para mostrar detalles
      tradeCard.querySelector('.btn-details').onclick = function() {
        showTradeDetails(trade);
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

  if (totalTradesElement) totalTradesElement.textContent = total;
  if (winningTradesElement) winningTradesElement.textContent = winningTrades;
  if (losingTradesElement) losingTradesElement.textContent = losingTrades;
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

    // Calcular saldo y ROI del periodo
    let initialCapital = parseFloat(localStorage.getItem('initialCapital') || '0');
    let trades = JSON.parse(localStorage.getItem('trades')) || [];
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
            // Para 'todo el tiempo', usar la fecha más antigua entre el saldo inicial y el primer trade
            let firstTradeDate = trades.length > 0 ? new Date(Math.min(...trades.map(t => new Date(t.openTime).getTime()))) : new Date();
            let capitalStartDate = localStorage.getItem('capitalStartDate');
            if (capitalStartDate) {
                let capDate = new Date(capitalStartDate);
                startDate = capDate < firstTradeDate ? capDate : firstTradeDate;
            } else {
                startDate = firstTradeDate;
            }
    }
    let currentCapital = initialCapital;
    let tradesAfterStart = trades.filter(trade => new Date(trade.openTime) >= startDate)
                                .sort((a, b) => new Date(a.openTime) - new Date(b.openTime));
    tradesAfterStart.forEach(trade => {
        currentCapital += parseFloat(trade.resultMxn);
    });
    const balanceElement = document.getElementById('capital-balance');
    const roiElement = document.getElementById('capital-roi');
    const ganancia = currentCapital - initialCapital;
    const roi = initialCapital > 0 ? (ganancia / initialCapital) * 100 : 0;
    if (balanceElement) {
        balanceElement.textContent = `$${currentCapital.toFixed(2)}`;
        balanceElement.style.color = currentCapital >= initialCapital ? '#2ecc71' : '#e74c3c';
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
    // Renderizar los 3 gráficos al inicio
    renderCapitalChart('monthly');
    renderCapitalChart('yearly');
    renderCapitalChart('all');
    showCapitalChart('monthly');
    updateCapitalHeader('monthly');
    // Botones de período
    document.querySelectorAll('.period-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const period = this.dataset.period;
            showCapitalChart(period);
            updateCapitalHeader(period);
        });
    });
});
