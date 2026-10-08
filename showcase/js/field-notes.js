/**
 * =========================================================================
 * FIELD NOTES & RESEARCH ARCHIVE — SPECULATIVE ARTIFACTS
 * =========================================================================
 * Provides filterable research notes, material observations, and acoustic
 * studies that contextualize the emergence of the READER instrument.
 */

window.FIELD_NOTES = (function () {
  const notesData = [
    {
      category: 'OBSERVATIONS',
      title: 'FN-104: PERCEPTION THRESHOLDS',
      tag: 'OBSERVATION // LAB LOG',
      date: 'EPOCH 04.12',
      snippet:
        'When participants sweep through 440 Hz, recognition does not occur visually first. The body responds to the slight shift in mechanical vibration in the palm before conscious acoustic identification settles.',
      footer: 'FIELD LOG // TEST REF 88'
    },
    {
      category: 'MATERIALS',
      title: 'FN-219: AQUEOUS SEDIMENT RETENTION',
      tag: 'MATERIAL // WATER SUBSTRATE',
      date: 'EPOCH 04.19',
      snippet:
        'Water cannot hold a discrete signal unless suspended around mineral silt. In the Water Field, the message clings to the particulate matter floating between depth strata.',
      footer: 'SAMPLE // BASIN S-01'
    },
    {
      category: 'SOUND',
      title: 'FN-302: THE BURIED VOICE PHENOMENON',
      tag: 'SOUND // SPEECH HARMONICS',
      date: 'EPOCH 05.02',
      snippet:
        'A spoken phrase was recorded through low-pass filters and submerged into ambient hydrostatic drone. It is not foregrounded. The listener must act as a filter to reconstruct the phonemes.',
      footer: 'ACOUSTIC LOG // 120 HZ BAND'
    },
    {
      category: 'FREQUENCY',
      title: 'FN-415: NODAL CROSSOVER (440 HZ / 520 HZ)',
      tag: 'FREQUENCY // RESONANCE',
      date: 'EPOCH 05.18',
      snippet:
        '440 Hz defines the aqueous boundary; 520 Hz aligns with quartz grain shearing. The transition between these bands creates a liminal static crackle resembling dry wind over wet reed beds.',
      footer: 'TELEMETRY STUDY // DAC-04'
    },
    {
      category: 'INTERACTION',
      title: 'FN-527: THE PHYSICALITY OF MENDING',
      tag: 'INTERACTION // PROTOCOL',
      date: 'EPOCH 06.01',
      snippet:
        'Unlike digital error-correction which discards corrupted packets, mending requires deliberate continuous touch. The user sustains the frequency bridge until the signal seals itself.',
      footer: 'TACTILE RESEARCH // HANDHELD'
    },
    {
      category: 'WORLD-BUILDING',
      title: 'FN-608: DACIAN EPHEMERAL KNOWLEDGE',
      tag: 'WORLD-BUILDING // ANTHROPOLOGY',
      date: 'EPOCH 06.14',
      snippet:
        'In the DACian tradition, libraries were not buildings of paper or hard drives; they were designated river bends, silt flats, and stone cairns where signals were periodically re-sung.',
      footer: 'HISTORICAL ARCHIVE // FOLIO 12'
    }
  ];

  function render(filter = 'ALL') {
    const container = document.querySelector('#field-notes-cards-container');
    if (!container) return;

    const filtered =
      filter === 'ALL'
        ? notesData
        : notesData.filter((item) => item.category === filter);

    container.innerHTML = filtered
      .map(
        (note) => `
        <div class="note-card" data-category="${note.category}">
          <div>
            <div class="note-tag">${note.tag}</div>
            <h4 class="note-title">${note.title}</h4>
            <p class="note-snippet">${note.snippet}</p>
          </div>
          <div class="note-footer">
            <span>${note.footer}</span>
            <span>${note.date}</span>
          </div>
        </div>
      `
      )
      .join('');
  }

  function init() {
    render('ALL');

    const filterBar = document.querySelector('#field-notes-filter-bar');
    if (!filterBar) return;

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.note-filter-btn');
      if (!btn) return;

      filterBar.querySelectorAll('.note-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category || 'ALL';
      render(category);
    });
  }

  return { init };
})();
