// Очистка при старте (опционально)
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ domainData: {} });
});

// Перехват всех сетевых запросов
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    try {
      const url = new URL(details.url);
      const currentTab = details.tabId;

      // Пропускаем data:, blob:, chrome-extension:
      if (!url.hostname || ['data', 'blob', 'chrome-extension'].includes(url.protocol.replace(':', ''))) return;

      // Получаем информацию о вкладке
      const tab = await chrome.tabs.get(currentTab).catch(() => null);
      if (!tab?.url) return;
      const currentHost = new URL(tab.url).hostname;

      // Игнорируем текущий домен
      if (url.hostname === currentHost) return;

      // Получаем текущие данные
      const result = await chrome.storage.local.get(['domainData']);
      const domainData = result.domainData || {};

      const fqdn = url.hostname;
      const proto = url.protocol.replace(':', '');
      const pathname = url.pathname;
      const ext = pathname.split('.').pop().toLowerCase();
      const extension = (ext && ext.length <= 5 && !ext.includes('/')) ? ext : '';

      if (!domainData[fqdn]) {
        domainData[fqdn] = {
          fqdn: fqdn,
          protocols: [],
          count: 0,
          extensions: []
        };
      }

      const record = domainData[fqdn];
      // Добавляем протокол, если его еще нет
      if (!record.protocols.includes(proto)) {
        record.protocols.push(proto);
      }
      record.count += 1;
      // Добавляем расширение, если его еще нет и оно существует
      if (extension && !record.extensions.includes(extension)) {
        record.extensions.push(extension);
      }

      // Сохраняем обновленные данные
      await chrome.storage.local.set({ domainData });
    } catch (e) {
      console.warn("URL parse error", details.url, e);
    }
  },
  { urls: ["<all_urls>"] },
  []
);
