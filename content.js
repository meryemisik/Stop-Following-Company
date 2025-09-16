(function () {
  window.stopFollowingCompany_loaded = true;

  const getLang = () => {
    const userLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    if (userLang.startsWith("tr")) return "tr";
    return "en";
  }

  const lang = getLang();

  let messages;
  if (typeof window.messages !== 'undefined') {
    messages = window.messages;
  } else {
    messages = {
      tr: {
        lastCompany: ["🎯 <COMPANY> takip edilmedi!"],
        totalCount: ["🚀 Toplam <COUNT> şirket takip edilmedi!"],
        dailyCount: ["⚡ Bugün <COUNT> şirket takip edilmedi!"]
      },
      en: {
        lastCompany: ["🎯 <COMPANY> not followed!"],
        totalCount: ["🚀 Total <COUNT> companies not followed!"],
        dailyCount: ["⚡ <COUNT> companies not followed today!"]
      }
    };
  }

  const t = messages[lang].ui || {};
  const getText = (key, defaultText) => t[key] || defaultText;

  function isThreshold(count, dailyCount) {

    const milestones = [5, 10, 25, 50, 100, 250];

    const dailyMilestones = [7, 15, 30, 60, 90];

    if (dailyMilestones.includes(dailyCount)) {
      return { type: 'daily', value: dailyCount };
    }

    if (milestones.includes(count)) {
      return { type: 'total', value: count };
    }

    if (count > 250) {
      const lastMilestone = getLastMilestone(count);
      const sinceLastMilestone = count - lastMilestone;

      const randomInterval = getRandomInterval();

      if (sinceLastMilestone >= randomInterval) {
        setLastMilestone(count);
        generateNewRandomInterval();
        return { type: 'total', value: count };
      }
    }

    return false;
  }

  function getLastMilestone(currentCount) {
    try {
      return parseInt(localStorage.getItem("stopFollowingCompany_lastMilestone") || "250", 10);
    } catch {
      return 250;
    }
  }

  function setLastMilestone(count) {
    try {
      localStorage.setItem("stopFollowingCompany_lastMilestone", count.toString());
    } catch (e) {
    }
  }

  function getRandomInterval() {
    try {
      const stored = localStorage.getItem("stopFollowingCompany_randomInterval");
      if (stored) {
        return parseInt(stored, 10);
      }
    } catch (e) { }

    const newInterval = Math.floor(Math.random() * 51) + 50; // 50-100 arası
    try {
      localStorage.setItem("stopFollowingCompany_randomInterval", newInterval.toString());
    } catch (e) { }
    return newInterval;
  }

  function generateNewRandomInterval() {
    const newInterval = Math.floor(Math.random() * 51) + 50; // 50-100 arası
    try {
      localStorage.setItem("stopFollowingCompany_randomInterval", newInterval.toString());
    } catch (e) {
    }
  }

  function updateDailyCount() {
    const today = new Date().toDateString();
    try {
      const stored = localStorage.getItem("stopFollowingCompany_dailyData");
      let dailyData = { date: today, count: 0 };

      if (stored) {
        const existing = JSON.parse(stored);
        if (existing.date === today) {
          dailyData.count = (existing.count || 0) + 1;
        } else {
          dailyData.count = 1;
        }
      } else {
        dailyData.count = 1;
      }

      localStorage.setItem("stopFollowingCompany_dailyData", JSON.stringify(dailyData));

      try {
        chrome.storage.local.set({ stopFollowingCompany_dailyData: dailyData });
      } catch (e) {
        console.log('Chrome storage dailyData set error:', e);
      }

      return dailyData.count;
    } catch (e) {
      return 1;
    }
  }

  function getRandomMessage(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      tryUncheck();
      checkAndUncheck(); 
    }, 1000);
  });

  function incrementCounter(companyName, callback) {
    try {
      chrome.storage.local.get(["stopFollowingCompany_counter", "stopFollowingCompany_companies"], (result) => {
        let count = result.stopFollowingCompany_counter || 0;
        let companies = result.stopFollowingCompany_companies || [];

        count++;
        const dailyCount = updateDailyCount();

        if (companyName) {
          const now = new Date();
          const timestamp = now.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          companies.push({
            name: companyName,
            date: timestamp,
            timestamp: now.getTime()
          });
        }

        chrome.storage.local.set({ stopFollowingCompany_counter: count, stopFollowingCompany_companies: companies }, () => {
          chrome.runtime.sendMessage({ type: "UPDATE_BADGE" });
          if (callback) callback(count, companies, dailyCount);
        });
      });
    } catch (e) {
      let count = parseInt(localStorage.getItem("stopFollowingCompany_counter") || "0", 10);
      let companies = JSON.parse(localStorage.getItem("stopFollowingCompany_companies") || "[]");

      count++;
      const dailyCount = updateDailyCount();

      if (companyName) {
        const now = new Date();
        const timestamp = now.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        companies.push({
          name: companyName,
          date: timestamp,
          timestamp: now.getTime()
        });
      }

      localStorage.setItem("stopFollowingCompany_counter", count);
      localStorage.setItem("stopFollowingCompany_companies", JSON.stringify(companies));
      if (callback) callback(count, companies, dailyCount);
    }
  }

  function showToast(message, isHtml = false) {
    const oldToast = document.getElementById("stop-follow-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.id = "stop-follow-toast";
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0a66c2;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      max-width: 320px;
      max-height: 400px;
      overflow-y: auto;
      white-space: pre-wrap;
      cursor: pointer;
      transition: transform 0.2s ease;
    `;

    if (isHtml) toast.innerHTML = message;
    else toast.innerText = message;

    document.body.appendChild(toast);

    let timeoutId;
    let remainingTime = 5000;
    let startTime = Date.now();

    const startTimer = () => {
      startTime = Date.now();
      timeoutId = setTimeout(() => {
        toast.remove();
      }, remainingTime);
    };

    const pauseTimer = () => {
      clearTimeout(timeoutId);
      remainingTime -= Date.now() - startTime;
      if (remainingTime < 0) remainingTime = 0;
    };

    toast.addEventListener('mouseenter', () => {
      pauseTimer();
      toast.style.transform = 'scale(1.02)';
    });

    toast.addEventListener('mouseleave', () => {
      toast.style.transform = 'scale(1)';
      if (remainingTime > 0) {
        startTimer();
      } else {
        toast.remove();
      }
    });

    startTimer();
  }

  function showCompaniesModal(companies) {
    const oldModal = document.getElementById("stop-follow-companies-modal");
    if (oldModal) oldModal.remove();

    const sortedCompanies = companies.sort((a, b) => {
      const aTimestamp = typeof a === 'object' && a.timestamp ? a.timestamp : 0;
      const bTimestamp = typeof b === 'object' && b.timestamp ? b.timestamp : 0;
      return bTimestamp - aTimestamp; // Ters sıralama (yeni -> eski)
    });

    let currentPage = 0;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(sortedCompanies.length / itemsPerPage);

    const modal = document.createElement("div");
    modal.id = "stop-follow-companies-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000000;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(5px);
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 0;
      max-width: 600px;
      max-height: 80vh;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      background: #0a66c2;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; font-size: 18px; font-weight: 600;">
        ${getText('modalTitle', lang === "tr" ? "🎯 Takip Edilmeyen Şirketler" : "🎯 Companies Not Followed")}
      </h3>
      <button id="close-companies-modal" style="
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">×</button>
    `;

    const content = document.createElement("div");
    content.id = "companies-content";
    content.style.cssText = `
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const footer = document.createElement("div");
    footer.style.cssText = `
      background: #f8f9fa;
      padding: 16px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    function updateContent() {
      if (sortedCompanies.length === 0) {
        content.innerHTML = `
          <div style="text-align: center; color: #666; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
            <p style="margin: 0; font-size: 16px;">
              ${lang === "tr" ? "Henüz hiçbir şirketin zorunlu takibi engellenmedi." : "No companies have been skipped yet."}
            </p>
          </div>
        `;
        footer.innerHTML = `
          <div></div>
          <button id="close-companies-modal-btn" style="
            background: #0a66c2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
          " onmouseover="this.style.background='#004182'" onmouseout="this.style.background='#0a66c2'">
            ${lang === "tr" ? "Kapat" : "Close"}
          </button>
        `;
      } else {
        const start = currentPage * itemsPerPage;
        const end = Math.min(start + itemsPerPage, sortedCompanies.length);
        const currentItems = sortedCompanies.slice(start, end);

        const companyList = currentItems.map((company, index) => {
          const displayName = typeof company === 'string' ? company : company.name;
          const displayDate = typeof company === 'string' ? '' : company.date;

          return `
            <div style="
              padding: 12px 0;
              border-bottom: ${index < currentItems.length - 1 ? '1px solid #eee' : 'none'};
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <div style="flex: 1;">
                <div style="font-weight: 500; color: #333; font-size: 15px;">${displayName}</div>
                ${displayDate ? `<div style="color: #666; font-size: 13px; margin-top: 4px;">${displayDate}</div>` : ''}
              </div>
              <div style="color: #0a66c2; font-size: 18px;">✓</div>
            </div>
          `;
        }).join('');

        content.innerHTML = `
          <div style="margin-bottom: 16px; color: #666; font-size: 14px; display: flex; justify-content: space-between; align-items: center;">
            <span>
              ${lang === "tr" ?
            `Toplam ${sortedCompanies.length} şirket takip edilmedi` :
            `Total ${sortedCompanies.length} companies not followed`
          }
            </span>
            <span style="font-size: 12px;">
              ${lang === "tr" ?
            `${start + 1}-${end} arası gösteriliyor` :
            `Showing ${start + 1}-${end}`
          }
            </span>
          </div>
          ${companyList}
        `;

        const prevDisabled = currentPage === 0;
        const nextDisabled = currentPage >= totalPages - 1;

        footer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <button id="prev-page" ${prevDisabled ? 'disabled' : ''} style="
              background: ${prevDisabled ? '#ccc' : '#0a66c2'};
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: ${prevDisabled ? 'not-allowed' : 'pointer'};
              font-size: 12px;
              transition: background 0.2s;
            ">${lang === "tr" ? "◀ Önceki" : "◀ Previous"}</button>
            
            <span style="color: #666; font-size: 14px;">
              ${currentPage + 1} / ${totalPages}
            </span>
            
            <button id="next-page" ${nextDisabled ? 'disabled' : ''} style="
              background: ${nextDisabled ? '#ccc' : '#0a66c2'};
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: ${nextDisabled ? 'not-allowed' : 'pointer'};
              font-size: 12px;
              transition: background 0.2s;
            ">${lang === "tr" ? "Sonraki ▶" : "Next ▶"}</button>
          </div>
          
          <button id="close-companies-modal-btn" style="
            background: #0a66c2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
          " onmouseover="this.style.background='#004182'" onmouseout="this.style.background='#0a66c2'">
            ${lang === "tr" ? "Kapat" : "Close"}
          </button>
        `;
      }

      setTimeout(() => {
        document.getElementById("prev-page")?.addEventListener("click", () => {
          if (currentPage > 0) {
            currentPage--;
            updateContent();
          }
        });

        document.getElementById("next-page")?.addEventListener("click", () => {
          if (currentPage < totalPages - 1) {
            currentPage++;
            updateContent();
          }
        });

        document.getElementById("close-companies-modal-btn")?.addEventListener("click", closeModal);
      }, 0);
    }

    modalContent.appendChild(header);
    modalContent.appendChild(content);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);

    const closeModal = () => modal.remove();

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", function escListener(e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escListener);
      }
    });

    document.body.appendChild(modal);
    updateContent();

    setTimeout(() => {
      document.getElementById("close-companies-modal")?.addEventListener("click", closeModal);
    }, 0);
  }

  function tryUncheck() {
    const checkbox = document.querySelector("#follow-company-checkbox");
    if (checkbox) {
      if (!checkbox.dataset.listenerAttached) {
        checkbox.addEventListener("change", (e) => {
          if (e.isTrusted && !checkbox.dataset.byExtension)
            checkbox.dataset.modifiedByUser = "true";
        });
        checkbox.dataset.listenerAttached = "true";
      }
      forceUncheck(checkbox);
    }
  }

  function checkAndUncheck() {
    const checkbox = document.querySelector("#follow-company-checkbox");
    if (checkbox && checkbox.checked) {
      forceUncheck(checkbox);
    }
  }

  setInterval(checkAndUncheck, 500);

  function forceUncheck(checkbox) {
    if (!checkbox) return;
    checkbox.dataset.byExtension = "true";
    if (checkbox.checked) {
      const label = document.querySelector(`label[for="${checkbox.id}"]`);
      if (label) label.click();
      if (checkbox.checked) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("input", { bubbles: true }));
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    checkbox.dataset.modifiedByExtension = "true";
    setTimeout(() => delete checkbox.dataset.byExtension, 0);
  }

  function handleApplyClick() {
    const checkbox = document.querySelector("#follow-company-checkbox");
    if (checkbox && !checkbox.checked) {
      const companyName =
        document.querySelector('label[for="follow-company-checkbox"] span.t-bold.t-black')?.innerText ||
        "Bilinmeyen Şirket";

      incrementCounter(companyName, (newCount, companies, dailyCount) => {
        const lastMsg = getRandomMessage(messages[lang].lastCompany).replace("<COMPANY>", companyName);

        let totalMsg = "";
        let dailyMsg = "";

        const thresholdResult = isThreshold(newCount, dailyCount);

        if (thresholdResult) {
          if (thresholdResult.type === 'total') {
            totalMsg = "<br>" + getRandomMessage(messages[lang].totalCount).replace("<COUNT>", thresholdResult.value);
          } else if (thresholdResult.type === 'daily') {
            dailyMsg = "<br>" + getRandomMessage(messages[lang].dailyCount).replace("<COUNT>", thresholdResult.value);
          }
        }

        let message = lastMsg;
        if (totalMsg) {
          message += totalMsg;
          message += '<br><a href="#" id="showCompanies" style="color:#fff;text-decoration:underline;">Tümünü Gör</a>';
        } else if (dailyMsg) {
          message += dailyMsg;
          message += '<br><a href="#" id="showCompanies" style="color:#fff;text-decoration:underline;">Tümünü Gör</a>';
        }

        showToast(message, true);

        setTimeout(() => {
          const showLink = document.getElementById("showCompanies");
          if (showLink) {
            showLink.addEventListener("click", (e) => {
              e.preventDefault();
              try {
                chrome.storage.local.get(["stopFollowingCompany_companies"], (result) => {
                  let companies = result.stopFollowingCompany_companies || [];
                  if (!companies.length) companies = JSON.parse(localStorage.getItem("stopFollowingCompany_companies") || "[]");
                  showCompaniesModal(companies);
                });
              } catch {
                const companies = JSON.parse(localStorage.getItem("stopFollowingCompany_companies") || "[]");
                showCompaniesModal(companies);
              }
            });
          }
        }, 50);
      });
    }
  }

  document.addEventListener("click", (e) => {
    const applyBtn = e.target.closest('button[data-live-test-easy-apply-submit-button]');
    if (applyBtn) {
      handleApplyClick();
    }
  });

  const observer = new MutationObserver(() => {
    tryUncheck();
    checkAndUncheck();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const modalObserver = new MutationObserver(() => {
    const applyBtn = document.querySelector('button[data-live-test-easy-apply-submit-button]');
    if (applyBtn && !applyBtn.dataset.detectedByExtension) {
      applyBtn.dataset.detectedByExtension = "true";
      const checkbox = document.querySelector("#follow-company-checkbox");
    }
    checkAndUncheck(); 
  });
  modalObserver.observe(document.body, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showCompaniesModal') {
      try {
        chrome.storage.local.get(["stopFollowingCompany_companies"], (result) => {
          let companies = result.stopFollowingCompany_companies || [];
          if (!companies.length) {
            companies = JSON.parse(localStorage.getItem("stopFollowingCompany_companies") || "[]");
          }
          showCompaniesModal(companies);
        });
      } catch {
        const companies = JSON.parse(localStorage.getItem("stopFollowingCompany_companies") || "[]");
        showCompaniesModal(companies);
      }
      sendResponse({ success: true });
    }
    else if (request.action === 'getStats') {
      try {
        chrome.storage.local.get([
          "stopFollowingCompany_counter",
          "stopFollowingCompany_companies",
          "stopFollowingCompany_dailyData"
        ], (result) => {
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

          sendResponse({
            success: true,
            data: {
              totalCount: totalCount,
              dailyCount: dailyCount,
              companiesLength: companies.length
            }
          });
        });
      } catch (error) {
        try {
          const totalCount = parseInt(localStorage.getItem("stopFollowingCompany_counter") || "0", 10);
          const companies = JSON.parse(localStorage.getItem("stopFollowingCompany_companies") || "[]");
          const dailyData = localStorage.getItem("stopFollowingCompany_dailyData");

          let dailyCount = 0;
          if (dailyData) {
            const today = new Date().toDateString();
            const parsedData = JSON.parse(dailyData);
            if (parsedData && parsedData.date === today) {
              dailyCount = parsedData.count || 0;
            }
          }

          sendResponse({
            success: true,
            data: {
              totalCount: totalCount,
              dailyCount: dailyCount,
              companiesLength: companies.length
            }
          });
        } catch (fallbackError) {
          sendResponse({ success: false, error: fallbackError.message });
        }
      }

      return true; 
    }
    else if (request.action === 'clearLocalStorage') {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('stopFollowingCompany_')) {
            localStorage.removeItem(key);
          }
        });
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    }
  });

})();
