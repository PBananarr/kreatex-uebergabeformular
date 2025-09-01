(function () {
  const sections = Array.isArray(window.form_sections) ? window.form_sections : [];
  const root = document.getElementById('sections-root');
  const form = document.getElementById('abnahme-form');
  const out = document.getElementById('submitted');

  // ---------- Hilfen ----------
  const el = (tag, cls) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  };

  const addLabelInput = (wrap, label, name, type = 'text', preset, options) => {
    const row = el('div', 'form-group');
    const l = el('label');
    l.textContent = label;
    row.appendChild(l);

    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
    } else if (type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      if (preset === true) input.checked = true;
      input.style.width = 'auto';
    } else if (type === 'select') {
      input = document.createElement('select');
      (options || []).forEach(opt => {
        const o = document.createElement('option');
        // unterstützt ["A","B"] und [{ value, label }]
        o.value = String(opt?.value ?? opt);
        o.textContent = String(opt?.label ?? opt);
        input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.type = type || 'text';
    }

    input.name = name;
    row.appendChild(input);
    wrap.appendChild(row);
  };

  const makeAddFieldUI = (section, idx) => {
    if (!section.options) return null;

    const wrap = el('div', 'field-selector');
    const sel = document.createElement('select');
    sel.id = `select-${idx}`;
    sel.dataset.sectionTitle = section.title || '';

    const def = document.createElement('option');
    def.value = '';
    def.textContent = '-- Feld auswählen --';
    sel.appendChild(def);

    section.options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.name;
      opt.textContent = o.label;
      opt.dataset.type = o.type || 'text';
      if (o.subfields) opt.dataset.subfields = JSON.stringify(o.subfields);
      if (o.fields) opt.dataset.fields = JSON.stringify(o.fields);
      sel.appendChild(opt);
    });

    const addBtn = el('button', 'add-btn');
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.dataset.section = String(idx);

    wrap.appendChild(sel);
    wrap.appendChild(addBtn);

    return { ui: wrap, select: sel, addBtn };
  };

  // ---------- Rendering ----------
  sections.forEach((section, i) => {
    const h2 = document.createElement('h2');
    h2.textContent = section.title || '';
    root.appendChild(h2);

    // Feste Felder
    if (Array.isArray(section.fields)) {
      section.fields.forEach(f =>
        addLabelInput(root, f.label, f.name, f.type, f.checked, f.options)
      );
    }

    // Dynamische Optionen
    if (Array.isArray(section.options) && section.options.length) {
      const { ui, select, addBtn } = makeAddFieldUI(section, i) || {};
      const container = el('div');
      container.id = `fields-container-${i}`;

      if (ui) root.appendChild(ui);
      root.appendChild(container);

      if (addBtn) {
        addBtn.addEventListener('click', () => {
          const optEl = select.selectedOptions[0];
          if (!optEl || !optEl.value) return;

          const sectionTitle = (select.dataset.sectionTitle || '').trim();
          const type = optEl.dataset.type;
          const label = optEl.textContent;
          const subfields = optEl.dataset.subfields ? JSON.parse(optEl.dataset.subfields) : [];

          // --- Spezial: Weitere Räume ---
          if (sectionTitle === 'Weitere Räume') {
            const card = el('div', 'field-item');
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';

            const head = el('div');
            head.style.display = 'flex';
            head.style.alignItems = 'center';
            head.style.gap = '10px';

            const strong = document.createElement('strong');
            strong.textContent = label;

            const removeRoomBtn = el('button', 'remove-btn');
            removeRoomBtn.type = 'button';
            removeRoomBtn.textContent = 'Entfernen';
            removeRoomBtn.addEventListener('click', () => card.remove());

            head.appendChild(strong);
            head.appendChild(removeRoomBtn);
            card.appendChild(head);

            // Die 3 Felder aus option.fields rendern
            const fields = Array.isArray(subfields) && subfields.length && subfields[0]?.label
              ? subfields
              : (optEl.dataset.fields ? JSON.parse(optEl.dataset.fields) : []);

            let optionObj = null;
            if (!fields.length && Array.isArray(section.options)) {
              optionObj = section.options.find(o => o.name === optEl.value || o.label === label);
            }
            const finalFields = fields.length ? fields : (optionObj?.fields || []);

            finalFields.forEach(f => {
              addLabelInput(card, f.label, f.name, f.type, f.checked, f.options);
            });

            container.appendChild(card);
            select.value = '';
            return;
          }

          // --- Standard: Gruppe mit Subfeldern oder Einzel-Feld ---
          if (type === 'multi' && Array.isArray(subfields) && subfields.length) {
            const wrap = el('div', 'field-item');
            const strong = document.createElement('strong');
            strong.textContent = label;
            wrap.appendChild(strong);

            subfields.forEach(sf => {
              const lab = document.createElement('label');
              lab.textContent = sf.label;
              wrap.appendChild(lab);

              let input;
              if (sf.type === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
                if (sf.checked) input.checked = true;
                input.style.width = 'auto';
              } else if (sf.type === 'textarea') {
                input = document.createElement('textarea');
              } else {
                input = document.createElement('input');
                input.type = sf.type || 'text';
              }
              input.name = sf.name;
              wrap.appendChild(input);
            });

            const rm = el('button', 'remove-btn');
            rm.type = 'button';
            rm.textContent = 'Entfernen';
            rm.addEventListener('click', () => wrap.remove());
            wrap.appendChild(rm);

            container.appendChild(wrap);
          } else {
            const row = el('div', 'field-item');
            const lab = document.createElement('label');
            lab.textContent = label;
            row.appendChild(lab);

            const input = document.createElement('input');
            input.name = optEl.value;
            input.type = type || 'text';
            row.appendChild(input);

            const rm = el('button', 'remove-btn');
            rm.type = 'button';
            rm.textContent = 'Entfernen';
            rm.addEventListener('click', () => row.remove());
            row.appendChild(rm);

            container.appendChild(row);
          }

          select.value = '';
        });
      }
    }
  });

  // ---------- Dynamik "ohne Beanstandungen" (Ja/Nein) ----------
  (function setupOhneBeanstandungen() {
    const select = form.querySelector('select[name="ohne_beanstandungen"]');
    if (!select) return;

    // Dynamisches Feld bei Auswahl "Nein"
    const selectRow = select.closest('.form-group');

    const ensureMaengelTextarea = () => {
      let wrap = form.querySelector('#maengel_dynamic_wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'maengel_dynamic_wrap';
        wrap.className = 'form-group';
        // Label
        const lab = document.createElement('label');
        lab.textContent = 'Die Wohnung weist folgende Mängel auf:';
        wrap.appendChild(lab);
        // Textarea
        const ta = document.createElement('textarea');
        ta.name = 'maengel_liste';
        wrap.appendChild(ta);

        // NACH der Select-Zeile einsetzen
        selectRow.parentNode.insertBefore(wrap, selectRow.nextSibling);
      }
    };

    const removeMaengelTextarea = () => {
      const wrap = form.querySelector('#maengel_dynamic_wrap');
      if (wrap) wrap.remove();
    };

    const onChange = () => {
      if (select.value === 'Nein') {
        ensureMaengelTextarea();
      } else {
        removeMaengelTextarea();
      }
    };

    select.addEventListener('change', onChange);

    // Initialzustand
    onChange();
  })();

    // ---------- Dynamik "Kaution -> Ratenzahlung" ----------
  (function setupKautionRatenzahlung() {
    const select = form.querySelector('select[name="kaution_bezahlart"]');
    if (!select) return;

    // Referenz auf die Zeile des Selects
    const selectRow = select.closest('.form-group');

    const ensureRateField = () => {
      let wrap = form.querySelector('#kaution_rate_wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'kaution_rate_wrap';
        wrap.className = 'form-group';

        const lab = document.createElement('label');
        lab.textContent = 'Die Höhe der monatlich zu zahlenden Rate beträgt (EUR):';
        wrap.appendChild(lab);

        const inp = document.createElement('input');
        inp.type = 'text';
        inp.name = 'kaution_rate_monat';
        wrap.appendChild(inp);

        // direkt NACH der Select-Zeile einsetzen
        selectRow.parentNode.insertBefore(wrap, selectRow.nextSibling);
      }
    };

    const removeRateField = () => {
      document.querySelector('#kaution_rate_wrap')?.remove();
    };

    const onChange = () => {
      if (select.value === 'Ratenzahlung') {
        ensureRateField();
      } else {
        removeRateField();
      }
    };

    select.addEventListener('change', onChange);

    // Initialzustand
    onChange();
  })();


  // ---------- Speichern (Anzeige + LocalStorage) ----------
  document.getElementById('save-btn')?.addEventListener('click', () => {
    const fd = new FormData(form);
    const entries = {};
    for (const [k, v] of fd.entries()) entries[k] = v;

    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (!entries.hasOwnProperty(cb.name)) {
        entries[cb.name] = cb.checked ? 'on' : '';
      }
    });

    const ul = document.createElement('ul');
    Object.entries(entries).forEach(([k, v]) => {
      if (String(v).trim() === '') return;
      const li = document.createElement('li');
      li.textContent = `${k}: ${v}`;
      ul.appendChild(li);
    });

    out.innerHTML = '<h2>Eingegebene Daten:</h2>';
    out.appendChild(ul);
    out.style.display = 'block';

    try {
      localStorage.setItem('abnahme_form_data', JSON.stringify(entries));
    } catch (e) { }
  });

  // ---------- Reset ----------
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    if (!confirm('Alle Eingaben löschen?')) return;
    form.reset();
    [...root.querySelectorAll('[id^="fields-container-"]')].forEach(c => c.innerHTML = '');
    out.style.display = 'none';
    try { localStorage.removeItem('abnahme_form_data'); } catch (e) { }
    // Dynamisches Feld nach Reset entfernen
    document.querySelector('#maengel_dynamic_wrap')?.remove();
    document.querySelector('#kaution_rate_wrap')?.remove();

  });

  // ---------- Laden (falls vorhanden) ----------
  (function restore() {
    try {
      const raw = localStorage.getItem('abnahme_form_data');
      if (!raw) return;
      const data = JSON.parse(raw);
      form.querySelectorAll('input, textarea, select').forEach(inp => {
        if (!inp.name) return;
        if (inp.type === 'checkbox') {
          inp.checked = data[inp.name] === 'on';
        } else if (data[inp.name] != null) {
          inp.value = data[inp.name];
        }
      });
      // Falls "Nein" gespeichert war, dynamisches Feld sicherstellen + Wert setzen
      const sel = form.querySelector('select[name="ohne_beanstandungen"]');
      if (sel && sel.value === 'Nein') {
        const selectRow = sel.closest('.form-group');
        let wrap = form.querySelector('#maengel_dynamic_wrap');
        if (!wrap) {
          wrap = document.createElement('div');
          wrap.id = 'maengel_dynamic_wrap';
          wrap.className = 'form-group';
          const lab = document.createElement('label');
          lab.textContent = 'Die Wohnung weist folgende Mängel auf:';
          wrap.appendChild(lab);
          const ta = document.createElement('textarea');
          ta.name = 'maengel_liste';
          wrap.appendChild(ta);
          selectRow.parentNode.insertBefore(wrap, selectRow.nextSibling);
        }
        const ta = form.querySelector('textarea[name="maengel_liste"]');
        if (ta && typeof data['maengel_liste'] === 'string') ta.value = data['maengel_liste'];
      }

            // Falls "Ratenzahlung" gespeichert war, dynamisches Feld für Monatsrate sicherstellen + Wert setzen
      const selKaution = form.querySelector('select[name="kaution_bezahlart"]');
      if (selKaution && selKaution.value === 'Ratenzahlung') {
        const selectRowK = selKaution.closest('.form-group');
        let wrapK = form.querySelector('#kaution_rate_wrap');
        if (!wrapK) {
          wrapK = document.createElement('div');
          wrapK.id = 'kaution_rate_wrap';
          wrapK.className = 'form-group';
          const labK = document.createElement('label');
          labK.textContent = 'Die Höhe der monatlich zu zahlenden Rate beträgt (EUR):';
          wrapK.appendChild(labK);
          const inpK = document.createElement('input');
          inpK.type = 'text';
          inpK.name = 'kaution_rate_monat';
          wrapK.appendChild(inpK);
          selectRowK.parentNode.insertBefore(wrapK, selectRowK.nextSibling);
        }
        const inpK = form.querySelector('input[name="kaution_rate_monat"]');
        if (inpK && typeof data['kaution_rate_monat'] === 'string') inpK.value = data['kaution_rate_monat'];
      }

    } catch (e) { }
  })();

  // ---------- Echte PDF mit pdf-lib (SAFE MODE) ----------
  document.getElementById('pdf-btn')?.addEventListener('click', async () => {
    try {
      if (!window.PDFLib) {
        alert('PDF-Bibliothek (pdf-lib) nicht geladen. Prüfe <script src="./vendor/pdf-lib.min.js"> und den Pfad.');
        return;
      }
      const { PDFDocument, StandardFonts, rgb } = PDFLib;

      // Farben / Maße
      const COLOR_PRIMARY = rgb(0x00 / 255, 0x77 / 255, 0xb6 / 255);
      const COLOR_PRIMARY_DARK = rgb(0x02 / 255, 0x3e / 255, 0x8a / 255);
      const COLOR_SECTION_BG = rgb(0xf7 / 255, 0xfa / 255, 0xff / 255);
      const COLOR_BORDER = rgb(0xdd / 255, 0xdd / 255, 0xdd / 255);
      const COLOR_TEXT = rgb(0, 0, 0);
      const COLOR_MUTED = rgb(0.45, 0.45, 0.45);

      const PAGE_W = 595, PAGE_H = 842, MARGIN = 36;
      const COL_LABEL_W = 210;
      const COL_VALUE_W = PAGE_W - 2 * MARGIN - COL_LABEL_W;

      // Hinweistext
      const NOTE_TEXT = `Dem  Mieter wurde ein Merkblatt zum ordnungsgemäßen Heizen und Lüften der Wohnung übergeben.

      Der Mieter wurde darüber informiert, daß der Keller nicht zum Abstellen feuchteempfindlicher Gegenstände geeignet ist. Eine Haftung durch den Vermieter bei evtl. auftretenden Schäden  ist ausgeschlossen.

      Die Wohnungsgeberbescheinigung wurde heute am Tag der Übergabe an den Mietern übergeben. 
      Bei Verlust und Neuaustellung wird eine Gebühr in Höhe von 25,00 € zzgl. MwSt. fällig.`;

      // Form-Daten einsammeln
      const fd = new FormData(form);
      const data = {};
      for (const [k, v] of fd.entries()) (k in data) ? (Array.isArray(data[k]) ? data[k].push(v) : data[k] = [data[k], v]) : (data[k] = v);
      const asStr = x => (x ?? '').toString().trim();
      const isOn = x => asStr(x).toLowerCase() === 'on';
      const isISO = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
      const toDE = s => (isISO(s = asStr(s))) ? s.split('-').reverse().join('.') : s;

      // PDF + Standardfonts (keine externen Font/Logo-Loads)
      const pdf = await PDFDocument.create();
      const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

      // Seite + Cursor
      let page = pdf.addPage([PAGE_W, PAGE_H]);
      let cursorY = PAGE_H - MARGIN;

      // Helpers
      const textW = (t, size = 10, bold = false) => (bold ? fontBold : fontRegular).widthOfTextAtSize(t, size);
      const drawText = (t, x, y, size = 10, color = COLOR_TEXT, bold = false) => page.drawText(t, { x, y, size, font: bold ? fontBold : fontRegular, color });
      const wrap = (txt, maxW, size = 10, bold = false) => {
        const paras = String(txt ?? '').replace(/\r\n?/g, '\n').split('\n');
        const out = [];
        for (const para of paras) {
          if (para === '') { out.push(''); continue; }
          const words = para.split(/\s+/);
          let line = '';
          for (const w of words) {
            const test = line ? line + ' ' + w : w;
            if (textW(test, size, bold) <= maxW) line = test;
            else { if (line) out.push(line); line = w; }
          }
          out.push(line);
        }
        return out;
      };
      const ensureSpace = (need) => {
        if (cursorY - need < MARGIN) {
          page = pdf.addPage([PAGE_W, PAGE_H]);
          cursorY = PAGE_H - MARGIN;
          drawHeader();
          cursorY -= 16;
        }
      };
      const drawFooterForAllPages = (pdfDoc, font) => {
        const pages = pdfDoc.getPages();
        const fs = 9, textY = 10, lineY = MARGIN - 6;
        pages.forEach((p, i) => {
          const label = `Seite ${String(i + 1).padStart(2, '0')} von ${String(pages.length).padStart(2, '0')}`;
          p.drawLine({ start: { x: MARGIN, y: lineY }, end: { x: PAGE_W - MARGIN, y: lineY }, thickness: 0.5, color: COLOR_BORDER });
          const tw = font.widthOfTextAtSize(label, fs);
          p.drawText(label, { x: PAGE_W - MARGIN - tw, y: textY, size: fs, font, color: COLOR_MUTED });
        });
      };

      // Header
      const drawHeader = () => {
        // farbige Linie oben
        page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLOR_PRIMARY });
        // Titel
        const title = 'Wohnungsübergabeprotokoll', tSize = 18, tW = textW(title, tSize, true);
        drawText(title, PAGE_W - MARGIN - tW, PAGE_H - MARGIN - 10, tSize, COLOR_PRIMARY_DARK, true);
        // dünne Linie
        const y = PAGE_H - MARGIN - 28;
        page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: COLOR_BORDER });
        cursorY = y - 10;
      };
      drawHeader();

      // Tabellenhelpers
      const CELL_PAD = 6, FONT_SIZE = 10, SECTION_HEADER_H = 28;
      const measureRowH = (lab, val) => {
        const labLines = wrap(lab, COL_LABEL_W - 2 * CELL_PAD, FONT_SIZE);
        const valLines = Array.isArray(val)
          ? val.flatMap(v => wrap(String(v), COL_VALUE_W - 2 * CELL_PAD, FONT_SIZE))
          : wrap(val, COL_VALUE_W - 2 * CELL_PAD, FONT_SIZE);
        const lines = Math.max(labLines.length, valLines.length);
        return lines * (FONT_SIZE + 3) + 2 * CELL_PAD;
      };
      const measureKVTableHeight = rows => rows.reduce((s, [a, b]) => s + measureRowH(a, b), 0) + 8;

      const drawSectionHeader = (title) => {
        const h = 22;
        ensureSpace(h + 10);
        page.drawRectangle({ x: MARGIN, y: cursorY - h, width: PAGE_W - 2 * MARGIN, height: h, color: COLOR_SECTION_BG });
        page.drawRectangle({ x: MARGIN, y: cursorY - h, width: 4, height: h, color: COLOR_PRIMARY });
        drawText(title, MARGIN + 10, cursorY - 14, 12, COLOR_PRIMARY_DARK, true);
        cursorY -= h + 6;
      };

      // 1) Funktion zum Zeichnen eines zentrierten Blocktitels (wie im Browser)
      const drawH1 = (t) => {
        const h = 28;
        ensureSpace(h + 6);
        page.drawRectangle({
          x: MARGIN, y: cursorY - h,
          width: PAGE_W - 2 * MARGIN, height: h,
          color: COLOR_SECTION_BG
        });

        //dünne linke Farbmarke – optional
        // page.drawRectangle({ x: MARGIN, y: cursorY - h, width: 4, height: h, color: COLOR_PRIMARY });

        const fs = 14;
        const tw = textW(t, fs, true);
        drawText(t, MARGIN + ((PAGE_W - 2 * MARGIN) - tw) / 2, cursorY - 18, fs, COLOR_PRIMARY_DARK, true);
        cursorY -= h + 8;
      };


      const drawKVTable = (rows) => {
        if (!rows.length) return;
        const tableX = MARGIN, tableW = PAGE_W - 2 * MARGIN;
        let y = cursorY;
        rows.forEach(([lab, val]) => {
          const rowH = measureRowH(lab, val);
          page.drawLine({ start: { x: tableX, y }, end: { x: tableX + tableW, y }, thickness: 0.5, color: COLOR_BORDER });
          page.drawLine({ start: { x: tableX + COL_LABEL_W, y }, end: { x: tableX + COL_LABEL_W, y: y - rowH }, thickness: 0.5, color: COLOR_BORDER });

          let txtY = y - CELL_PAD - FONT_SIZE;
          wrap(lab, COL_LABEL_W - 2 * CELL_PAD, FONT_SIZE).forEach(line => {
            drawText(line, tableX + CELL_PAD, txtY, FONT_SIZE);
            txtY -= (FONT_SIZE + 3);
          });

          txtY = y - CELL_PAD - FONT_SIZE;
          const valLines = Array.isArray(val) ? val.flatMap(v => wrap(String(v), COL_VALUE_W - 2 * CELL_PAD, FONT_SIZE))
            : wrap(val, COL_VALUE_W - 2 * CELL_PAD, FONT_SIZE);
          valLines.forEach(line => {
            drawText(line, tableX + COL_LABEL_W + CELL_PAD, txtY, FONT_SIZE);
            txtY -= (FONT_SIZE + 3);
          });

          page.drawLine({ start: { x: tableX, y: y - rowH }, end: { x: tableX + tableW, y: y - rowH }, thickness: 0.5, color: COLOR_BORDER });
          y -= rowH;
        });
        cursorY = y - 8;
      };

      // form_sections -> Tabellen
      window.form_sections.forEach(section => {
        if (section.type === 'heading') {  // <-- NEU
          drawH1(section.title);
          return;
        }
        const rows = [];
        const isMaengel = section.title === 'Mängelregelung';
        let skip = false;
        if (isMaengel) {
          const sel = asStr(data['ohne_beanstandungen']);
          if (sel) {
            rows.push(['Die Wohnungsübergabe erfolgte ohne Beanstandungen', sel]);
            if (sel === 'Ja') skip = true;
            else {
              const liste = asStr(data['maengel_liste']);
              if (liste) rows.push(['Die Wohnung weist folgende Mängel auf', liste]);
            }
          }
        }
        if (!(isMaengel && skip)) {
          (section.fields || []).forEach(f => {
            if (isMaengel && f.name === 'ohne_beanstandungen') return;
            const v = data[f.name];
            if (Array.isArray(v)) v.forEach((vv, i) => { if (asStr(vv)) rows.push([`${f.label} (${i + 1})`, toDE(vv)]) });
            else if (asStr(v)) rows.push([f.label, toDE(v)]);
          });
        }
        (section.options || []).forEach(opt => {
          const sub = opt.subfields || [], fld = opt.fields || [];
          if (sub.length) {
            const maxN = Math.max(0, ...sub.map(sf => Array.isArray(data[sf.name]) ? data[sf.name].length : asStr(data[sf.name]) ? 1 : 0));
            for (let i = 0; i < maxN; i++) {
              const inner = [];
              sub.forEach(sf => {
                const vi = Array.isArray(data[sf.name]) ? data[sf.name][i] : (i === 0 ? data[sf.name] : undefined);
                const s = asStr(vi);
                if (sf.type === 'checkbox') { if (isOn(s)) inner.push(`${sf.label}: Ja`); }
                else if (s) inner.push(`${sf.label}: ${toDE(s)}`);
              });
              if (inner.length) rows.push([maxN > 1 ? `${opt.label} (${i + 1})` : opt.label, inner]);
            }
          } else if (fld.length) {
            const maxN = Math.max(0, ...fld.map(f => Array.isArray(data[f.name]) ? data[f.name].length : asStr(data[f.name]) ? 1 : 0));
            for (let i = 0; i < maxN; i++) {
              const inner = [];
              fld.forEach(f => {
                const vi = Array.isArray(data[f.name]) ? data[f.name][i] : (i === 0 ? data[f.name] : undefined);
                const s = asStr(vi);
                if (f.type === 'checkbox') { if (isOn(s)) inner.push(`${f.label}: Ja`); }
                else if (s) inner.push(`${f.label}: ${s}`);
              });
              if (inner.length) rows.push([maxN > 1 ? `${opt.label} (${i + 1})` : opt.label, inner]);
            }
          }
        });
                // Zusatzzeile für Kaution bei Ratenzahlung
        if (section.title === 'Kaution') {
          const bezArt = asStr(data['kaution_bezahlart']);
          const rate = asStr(data['kaution_rate_monat']);
          if (bezArt === 'Ratenzahlung' && rate) {
            rows.push(['Die Höhe der monatlich zu zahlenden Rate beträgt (EUR):', rate]);
          }
        }

        if (!rows.length) return;

        const introMap = {
          'Schlüsselausgabe': 'Der Mieter hat folgende Schlüssel erhalten:',
          'Zählerstände': 'Nachfolgende Zählerstände wurden bei der Wohnungsübergabe von beiden Parteien abgelesen.\nDie Anmeldung bei der Energieversorgung (Strom) erfolgt durch den Vermieter.',
        };
        const introRows = introMap[section.title] ? [['', introMap[section.title]]] : [];

        const need = (22 + 6) + measureKVTableHeight(introRows) + measureKVTableHeight(rows);
        ensureSpace(need);

        drawSectionHeader(section.title);
        if (introRows.length) drawKVTable(introRows);
        drawKVTable(rows);

        // --- Hinweisblock nach "Kaution"
        if (section.title === 'Kaution') {
          cursorY -= 6;
          const PAD_X = 10, PAD_Y = 8, FS = 10, LINE = FS + 3;
          const lines = wrap(NOTE_TEXT, (PAGE_W - 2 * MARGIN) - 2 * PAD_X - 4, FS);
          let i = 0;
          while (i < lines.length) {
            const avail = cursorY - MARGIN;
            const maxLines = Math.max(1, Math.floor((avail - 2 * PAD_Y) / LINE));
            const slice = lines.slice(i, i + maxLines);
            const blockH = slice.length * LINE + 2 * PAD_Y;

            ensureSpace(blockH);
            page.drawRectangle({ x: MARGIN, y: cursorY - blockH, width: PAGE_W - 2 * MARGIN, height: blockH, color: COLOR_SECTION_BG, borderColor: COLOR_BORDER, borderWidth: 0.5 });
            page.drawRectangle({ x: MARGIN, y: cursorY - blockH, width: 4, height: blockH, color: COLOR_PRIMARY });

            let y = cursorY - PAD_Y - FS;
            slice.forEach(line => {
              if (line === '') { y -= LINE; }
              else { drawText(line, MARGIN + PAD_X + 4, y, FS, COLOR_TEXT); y -= LINE; }
            });

            cursorY -= blockH + 8;
            i += slice.length;
          }
        }
      });

      // Unterschriften
      const rawDate = data['datum'];
      let header = 'Dresden, den .............................';
      if (asStr(rawDate)) {
        try { const d = new Date(rawDate); header = `Dresden, den ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; } catch { }
      }

      const fieldH = 90, gap = 16, halfW = (PAGE_W - 2 * MARGIN - gap) / 2;
      const needSig = (22 + 6) + measureKVTableHeight([['', header]]) + fieldH + 30;
      ensureSpace(needSig);

      drawSectionHeader('Unterschriften');
      drawKVTable([['', header]]);

      const topY = cursorY - 6;
      const drawSignBox = (x, y, w, h, legend) => {
        const PAD_TOP = 12, PAD_X = 14, fs = 9;
        page.drawRectangle({ x, y: y - h, width: w, height: h, borderWidth: 1, borderColor: COLOR_TEXT });
        const lines = wrap(legend, w - 2 * PAD_X, fs, true);
        let base = y - PAD_TOP - fs;
        lines.forEach(line => {
          const lw = textW(line, fs, true);
          drawText(line, x + (w - lw) / 2, base, fs, COLOR_TEXT, true);
          base -= (fs + 2);
        });
        const signY = y - h + 26;
        page.drawLine({ start: { x: x + 20, y: signY }, end: { x: x + w - 20, y: signY }, thickness: 0.8, color: COLOR_TEXT });
      };
      drawSignBox(MARGIN, topY, halfW, fieldH, 'Unterschrift des Vermieters bzw. seines Bevollmächtigten');
      drawSignBox(MARGIN + halfW + gap, topY, halfW, fieldH, 'Unterschrift des Mieters bzw. seines Bevollmächtigten');
      cursorY = topY - fieldH - 30;

      // Footer + Download
      drawFooterForAllPages(pdf, fontRegular);
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'Wohnungsübergabeprotokoll.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF-Fehler:', err);
      alert('PDF-Erstellung fehlgeschlagen. Siehe Konsole für Details.');
    }
  });

})();