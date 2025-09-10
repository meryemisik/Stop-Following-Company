(function () {
  function forceUncheck(checkbox) {
    if (!checkbox) return;

    if (checkbox.checked) {
      const label = document.querySelector(`label[for="${checkbox.id}"]`);
      if (label) {
        label.click();
      }

      if (checkbox.checked) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("input", { bubbles: true }));
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

  }

  function tryUncheck() {
    const checkbox = document.querySelector("#follow-company-checkbox");
    if (checkbox) {
      forceUncheck(checkbox);
    }
  }

  const observer = new MutationObserver(() => {
    tryUncheck();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("load", () => {
    setTimeout(tryUncheck, 1000);
  });
})();
