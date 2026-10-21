/** Reversible Russian-only layout corrections for the legacy Whale Widget 0.4.2. */
export function installWhaleLayout(locale, doc = document) {
  const win = doc.defaultView;
  if (!win?.MutationObserver || !doc.createElement) return () => {};
  const attribute = 'data-dsh-ru-whale-layout';
  const owner = `ru-whale-${Math.random().toString(36).slice(2)}`;
  const scope = `[${attribute}="${owner}"]`;
  // These are body portals, not the mascot root or its user-sized speech bubble.
  const surfaces = [
    'menu', 'audiomask', 'cropmask', 'gifmask', 'confirmmask', 'snapmask',
    'bubmask', 'framemask', 'usage-mask', 'resmask', 'qedit', 'usagepanel',
    'rolelist', 'audiolist', 'slotlist', 'rgbmenu', 'tplhelp',
  ].map(name => `.dshwv-${name}`).join(',');
  const marked = new Map();
  const style = doc.createElement('style');
  // Prevent DSH's style-claiming loader from assigning this sheet to another plugin.
  style.setAttribute('data-plugin', 'dsh-whale-locale-ru');
  style.setAttribute(attribute, owner);
  let disposed = false;
  let pending = false;
  let enabled = false;

  const css = `
${scope}.dshwv-menu {
  width:min(25rem,calc(100vw - 1rem)) !important;
  min-width:0; max-width:calc(100vw - 1rem) !important;
  overflow-y:auto; overscroll-behavior:contain;
}
${scope} :is(.dshwv-menu-row,.dshwv-audiorow) {
  min-width:0; white-space:normal; flex-wrap:wrap;
}
${scope} :is(.dshwv-menu-row,.dshwv-audiorow) > span {
  min-width:0; overflow-wrap:anywhere;
}
${scope} .dshwv-menu-row > span:first-child {
  flex-shrink:1 !important; max-width:100%;
}
${scope} :is(.dshwv-range,input[type=range]) { min-width:3rem; }
${scope} :is(.dshwv-number,.dshwv-cropnum) { flex-shrink:0; }
${scope} :is(.dshwv-sound,.dshwv-rolebtn,.dshwv-audiobtn) {
  min-width:4rem; height:auto; min-height:1.5rem;
}
${scope} :is(.dshwv-sound,.dshwv-roleimport,.dshwv-audioimport,.dshwv-audiosmallimport,
.dshwv-cropbtn,.dshwv-snapbtn,.dshwv-bubbtn,.dshwv-palchip,.dshwv-paladd,
.dshwv-usage-more,.dshwv-about-btn,.dshwv-fechip) {
  box-sizing:border-box; max-width:100%; white-space:normal;
  overflow-wrap:anywhere; line-height:1.35; height:auto;
}
${scope} :is(.dshwv-roleimport,.dshwv-audioimport,.dshwv-audiosmallimport) {
  flex-shrink:0; padding-inline:.5rem;
}
${scope} .dshwv-usage-area { min-width:0; }
${scope} :is(.dshwv-usage-sub,.dshwv-menuview,.dshwv-about) {
  min-width:0; overscroll-behavior:contain;
}
/* Absolute child views still fill the native, animated usageArea. */
${scope} .dshwv-usage-sub { overflow-x:hidden; }
/* The model heading used to reserve an unshrinkable inline label beside Refresh. */
${scope} .dshwv-usage-sub > .dshwv-audiorow > span:first-child:not(.dshwv-marq) {
  flex:1 1 11rem !important; white-space:normal; min-width:0;
}
${scope} .dshwv-usage-sub > .dshwv-audiorow > .dshwv-palchip { flex:0 0 auto; }
/* Model name + status get their own readable line above the Settings action if needed. */
${scope} .dshwv-usage-model {
  flex:1 1 8rem !important; white-space:normal; overflow:visible;
}
${scope} .dshwv-usage-sub .dshwv-marq {
  white-space:normal; overflow-wrap:anywhere;
}
${scope} .dshwv-usage-sub .dshwv-marq > span {
  white-space:normal; transform:none !important; transition:none !important;
}
${scope} .dshwv-usage-sub .dshwv-audiorow > .dshwv-usage-hint {
  flex:1 1 9rem !important; min-width:0; padding-right:0 !important;
}
${scope} :is(.dshwv-usage-sec,.dshwv-usage-collapse) {
  min-width:0; gap:.5rem; white-space:normal; flex-wrap:wrap;
}
${scope} :is(.dshwv-usage-sec,.dshwv-usage-collapse) > :first-child {
  min-width:0; overflow-wrap:anywhere;
}
${scope} .dshwv-usage-total { flex-shrink:0; }
${scope} :is(.dshwv-usage-row,.dshwv-usage-ratio) { flex-wrap:wrap; }
${scope} .dshwv-usage-ratio-label {
  flex:0 1 9rem; white-space:normal; overflow-wrap:anywhere;
}
${scope} .dshwv-usage-wintitle { padding-right:2.5rem; overflow-wrap:anywhere; }
${scope} :is(.dshwv-usage-windowbody,.dshwv-reswrap) { min-height:0; min-width:0; }
/* Keep the original navy/white cards, padding, radii, shadows and font sizes. */
${scope}:is(.dshwv-audiomask,.dshwv-cropmask,.dshwv-gifmask,.dshwv-confirmmask,
.dshwv-snapmask,.dshwv-bubmask,.dshwv-framemask,.dshwv-usage-mask,.dshwv-resmask) {
  box-sizing:border-box; padding:.5rem;
}
${scope} :is(.dshwv-audiowin,.dshwv-cropwin,.dshwv-gifwin,.dshwv-confirmwin,
.dshwv-snapwin,.dshwv-bubcard,.dshwv-framecard,.dshwv-usage-card) {
  box-sizing:border-box; min-width:0; max-width:calc(100vw - 1rem) !important;
  max-height:calc(100vh - 1rem); max-height:calc(100dvh - 1rem);
  overflow:auto; overscroll-behavior:contain;
}
${scope} .dshwv-audiowin { width:30rem; }
${scope} .dshwv-confirmwin { width:24rem; }
${scope} .dshwv-bubcard { width:min(38rem,calc(100vw - 1rem)) !important; }
/* Native preview caches pixel margins at creation; recenter its unchanged canvas
   when the card reflows. Do not scale the stage or its pointer coordinates. */
${scope} .dshwv-bubprev { margin-left:auto !important; margin-right:auto !important; }
${scope} .dshwv-bubcard > .dshwv-menu-row:has(+ [data-open]) > span:nth-last-child(2) {
  flex:1 1 45%; max-width:100% !important; white-space:normal !important; text-overflow:clip;
}
${scope} .dshwv-framecard { width:38rem; }
${scope} .dshwv-rescard { width:min(36rem,calc(100vw - 1rem)); }
${scope} :is(.dshwv-cropbtns,.dshwv-confirmbtns,.dshwv-snapbtns,.dshwv-bubbtns,
.dshwv-bubrow,.dshwv-choicerow,.dshwv-peakrow,.dshwv-resrow,.dshwv-reshead) {
  flex-wrap:wrap; min-width:0;
}
${scope} :is(.dshwv-croplabel,.dshwv-audioslotlabel,.dshwv-zoomlabel) {
  width:auto; flex:0 1 6rem; white-space:normal; overflow-wrap:anywhere;
}
${scope} .dshwv-felab { flex-basis:7rem; overflow-wrap:anywhere; }
${scope} .dshwv-feattrs { min-width:0; }
${scope} .dshwv-audiorow > span:first-child:not(.dshwv-marq) {
  flex-shrink:1 !important; max-width:100%;
}
${scope} .dshwv-bubkind { width:10rem; max-width:100%; flex-shrink:1; }
${scope} .dshwv-rgbhead { white-space:normal; overflow-wrap:anywhere; height:auto; }
${scope} :is(.dshwv-audionameinput,.dshwv-cropname,.dshwv-gifname) {
  max-width:100%;
}
${scope} :is(.dshwv-slotwrap,.dshwv-audioselect) { flex-basis:8rem; }
${scope} :is(.dshwv-resmain,.dshwv-resnm,.dshwv-resmeta) {
  white-space:normal; overflow-wrap:anywhere;
}
${scope} .dshwv-resmain { flex-basis:10rem; }
${scope} :is(.dshwv-restag,.dshwv-resdel,.dshwv-resplay,.dshwv-resimp) {
  max-width:100%; white-space:normal; overflow-wrap:anywhere;
}
${scope}.dshwv-qedit,${scope}.dshwv-usagepanel,${scope}.dshwv-tplhelp,
${scope}.dshwv-rolelist,${scope}.dshwv-audiolist,${scope}.dshwv-slotlist,${scope}.dshwv-rgbmenu {
  box-sizing:border-box; max-width:calc(100vw - 1rem) !important;
  max-height:calc(100dvh - 1rem); overflow:auto; overscroll-behavior:contain;
}
${scope} :is(.dshwv-rgbopt,.dshwv-feslot) { white-space:normal; overflow-wrap:anywhere; }
`;

  function restore() {
    style.remove();
    for (const [element, original] of marked) {
      if (element.getAttribute(attribute) !== owner) continue;
      if (original === null) element.removeAttribute(attribute);
      else element.setAttribute(attribute, original);
    }
    marked.clear();
  }

  function sync() {
    pending = false;
    if (disposed) return;
    enabled = locale.getSnapshot().active === 'ru'
      && !!doc.querySelector('.dshwv-root')
      && /^v?0\.4\.2$/.test(doc.querySelector('.dshwv-ver')?.textContent.trim() || '');
    if (!enabled) { restore(); return; }
    for (const [element, original] of marked) if (!element.isConnected) {
      if (element.getAttribute(attribute) === owner) {
        if (original === null) element.removeAttribute(attribute); else element.setAttribute(attribute, original);
      }
      marked.delete(element);
    }
    for (const element of doc.querySelectorAll(surfaces)) {
      if (!marked.has(element)) marked.set(element, element.getAttribute(attribute));
      if (element.getAttribute(attribute) !== owner) element.setAttribute(attribute, owner);
    }

    let positioning = '';
    // Read the widget's own inline anchor, not the corrected rectangle: no feedback drift.
    // Only the menu is bounded. Never move/resize the root, mascot or custom bubble.
    const menu = doc.querySelector('.dshwv-menu');
    if (menu && win) {
      const viewportWidth = doc.documentElement.clientWidth || win.innerWidth;
      const viewportHeight = win.innerHeight;
      const width = Math.min(25 * (parseFloat(win.getComputedStyle(doc.documentElement).fontSize) || 16), Math.max(0, viewportWidth - 16));
      const left = menu.style.left;
      const right = menu.style.right;
      const bottom = menu.style.bottom;
      const px = value => /^-?\d+(?:\.\d+)?px$/.test(value) ? parseFloat(value) : null;
      const anchor = px(left) !== null ? px(left) : px(right) !== null ? viewportWidth - px(right) - width : null;
      const x = anchor === null ? null : Math.max(8, Math.min(anchor, viewportWidth - width - 8));
      const nativeBottom = px(bottom);
      // Preserve the above-mascot anchor whenever there is room; near the top make
      // space for a usable scrolling menu instead of pushing its top off-screen.
      const y = nativeBottom === null ? 8 : Math.max(8, Math.min(nativeBottom, viewportHeight - Math.min(360, viewportHeight - 16) - 8));
      positioning = `${scope}.dshwv-menu{${x === null ? '' : `left:${x}px !important;right:auto !important;`}bottom:${y}px !important;top:auto !important;max-height:${Math.max(0, viewportHeight - y - 8)}px !important;}`;
    }
    const next = css + positioning;
    if (style.textContent !== next) style.textContent = next;
    if (!style.isConnected) (doc.head || doc.documentElement).appendChild(style);
  }

  function schedule() {
    if (disposed || pending) return;
    pending = true;
    queueMicrotask(sync);
  }
  const observer = new win.MutationObserver(records => {
    const related = element => element?.nodeType === 1 && (element.matches?.(surfaces + ',.dshwv-root,.dshwv-ver') || element.closest?.(surfaces));
    if (!records.some(record => {
      if (record.target === style || style.contains(record.target)) return false;
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (related(target)) return true;
      return [...record.addedNodes, ...record.removedNodes].some(node => related(node) || node.nodeType === 1 && node.querySelector?.(surfaces));
    })) return;
    schedule();
  });
  observer.observe(doc.documentElement, {
    subtree:true, childList:true, characterData:true,
    attributes:true, attributeFilter:['class', 'style'],
  });
  const unsubscribe = locale.subscribe(sync);
  win.addEventListener('resize', schedule);
  win.visualViewport?.addEventListener('resize', schedule);
  sync();
  return function cleanup() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    unsubscribe();
    win.removeEventListener('resize', schedule);
    win.visualViewport?.removeEventListener('resize', schedule);
    restore();
  };
}
