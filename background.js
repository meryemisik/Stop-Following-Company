async function updateBadge() {
    try {
        const result = await chrome.storage.local.get(['stopFollowingCompany_dailyData']);
        const dailyData = result.stopFollowingCompany_dailyData;

        let dailyCount = 0;
        if (dailyData) {
            const today = new Date().toDateString();
            const parsedData = typeof dailyData === 'string' ? JSON.parse(dailyData) : dailyData;
            if (parsedData && parsedData.date === today) {
                dailyCount = parsedData.count || 0;
            }
        }

        if (dailyCount > 0) {
            chrome.action.setBadgeText({ text: dailyCount.toString() });
            chrome.action.setBadgeBackgroundColor({ color: "#0a66c2" });
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
    } catch (error) {
        console.log('Badge update error:', error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.enable();
  updateBadge(); 
});

chrome.runtime.onStartup.addListener(() => {
  chrome.action.enable();
});chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.startsWith("https://www.linkedin.com/")) {
      chrome.action.enable(tabId);
      updateBadge();
    } else {
      chrome.action.enable(tabId);
      updateBadge();
    }
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "UPDATE_BADGE") {
        updateBadge();
        sendResponse({ success: true });
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.stopFollowingCompany_dailyData || changes.stopFollowingCompany_counter)) {
        updateBadge();
    }
});
