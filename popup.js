let showing = false;

document.getElementById('btnToggle').addEventListener('click', async () => {
  showing = !showing;
  document.getElementById('simpleTable').classList.toggle('hidden', !showing);
  document.getElementById('detailTable').classList.toggle('hidden', showing);
  document.getElementById('btnToggle').textContent = showing ? 'Скрыть таблицу' : 'Показать таблицу';
  if (showing) await refreshTables();
});

document.getElementById('btnExport').addEventListener('click', exportCSV);
document.getElementById('btnClear').addEventListener('click', clearData);

async function refreshTables() {
  try {
    const result = await chrome.storage.local.get(['domainData']);
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
      row.insertCell().textContent = Array.isArray(rec.protocols) ? rec.protocols.join(', ') : '';
      row.insertCell().textContent = rec.count;
      row.insertCell().textContent = Array.isArray(rec.extensions) ? rec.extensions.join(', ') : '';
    });
  } catch (error) {
    console.error('Error refreshing tables:', error);
  }
}

async function exportCSV() {
  try {
    const result = await chrome.storage.local.get(['domainData']);
    const data = result.domainData || {};
    const rows = [['FQDN', 'Protocols', 'Count', 'Extensions']];
    Object.entries(data).forEach(([fqdn, rec]) => {
      rows.push([
        fqdn,
        Array.isArray(rec.protocols) ? rec.protocols.join('; ') : '',
        rec.count,
        Array.isArray(rec.extensions) ? rec.extensions.join('; ') : ''
      ]);
    });
    const csvContent = rows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trusted-domains.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Ошибка при экспорте CSV: ' + error.message);
  }
}

async function clearData() {
  try {
    await chrome.storage.local.set({ domainData: {} });
    await refreshTables();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
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

// Добавляем обработчики событий для сортировки в HTML через JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const headers = document.querySelectorAll('#detailTableEl th');
  headers.forEach((header, index) => {
    header.addEventListener('click', () => sortTable(index));
    header.style.cursor = 'pointer';
  });
});
