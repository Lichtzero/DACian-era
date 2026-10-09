/**
 * =========================================================================
 * FIELD CHECKLIST ENGINE — VERIFICATION & SYSTEM READINESS
 * =========================================================================
 * Manages the interactive checklist for pre-deployment preparation.
 * State is stored in localStorage so returning researchers keep their state.
 */

window.FIELD_CHECKLIST = (function () {
  const STORAGE_KEY = 'reader_archive_checklist';

  const defaultItems = [
    { id: 'check-receiver', label: 'FIELD RECEIVER open on laptop display', required: true, checked: false },
    { id: 'check-reader', label: 'READER open on handheld smartphone', required: true, checked: false },
    { id: 'check-vibe', label: 'Phone vibration & haptics enabled', required: true, checked: false },
    { id: 'check-audio', label: 'Audio volume enabled & audible', required: true, checked: false },
    { id: 'check-network', label: 'Both devices linked to same network / server', required: true, checked: false },
    { id: 'check-field', label: 'Environmental FIELD (Water / Sand) selected', required: true, checked: false }
  ];

  let items = [...defaultItems];

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        items.forEach((item) => {
          if (parsed[item.id] !== undefined) {
            item.checked = parsed[item.id];
          }
        });
      }
    } catch (e) {
      console.warn('Could not read checklist localStorage', e);
    }
  }

  function saveState() {
    try {
      const stateObj = {};
      items.forEach((item) => {
        stateObj[item.id] = item.checked;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
    } catch (e) {
      console.warn('Could not save checklist localStorage', e);
    }
  }

  function render() {
    const listContainer = document.querySelector('#interactive-checklist-items');
    const statusBadge = document.querySelector('#checklist-status-badge');
    if (!listContainer) return;

    listContainer.innerHTML = items
      .map(
        (item) => `
        <div class="checklist-item ${item.checked ? 'checked' : ''}" data-id="${item.id}">
          <div class="checklist-box">${item.checked ? '✓' : ''}</div>
          <span>${item.label}</span>
        </div>
      `
      )
      .join('');

    const checkedCount = items.filter((i) => i.checked).length;
    const totalCount = items.length;

    if (statusBadge) {
      if (checkedCount === totalCount) {
        statusBadge.textContent = `SYSTEMS VERIFIED (${checkedCount}/${totalCount}) // READY FOR FIELD`;
        statusBadge.className = 'archival-badge active';
      } else {
        statusBadge.textContent = `PREPARATION: ${checkedCount}/${totalCount} VERIFIED`;
        statusBadge.className = 'archival-badge';
      }
    }
  }

  function init() {
    loadState();
    render();

    const listContainer = document.querySelector('#interactive-checklist-items');
    if (!listContainer) return;

    listContainer.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.checklist-item');
      if (!itemEl) return;

      const id = itemEl.dataset.id;
      const target = items.find((i) => i.id === id);
      if (target) {
        target.checked = !target.checked;
        saveState();
        render();
      }
    });

    const resetBtn = document.querySelector('#checklist-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        items.forEach((i) => (i.checked = false));
        saveState();
        render();
      });
    }
  }

  return { init };
})();
