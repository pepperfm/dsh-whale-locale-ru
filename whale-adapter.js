/** Exact-text adapter for the legacy Whale 0.4.2 UI. No request, credential or input interception. */
export function installWhaleTranslation(locale, dictionary, doc = document, defaultSpeech = {}) {
  const supportedVersion = /^v?0\.4\.2$/;
  const attributes = ['title', 'aria-label', 'placeholder', 'alt'];
  const excluded = 'script,style,pre,code,textarea,option,[contenteditable],.dshwv-bubprev,.dshwv-bubpvbox,.dshwv-pvmod,.dshwv-resnm,.dshwv-text,.dshwv-linetx,.dshwv-bubchip,.dshwv-rolename,.dshwv-audioname,.dshwv-custnm,.dshwv-custlab,.dshwv-custmenu,.dshwv-btnlabel,.dshwv-fcardname,.dshwv-usage-mask .dshwv-bubtitle';
  const texts = new Map();
  const attrs = new Map();
  const speechStyles = new Map();
  let fitFrame = null;
  let enabled = locale.getSnapshot().active === 'ru';
  let pending = false;
  let disposed = false;
  let warned = false;
  let observer;

  function translate(value) {
    const trimmed = value.trim();
    if (typeof translateWhaleUiText === 'function') return translateWhaleUiText(value, dictionary, defaultSpeech);
    if (!Object.hasOwn(dictionary, trimmed)) return value;
    return value.slice(0, value.indexOf(trimmed)) + dictionary[trimmed] + value.slice(value.indexOf(trimmed) + trimmed.length);
  }
  function owned(element) {
    if (!element || element.closest(excluded)) return false;
    for (let el = element; el && el !== doc.body; el = el.parentElement) {
      if (typeof el.className === 'string' && el.className.split(/\s+/).some(name => name.startsWith('dshwv-'))) return true;
    }
    return false;
  }
  function supported() {
    if (!doc.querySelector('.dshwv-root')) return false;
    // The real widget portals its menu (and version label) outside the root.
    const version = doc.querySelector('.dshwv-ver')?.textContent.trim();
    if (!version) return false;
    if (supportedVersion.test(version)) return true;
    if (!warned) {
      console.info('[DSH Russian] Whale adapter supports 0.4.2; detected', version, '— left unchanged.');
      warned = true;
    }
    return false;
  }
  function restoreSpeechStyle(row, record) {
    for (const [property, original] of record.original) {
      if (row.style.getPropertyValue(property) !== record.applied.get(property)) continue;
      if (original.value) row.style.setProperty(property, original.value, original.priority);
      else row.style.removeProperty(property);
    }
  }
  function restore() {
    if (fitFrame !== null) doc.defaultView?.cancelAnimationFrame(fitFrame);
    fitFrame = null;
    for (const [row, record] of speechStyles) restoreSpeechStyle(row, record);
    speechStyles.clear();
    for (const [node, record] of texts) if (node.nodeValue === record.translated) node.nodeValue = record.original;
    for (const [element, records] of attrs) for (const [attribute, record] of records) {
      if (element.getAttribute(attribute) === record.translated) element.setAttribute(attribute, record.original);
    }
    texts.clear();
    attrs.clear();
  }
  function translateText(node) {
    if (!owned(node.parentElement)) return;
    const value = node.nodeValue || '';
    const record = texts.get(node);
    if (record?.translated === value) return;
    const translated = translate(value);
    if (translated === value) { texts.delete(node); return; }
    texts.set(node, { original: value, translated });
    node.nodeValue = translated;
  }
  function translateAttributes(element) {
    if (!owned(element)) return;
    for (const attribute of attributes) {
      if (attribute === 'title' && element.matches('.dshwv-fcard')) continue;
      const value = element.getAttribute(attribute);
      if (value === null) continue;
      const records = attrs.get(element);
      if (records?.get(attribute)?.translated === value) continue;
      const translated = translate(value);
      if (translated === value) { records?.delete(attribute); continue; }
      if (!records) attrs.set(element, new Map());
      attrs.get(element).set(attribute, { original: value, translated });
      element.setAttribute(attribute, translated);
    }
  }
  // A few shipped labels live in surfaces that may also contain user-authored text.
  // Translate only the recognizable built-in balance card and the built-in role.
  function putText(node, translated) {
    const value = node.nodeValue || '';
    if (value === translated) return;
    texts.set(node, { original: value, translated });
    node.nodeValue = translated;
  }
  function textLeaves(element) {
    const nodes = [];
    const walker = doc.createTreeWalker(element, 4);
    let node;
    while ((node = walker.nextNode())) if (node.nodeValue.trim()) nodes.push(node);
    return nodes;
  }
  function builtinRole(image) {
    try { return new URL(image?.getAttribute('src') || '', doc.baseURI).pathname === '/dsh-whale/image.png'; }
    catch { return false; }
  }
  function translateBuiltinRoleLabel(label) {
    for (const node of textLeaves(label)) {
      if (node.nodeValue.trim() === '小鲸鱼') putText(node, node.nodeValue.replace('小鲸鱼', 'Китёнок'));
      else if (node.nodeValue.trim() === 'Китёнок' && !texts.has(node)) {
        // The built-in name's marquee may clone its already translated label.
        texts.set(node, { original: node.nodeValue.replace('Китёнок', '小鲸鱼'), translated: node.nodeValue });
      }
    }
  }
  function translateBuiltins() {
    const amount = /^(?:[¥$€£₽]\s*)?[\d\s,.]+(?:\s*[A-Z]{3})?$/;
    for (const card of doc.querySelectorAll('.dshwv-pop .dshwv-text')) {
      const leaves = textLeaves(card);
      if (leaves.length < 3) continue;
      const title = leaves[0].nodeValue.trim();
      const usage = leaves[2].nodeValue.trim();
      const usageMatch = /^(今日已用|Сегодня)(\s+.+)$/.exec(usage);
      if (!['DeepSeek 余额', 'Баланс DeepSeek'].includes(title)
        || !amount.test(leaves[1].nodeValue.trim()) || !usageMatch || !amount.test(usageMatch[2].trim())) continue;
      if (title === 'DeepSeek 余额') putText(leaves[0], leaves[0].nodeValue.replace(title, 'Баланс DeepSeek'));
      if (usageMatch[1] === '今日已用') putText(leaves[2], leaves[2].nodeValue.replace('今日已用', 'Сегодня'));
      for (const node of leaves.slice(3)) {
        const text = node.nodeValue.trim();
        const label = { '峰': 'Пик', '谷': 'Льг.', '高峰时段': 'Пиковый тариф', '空闲时段': 'Льготный тариф' }[text];
        if (label) putText(node, node.nodeValue.replace(text, label));
      }
    }
    const roleRoot = doc.querySelector('.dshwv-root');
    if (builtinRole(roleRoot?.querySelector('.dshwv-img'))) {
      for (const label of doc.querySelectorAll('.dshwv-rolebtn .dshwv-btnlabel')) {
        translateBuiltinRoleLabel(label);
      }
    }
    for (const item of doc.querySelectorAll('.dshwv-roleitem')) if (builtinRole(item.querySelector('.dshwv-rolethumb'))) {
      for (const label of item.querySelectorAll('.dshwv-rolename .dshwv-namecopy')) {
        translateBuiltinRoleLabel(label);
      }
    }
  }
  function specialSurface(element) {
    return element?.closest?.('.dshwv-pop .dshwv-text, .dshwv-rolebtn, .dshwv-roleitem, .dshwv-custwrap, .dshwv-custmenu, .dshwv-audiolist, .dshwv-bubpvbox, .dshwv-bubprev, .dshwv-bubmask .dshwv-bubchip');
  }
  const soundPresets = {
    'preset:duck:press': ['小黄鸭·按下', 'Утёнок · нажатие'],
    'preset:duck:release': ['小黄鸭·松开', 'Утёнок · отпускание'],
    'preset:fx1:press': ['音效1·按下', 'Звук 1 · нажатие'],
    'preset:fx1:release': ['音效1·松开', 'Звук 1 · отпускание'],
    'frag:cost_a': ['每轮消耗·默认', 'Стоимость ответа · стандартный'],
    'frag:ask_a': ['提问·默认', 'Вопрос · стандартный'],
    'frag:approve_a': ['授权·默认', 'Разрешение · стандартный'],
    'frag:exp_orb': ['Minecraft·经验球', 'Minecraft · сфера опыта'],
    'grp:duck': ['小黄鸭（点按）', 'Утёнок (нажатие)'],
    'grp:fx1': ['音效1（点按）', 'Звук 1 (нажатие)']
  };
  const staticOptionValues = new Set(['text','link','random','balance','bonus','recharge','today','session','quota','plan','peak','nextpeak','image','randimg','classic','roundrect','zigzag','custom','svg','macaron','candy','rouge','bamboo','aurora','deepsea','sunset','forest','champagne','lavender','mint','lava','galaxy','ink','indigo','blaze','amber','liangwen','mini','count','next','status']);
  function optionTranslation(option) {
    if (!option) return null;
    if (soundPresets[option.value]) return soundPresets[option.value];
    if (!staticOptionValues.has(option.value)) return null;
    const original = option.textContent;
    const translated = translate(original);
    return original !== translated ? [original, translated] : null;
  }
  let activeSoundSelect;
  function sourceText(element) {
    return textLeaves(element).map(node => {
      const record = texts.get(node);
      return record?.translated === node.nodeValue ? record.original : node.nodeValue;
    }).join('');
  }
  function knownLabel(element, original, translated) {
    for (const node of textLeaves(element)) {
      if (node.nodeValue === original) putText(node, translated);
      else if (node.nodeValue === translated && !texts.has(node)) texts.set(node, { original, translated });
    }
  }
  function trackSoundMenu(event) {
    const button = event.target.closest?.('.dshwv-custbtn');
    if (button) activeSoundSelect = button.closest('.dshwv-custwrap')?.querySelector('select') || null;
  }
  function translateSoundSettings() {
    // Translate presentation mirrors by immutable preset IDs, not user-provided names.
    for (const wrap of doc.querySelectorAll('.dshwv-custwrap')) {
      const select = wrap.querySelector('select');
      const label = wrap.querySelector('.dshwv-custlab');
      const preset = optionTranslation(select?.selectedOptions?.[0]);
      if (label && preset) knownLabel(label, ...preset);
    }
    if (activeSoundSelect?.isConnected) for (const menu of doc.querySelectorAll('.dshwv-custmenu')) {
      if (menu.style.display === 'none') continue;
      const rows = [...menu.children];
      if (rows.length !== activeSoundSelect.options.length) continue;
      for (let i = 0; i < rows.length; i++) {
        const preset = optionTranslation(activeSoundSelect.options[i]);
        if (preset) knownLabel(rows[i].querySelector('.dshwv-custnm') || rows[i], ...preset);
      }
    }
    let selectedGroup;
    for (const item of doc.querySelectorAll('.dshwv-audiolist .dshwv-audioitem')) {
      if (!item.querySelector('.dshwv-audiopreset')) continue;
      const label = item.querySelector('.dshwv-audioname');
      if (!label) continue;
      const name = sourceText(label.querySelector('.dshwv-namecopy') || label);
      const translated = { '小黄鸭': 'Утёнок', '音效1': 'Звук 1' }[name];
      if (!translated) continue;
      knownLabel(label, name, translated);
      if (item.classList.contains('dshwv-audioitem-cur')) selectedGroup = [name, translated];
    }
    if (selectedGroup) for (const label of doc.querySelectorAll('.dshwv-audiobtn .dshwv-btnlabel')) knownLabel(label, ...selectedGroup);
    const card = doc.querySelector('#dshwv-waitcharclose')?.closest('.dshwv-bubcard');
    if (!card) return;
    const entries = [...card.children].filter(row => row.classList.contains('dshwv-menu-row') && row.nextElementSibling?.hasAttribute('data-open'));
    for (let index = 0; index < entries.length; index++) {
      const row = entries[index], body = row.nextElementSibling;
      const summary = row.children[3];
      if (!summary) continue;
      const leaves = textLeaves(summary);
      if (leaves.length !== 1) continue;
      const node = leaves[0];
      const previous = texts.get(node);
      if (previous?.translated === node.nodeValue) continue;
      let original = node.nodeValue, translated = original;
      if (index === 1 && selectedGroup) {
        if (original.startsWith(selectedGroup[1] + ' · ')) original = selectedGroup[0] + original.slice(selectedGroup[1].length);
        translated = original.startsWith(selectedGroup[0] + ' · ') ? selectedGroup[1] + original.slice(selectedGroup[0].length) : original;
      } else if (index === 2) {
        translated = translated.replace(/^自动关 (\d+)s(?= · )/, 'Закрыть через $1 с').replace(/^不自动关(?= · )/, 'Не закрывать');
        const preset = soundPresets[body.querySelector('select.dshwv-sound')?.value];
        if (preset) translated = translated.replace(' · ' + preset[0], ' · ' + preset[1]);
        translated = translated.replace(/ · 跟随按压音量 (\d+%)$/, ' · как у нажатия: $1');
      } else if (index === 3 || index === 4) {
        const preset = soundPresets[body.querySelector('select.dshwv-sound')?.value];
        if (preset && (translated === preset[0] || translated.startsWith(preset[0] + ' · '))) translated = preset[1] + translated.slice(preset[0].length);
      }
      translated = translated.replace('当前为静音，在下拉设置中修改', 'Звук выключен; настройте ниже');
      if (translated !== original) {
        texts.set(node, { original, translated });
        node.nodeValue = translated;
      }
    }
  }
  function translateEditorChrome() {
    for (const frame of doc.querySelectorAll('.dshwv-fcard[data-fid="frame_classic"]')) {
      for (const label of frame.querySelectorAll('.dshwv-fcardname')) knownLabel(label, '经典（内置）', 'Классическая (встроенная)');
      const title = frame.getAttribute('title');
      if (title === '经典（内置）（内置，只读）') {
        const translated = 'Классическая (встроенная, только чтение)';
        if (!attrs.has(frame)) attrs.set(frame, new Map());
        attrs.get(frame).set('title', { original: title, translated });
        frame.setAttribute('title', translated);
      }
    }
    // Preview containers mix user content with editor controls. Touch their chrome only.
    for (const element of doc.querySelectorAll('.dshwv-bubpvbox [title], .dshwv-bubprev [title], .dshwv-pvmod[title], .dshwv-bubmask .dshwv-bubchip[title]')) {
      if (element.closest('textarea,input,[contenteditable]')) continue;
      const value = element.getAttribute('title');
      const records = attrs.get(element);
      if (!value || records?.get('title')?.translated === value) continue;
      const translated = translate(value);
      if (translated === value) continue;
      if (!records) attrs.set(element, new Map());
      attrs.get(element).set('title', { original: value, translated });
      element.setAttribute('title', translated);
    }
    for (const label of doc.querySelectorAll('.dshwv-pvlab, .dshwv-bubmask .dshwv-bubchip, .dshwv-usage-mask .dshwv-bubtitle')) {
      for (const node of textLeaves(label)) {
        const previous = texts.get(node);
        if (previous?.translated === node.nodeValue) continue;
        const value = node.nodeValue;
        const generated = label.classList.contains('dshwv-pvlab')
          || label.classList.contains('dshwv-bubtitle') && /^(模型设置 · |额度 · |新增模型（自定义 API）$)|（内置）$/.test(value)
          || /^第\d+次点击 · 编辑内容$|^[AB] 泡\(权重 \d+\)$|^首次点击 · 编辑内容$|^[AB] · 编辑内容$/.test(value);
        if (!generated) continue;
        const translated = translate(value);
        if (translated !== value) putText(node, translated);
      }
    }
  }
  function translateDefaultSpeech() {
    const win = doc.defaultView;
    const fitted = [];
    for (const card of doc.querySelectorAll('.dshwv-pop .dshwv-text')) {
      let known = false;
      for (const node of textLeaves(card)) {
        const record = texts.get(node);
        const original = record?.translated === node.nodeValue ? record.original : node.nodeValue;
        const phrase = original.trim();
        if (!Object.hasOwn(defaultSpeech, phrase)) continue;
        const translated = original.replace(phrase, defaultSpeech[phrase]);
        if (node.nodeValue !== translated) putText(node, translated);
        known = true;
        fitted.push({ card, row: node.parentElement.closest('.dshwv-trow') || node.parentElement });
      }
      if (!known) for (const [row, record] of speechStyles) if (card.contains(row)) {
        restoreSpeechStyle(row, record); speechStyles.delete(row);
      }
    }
    for (const [row, record] of speechStyles) if (!row.isConnected) { restoreSpeechStyle(row, record); speechStyles.delete(row); }
    if (!fitted.length || !win?.requestAnimationFrame || fitFrame !== null) return;
    fitFrame = win.requestAnimationFrame(() => {
      fitFrame = null;
      if (disposed || !enabled) return;
      for (const { card, row } of fitted) {
        if (!row.isConnected || !card.clientWidth || !card.clientHeight) continue;
        let record = speechStyles.get(row);
        if (!record) {
          record = { original: new Map(), applied: new Map(), key: '', base: parseFloat(win.getComputedStyle(row).fontSize) || 16 };
          for (const property of ['font-size', 'white-space', 'max-width']) record.original.set(property, { value: row.style.getPropertyValue(property), priority: row.style.getPropertyPriority(property) });
          speechStyles.set(row, record);
        }
        const key = card.clientWidth + ':' + card.clientHeight + ':' + row.textContent;
        if (record.key === key) continue;
        record.key = key;
        function set(property, value) { row.style.setProperty(property, value, 'important'); record.applied.set(property, value); }
        set('white-space', 'normal'); set('max-width', '100%');
        let size = record.base;
        set('font-size', size.toFixed(2) + 'px');
        for (let pass = 0; pass < 4; pass++) {
          const availableWidth = card.clientWidth, availableHeight = card.clientHeight * .92;
          const width = row.scrollWidth, height = row.getBoundingClientRect().height;
          const ratio = Math.min(availableWidth / Math.max(1, width), availableHeight / Math.max(1, height));
          if (ratio >= .99 || size <= 8) break;
          size = Math.max(8, size * Math.min(.9, ratio * .95));
          set('font-size', size.toFixed(2) + 'px');
        }
      }
    });
  }
  function scan() {
    pending = false;
    if (disposed || !doc.body) return;
    observer.disconnect();
    try {
      if (!enabled || !supported()) { restore(); return; }
      // A portal may be detached and reused later. Restore before dropping its record.
      for (const [node, record] of texts) if (!node.isConnected) {
        if (node.nodeValue === record.translated) node.nodeValue = record.original;
        texts.delete(node);
      }
      for (const [element, records] of attrs) if (!element.isConnected) {
        for (const [attribute, record] of records) if (element.getAttribute(attribute) === record.translated) element.setAttribute(attribute, record.original);
        attrs.delete(element);
      }
      translateBuiltins();
      translateDefaultSpeech();
      translateSoundSettings();
      translateEditorChrome();
      // Only walk Whale-owned surfaces, never chat text, tool output, or the DSH editor.
      const candidates = doc.querySelectorAll('[class^="dshwv-"], [class*=" dshwv-"]');
      const roots = [...candidates].filter(el => !owned(el.parentElement));
      for (const root of roots) {
        translateAttributes(root);
        const walker = doc.createTreeWalker(root, 1 | 4, {
          acceptNode(node) {
            const element = node.nodeType === 1 ? node : node.parentElement;
            if (!owned(element)) return 2;
            if (node.nodeType === 1 && element.matches(excluded)) return 2;
            return 1;
          }
        });
        let node;
        while ((node = walker.nextNode())) {
          if (node.nodeType === 3) translateText(node);
          else translateAttributes(node);
        }
      }
    } finally {
      if (!disposed) observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...attributes, 'src'] });
    }
  }
  function schedule(records) {
    if (disposed || pending) return;
    // Don't rescan the widget for every streamed chat token.
    if (records && !records.some(record => {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (owned(target) || specialSurface(target)) return true;
      return [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 && (owned(node) || node.querySelector('[class^="dshwv-"], [class*=" dshwv-"]')));
    })) return;
    pending = true;
    queueMicrotask(scan);
  }
  doc.addEventListener('click', trackSoundMenu, true);
  observer = new MutationObserver(schedule);
  observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...attributes, 'src'] });
  const unsubscribe = locale.subscribe(() => {
    enabled = locale.getSnapshot().active === 'ru';
    schedule();
  });
  schedule();
  return () => {
    disposed = true;
    observer.disconnect();
    doc.removeEventListener('click', trackSoundMenu, true);
    activeSoundSelect = null;
    unsubscribe();
    restore();
  };
}
