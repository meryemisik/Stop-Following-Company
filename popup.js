document.addEventListener('DOMContentLoaded', async () => {
    const getLang = () => {
        const userLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
        if (userLang.startsWith("tr")) return "tr";
        return "en";
    };

    const lang = getLang();
    const messages = window.messages || {};
    const t = messages[lang]?.ui || {};
    const getText = (key, defaultTr, defaultEn) => {
        if (t[key]) return t[key];
        return lang === 'tr' ? defaultTr : defaultEn;
    };

    const totalCountEl = document.getElementById('totalCount');
    const dailyCountEl = document.getElementById('dailyCount');
    const companyCountEl = document.getElementById('companyCount');
    const viewCompaniesBtn = document.getElementById('viewCompanies');
    const resetStatsBtn = document.getElementById('resetStats');
    const goToLinkedInBtn = document.getElementById('goToLinkedIn');

    async function loadStats() {

        try {
            const result = await chrome.storage.local.get([
                'stopFollowingCompany_counter',
                'stopFollowingCompany_companies',
                'stopFollowingCompany_dailyData'
            ]);


            const totalCount = result.stopFollowingCompany_counter || 0;
            const companies = result.stopFollowingCompany_companies || [];


            let dailyCount = 0;
            const dailyData = result.stopFollowingCompany_dailyData;
            if (dailyData) {
                const today = new Date().toDateString();
                const parsedData = typeof dailyData === 'string' ? JSON.parse(dailyData) : dailyData;
                if (parsedData && parsedData.date === today) {
                    dailyCount = parsedData.count || 0;
                }
            }

            totalCountEl.textContent = totalCount.toString();
            dailyCountEl.textContent = dailyCount.toString();
            companyCountEl.textContent = companies.length.toString();


        } catch (error) {

            totalCountEl.textContent = '0';
            dailyCountEl.textContent = '0';
            companyCountEl.textContent = '0';
        }
    }

    viewCompaniesBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab.url.includes('linkedin.com')) {
                chrome.tabs.sendMessage(tab.id, { action: 'showCompaniesModal' });
                window.close(); // Popup'ı kapat
            } else {
                chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
                window.close();
            }
        } catch (error) {
            console.error('Error showing companies:', error);
            chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
            window.close();
        }
    });

    goToLinkedInBtn.addEventListener('click', async () => {
        try {
            const linkedInTabs = await chrome.tabs.query({ url: "*://www.linkedin.com/*" });

            if (linkedInTabs.length > 0) {
                const linkedInTab = linkedInTabs[0];
                await chrome.tabs.update(linkedInTab.id, { active: true });
                await chrome.windows.update(linkedInTab.windowId, { focused: true });
            } else {
                chrome.tabs.create({ url: 'https://www.linkedin.com/feed/' });
            }
            window.close();
        } catch (error) {
            console.error('Error going to LinkedIn:', error);
            chrome.tabs.create({ url: 'https://www.linkedin.com/feed/' });
            window.close();
        }
    });

    resetStatsBtn.addEventListener('click', async () => {
        const confirmed = confirm(getText('resetConfirm', 'Tüm istatistikler ve şirket listesi silinecek. Emin misiniz?', 'All statistics and company list will be deleted. Are you sure?'));
        if (confirmed) {
            try {
                await chrome.storage.local.clear();

                const keysToRemove = ['stopFollowingCompany_counter', 'stopFollowingCompany_companies', 'stopFollowingCompany_dailyData', 'stopFollowingCompany_lastMilestone', 'stopFollowingCompany_randomInterval'];
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });

                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tab.url && tab.url.includes('linkedin.com')) {
                        chrome.tabs.sendMessage(tab.id, { action: 'clearLocalStorage' });
                    }
                } catch (e) {
                    console.log('Could not send clear message to content script:', e);
                }

                totalCountEl.textContent = '0';
                dailyCountEl.textContent = '0';
                companyCountEl.textContent = '0';

                resetStatsBtn.textContent = getText('resetSuccess', '✅ Temizlendi!', '✅ Cleared!');
                resetStatsBtn.style.background = 'rgba(74, 222, 128, 0.3)';

                setTimeout(() => {
                    resetStatsBtn.innerHTML = '<span class="emoji">🔄</span> İstatistikleri Sıfırla';
                    resetStatsBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                }, 2000);

            } catch (error) {
                console.error('Error resetting stats:', error);
                alert('Temizleme sırasında bir hata oluştu.');
            }
        }
    });

    async function debugStorage() {

        try {
            const allStorage = await chrome.storage.local.get(null);

            const specificKeys = await chrome.storage.local.get([
                'stopFollowingCompany_counter',
                'stopFollowingCompany_companies',
                'stopFollowingCompany_dailyData'
            ]);

        } catch (error) {
            console.error('Chrome Storage debug error:', error);
        }

    }

    function updateUITexts() {
        document.querySelector('.header h1').textContent = getText('title', '🎯 Stop Following Company', '🎯 Stop Following Company');
        document.querySelector('.header p').textContent = getText('subtitle', 'LinkedIn otomatik takip engelleyici', 'LinkedIn automatic follow blocker');

        const totalLabel = document.querySelector('.stat-label');
        if (totalLabel) totalLabel.textContent = getText('totalBlocked', '🚀 Toplam engellenen', '🚀 Total blocked');

        const dailyLabel = document.querySelector('.daily-stat');
        if (dailyLabel) dailyLabel.textContent = getText('dailyBlocked', '⚡ Bugün engellenen', '⚡ Blocked today');

        const viewBtn = document.getElementById('viewCompanies');
        if (viewBtn) viewBtn.innerHTML = `<span class="emoji">📋</span> ${getText('viewCompanies', 'Şirket Listesini Gör', 'View Company List')}`;

        const goToLinkedInBtn = document.getElementById('goToLinkedIn');
        if (goToLinkedInBtn) goToLinkedInBtn.innerHTML = `<span class="emoji">🔗</span> ${getText('goToLinkedIn', 'LinkedIn\'e Git', 'Go to LinkedIn')}`;

        const resetBtn = document.getElementById('resetStats');
        if (resetBtn) resetBtn.innerHTML = `<span class="emoji">🔄</span> ${getText('resetStats', 'İstatistikleri Sıfırla', 'Reset Statistics')}`;

        const statusSpan = document.querySelector('.status-indicator span');
        if (statusSpan) statusSpan.textContent = getText('extensionActive', 'Extension aktif ve çalışıyor', 'Extension active and working');

        const versionEl = document.querySelector('.version');
        if (versionEl) {
            const version = chrome.runtime.getManifest().version;
            versionEl.textContent = `v${version} - Developed with ❤️`;
        }
    }

    async function checkActiveTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const isLinkedIn = tab.url && tab.url.includes('linkedin.com');

            if (isLinkedIn) {
                viewCompaniesBtn.style.display = 'block';
                goToLinkedInBtn.style.display = 'none';
                resetStatsBtn.style.display = 'block';
            } else {
                viewCompaniesBtn.style.display = 'none';
                goToLinkedInBtn.style.display = 'block';
                resetStatsBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking active tab:', error);
            viewCompaniesBtn.style.display = 'block';
            goToLinkedInBtn.style.display = 'block';
            resetStatsBtn.style.display = 'block';
        }
    }

    updateUITexts();

    await checkActiveTab();

    await debugStorage();

    await loadStats();

    setInterval(loadStats, 5000);
});
