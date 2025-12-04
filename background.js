let domainData = {};

// Очистка при старте (опционально)
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ domainData: {} });
});

// Перехват всех сетевых запросов
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const url = new URL(details.url);
      const currentTab = details.tabId;

      // Пропускаем data:, blob:, chrome-extension:
      if (!url.hostname || ['data', 'blob', 'chrome-extension'].includes(url.protocol.replace(':', ''))) return;

      chrome.tabs.get(currentTab, (tab) => {
        if (!tab?.url) return;
        const currentHost = new URL(tab.url).hostname;

        // Игнорируем текущий домен (включая поддомены, если нужно — уточните)
        if (url.hostname === currentHost) return;

        const fqdn = url.hostname;
        const proto = url.protocol.replace(':', '');
        const pathname = url.pathname;
        const ext = pathname.split('.').pop().toLowerCase();
        const extension = (ext && ext.length <= 5 && !ext.includes('/')) ? ext : '';

        if (!domainData[fqdn]) {
          domainData[fqdn] = {
            fqdn: fqdn,
            protocols: new Set(),
            count: 0,
            extensions: new Set()
          };
        }

        const record = domainData[fqdn];
        record.protocols.add(proto);
        record.count += 1;
        if (extension) record.extensions.add(extension);
      });
    } catch (e) {
      console.warn("URL parse error", details.url, e);
    }
  },
  { urls: ["<all_urls>"] },
  []
);
