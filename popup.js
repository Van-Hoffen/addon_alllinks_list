let showing = false;

document.getElementById('btnToggle').addEventListener('click', () => {
  showing = !showing;
  document.getElementById('simpleTable').classList.toggle('hidden', !showing);
  document.getElementById('detailTable').classList.toggle('hidden', showing);
  document.getElementById('btnToggle').textContent = showing ? '👁️ Скрыть таблицу' : '👁️ Показать таблицу';
  if (showing) refreshTables();
});

document.getElementById('btnExport').addEventListener('click', exportCSV);
document.getElementById('btnClear').addEventListener('click', clearData);

function refreshTables() {
  chrome.storage.local.get(['domainData'], (result) => {
    const data = result.domainData || {};

    // Простая таблица
    const simpleBody = document.querySelector('#fqdnTable tbody');
    simpleBody.innerHTML = '';
    Object.keys(data).sort().forEach(fqdn => {
      const row = simpleBody.insertRow();
      row.insertCell().textContent = fqdn;
    });

    // Подробная таблица
    const detailBody = document.querySelector('#detailTableEl tbody');
    detailBody.innerHTML = '';
    Object.entries(data).forEach(([fqdn, rec]) => {
      const row = detailBody.insertRow();
      row.insertCell().textContent = fqdn;
      row.insertCell().textContent = Array.from(rec.protocols).join(', ');
      row.insertCell().textContent = rec.count;
      row.insertCell().textContent = Array.from(rec.extensions).join(', ');
    });
  });
}

function exportCSV() {
  chrome.storage.local.get(['domainData'], (result) => {
    const data = result.domainData || {};
    const rows = [['FQDN']];
    Object.keys(data).sort().forEach(fqdn => rows.push([fqdn]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trusted-domains.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function clearData() {
  chrome.storage.local.set({ domainData: {} }, () => {
    refreshTables();
  });
}

// Сортировка таблицы по столбцу
function sortTable(colIndex) {
  const table = document.getElementById('detailTableEl');
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  const isAsc = table.dataset.sortDir !== 'asc';
  table.dataset.sortDir = isAsc ? 'desc' : 'asc';

  rows.sort((a, b) => {
    let aVal = a.cells[colIndex].textContent;
    let bVal = b.cells[colIndex].textContent;

    // Для чисел (кол-во)
    if (colIndex === 2) {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
      return isAsc ? aVal - bVal : bVal - aVal;
    }
    return isAsc
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

  rows.forEach(row => tbody.appendChild(row));
}
