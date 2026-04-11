/* ═══════════════════════════════════════════════════════════════
   nano-zyrkel Visual Studio — Editor Overlay
   Injected into the iframe to enable visual editing.
   Communicates with parent via postMessage.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  let nzIdCounter = 0;
  let selectedEl = null;
  let dragSrcEl = null;

  // ─── ASSIGN IDs ──────────────────────────────────────────────
  function assignIds() {
    const selectors = 'header, nav, main, section, footer, .card, .grid > *, .panel, ' +
      'h1, h2, h3, h4, p, span:not(.nz-ignore), a, button, ' +
      'table, thead, tbody, tr, td, th, img, canvas, svg, ' +
      'input, select, textarea, label, ' +
      '.stat, .status, .subtitle, .card-title, .widget';
    document.querySelectorAll(selectors).forEach(function(el) {
      if (!el.dataset.nzId) {
        el.dataset.nzId = 'nz-' + (nzIdCounter++);
      }
    });
  }

  // ─── MAKE TEXT EDITABLE ──────────────────────────────────────
  function enableEditing() {
    const textSelectors = 'h1, h2, h3, h4, p, a, button, span, td, th, label, .subtitle, .card-title, .stat-value, .stat-label';
    document.querySelectorAll(textSelectors).forEach(function(el) {
      // Skip elements that contain other block elements
      if (el.querySelector('div, section, header, footer, table, ul, ol')) return;
      // Skip script/style content
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;

      el.contentEditable = 'true';
      el.dataset.nzEditable = 'true';
      el.spellcheck = false;

      el.addEventListener('input', function() {
        parent.postMessage({
          type: 'nz-edit',
          id: el.dataset.nzId,
          text: el.textContent,
          html: el.innerHTML
        }, '*');
      });

      el.addEventListener('focus', function(e) {
        e.stopPropagation();
        selectElement(el);
      });
    });
  }

  // ─── SELECTION ───────────────────────────────────────────────
  function selectElement(el) {
    if (selectedEl) selectedEl.classList.remove('nz-selected');
    selectedEl = el;
    el.classList.add('nz-selected');

    var rect = el.getBoundingClientRect();
    var styles = window.getComputedStyle(el);

    parent.postMessage({
      type: 'nz-select',
      id: el.dataset.nzId,
      tag: el.tagName.toLowerCase(),
      classes: el.className.replace('nz-selected', '').trim(),
      text: el.textContent,
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      styles: {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        padding: styles.padding,
        margin: styles.margin,
        textAlign: styles.textAlign,
        display: styles.display,
        gridColumn: styles.gridColumn,
        gridRow: styles.gridRow
      }
    }, '*');
  }

  document.addEventListener('click', function(e) {
    // Don't interfere with contenteditable
    if (e.target.contentEditable === 'true') return;

    var target = e.target.closest('[data-nz-id]');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      selectElement(target);
    }
  }, true);

  // Deselect on click on empty space
  document.addEventListener('click', function(e) {
    if (!e.target.closest('[data-nz-id]')) {
      if (selectedEl) selectedEl.classList.remove('nz-selected');
      selectedEl = null;
      parent.postMessage({ type: 'nz-deselect' }, '*');
    }
  });

  // ─── DRAG AND DROP ───────────────────────────────────────────
  function enableDrag() {
    var draggables = document.querySelectorAll('.grid > *, .card, section > div, section > article');
    draggables.forEach(function(el) {
      el.draggable = true;
      el.addEventListener('dragstart', handleDragStart);
      el.addEventListener('dragover', handleDragOver);
      el.addEventListener('drop', handleDrop);
      el.addEventListener('dragend', handleDragEnd);
    });
  }

  function handleDragStart(e) {
    dragSrcEl = this;
    this.classList.add('nz-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.nzId);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('nz-drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('nz-drag-over');

    if (dragSrcEl && dragSrcEl !== this) {
      // Swap positions
      var parent_el = dragSrcEl.parentNode;
      var srcNext = dragSrcEl.nextSibling;
      var tgtNext = this.nextSibling;
      var tgtParent = this.parentNode;

      if (parent_el === tgtParent) {
        // Same parent: swap
        parent_el.insertBefore(dragSrcEl, this);
        parent_el.insertBefore(this, srcNext);
      } else {
        // Different parents: move
        tgtParent.insertBefore(dragSrcEl, this);
        parent_el.insertBefore(this, srcNext);
      }

      parent.postMessage({
        type: 'nz-reorder',
        srcId: dragSrcEl.dataset.nzId,
        tgtId: this.dataset.nzId
      }, '*');
    }
  }

  function handleDragEnd() {
    this.classList.remove('nz-dragging');
    document.querySelectorAll('.nz-drag-over').forEach(function(el) {
      el.classList.remove('nz-drag-over');
    });
  }

  // ─── RECEIVE COMMANDS FROM PARENT ────────────────────────────
  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'nz-insert') {
      // Insert new HTML element
      var container = document.querySelector('main') || document.querySelector('.grid') || document.body;
      if (msg.targetId) {
        var target = document.querySelector('[data-nz-id="' + msg.targetId + '"]');
        if (target) container = target;
      }
      var wrapper = document.createElement('div');
      wrapper.innerHTML = msg.html;
      var newEl = wrapper.firstElementChild;
      if (newEl) {
        newEl.dataset.nzId = 'nz-' + (nzIdCounter++);
        container.appendChild(newEl);
        enableEditingForElement(newEl);
        newEl.draggable = true;
        newEl.addEventListener('dragstart', handleDragStart);
        newEl.addEventListener('dragover', handleDragOver);
        newEl.addEventListener('drop', handleDrop);
        newEl.addEventListener('dragend', handleDragEnd);
        selectElement(newEl);
      }
    }

    if (msg.type === 'nz-update-style') {
      var el = document.querySelector('[data-nz-id="' + msg.id + '"]');
      if (el) {
        Object.keys(msg.styles).forEach(function(key) {
          el.style[key] = msg.styles[key];
        });
      }
    }

    if (msg.type === 'nz-update-text') {
      var el2 = document.querySelector('[data-nz-id="' + msg.id + '"]');
      if (el2) el2.textContent = msg.text;
    }

    if (msg.type === 'nz-delete') {
      var el3 = document.querySelector('[data-nz-id="' + msg.id + '"]');
      if (el3) {
        el3.remove();
        if (selectedEl === el3) {
          selectedEl = null;
          parent.postMessage({ type: 'nz-deselect' }, '*');
        }
      }
    }

    if (msg.type === 'nz-get-html') {
      // Export clean HTML without editor artifacts
      var clone = document.documentElement.cloneNode(true);
      // Remove editor overlay script
      clone.querySelectorAll('script[data-nz-overlay]').forEach(function(s) { s.remove(); });
      // Remove editor CSS
      clone.querySelectorAll('style[data-nz-overlay]').forEach(function(s) { s.remove(); });
      // Clean up editor attributes
      clone.querySelectorAll('[data-nz-id]').forEach(function(el) {
        el.removeAttribute('data-nz-id');
        el.removeAttribute('data-nz-editable');
        el.removeAttribute('contenteditable');
        el.removeAttribute('draggable');
        el.removeAttribute('spellcheck');
        el.classList.remove('nz-selected', 'nz-dragging', 'nz-drag-over');
      });
      parent.postMessage({
        type: 'nz-html-export',
        html: '<!DOCTYPE html>\n' + clone.outerHTML
      }, '*');
    }

    if (msg.type === 'nz-set-theme-css') {
      var existing = document.getElementById('nz-theme-css');
      if (existing) existing.remove();
      var link = document.createElement('style');
      link.id = 'nz-theme-css';
      link.textContent = msg.css;
      document.head.appendChild(link);
    }
  });

  function enableEditingForElement(el) {
    var textSelectors = 'h1, h2, h3, h4, p, a, button, span, td, th, label';
    var textEls = el.matches(textSelectors) ? [el] : el.querySelectorAll(textSelectors);
    textEls.forEach(function(t) {
      if (t.querySelector('div, section')) return;
      t.contentEditable = 'true';
      t.dataset.nzEditable = 'true';
      t.spellcheck = false;
      t.addEventListener('input', function() {
        parent.postMessage({ type: 'nz-edit', id: t.dataset.nzId, text: t.textContent }, '*');
      });
    });
  }

  // ─── RESIZE HANDLES ───────────────────────────────────────────

  var resizeState = { active: false, el: null, handle: '', startX: 0, startY: 0, startW: 0, startH: 0 };

  function addResizeHandles(el) {
    removeResizeHandles();
    if (!el) return;

    var handles = ['nz-resize-e', 'nz-resize-s', 'nz-resize-se'];
    handles.forEach(function(cls) {
      var h = document.createElement('div');
      h.className = cls;
      h.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        resizeState.active = true;
        resizeState.el = el;
        resizeState.handle = cls;
        resizeState.startX = e.clientX;
        resizeState.startY = e.clientY;
        var rect = el.getBoundingClientRect();
        resizeState.startW = rect.width;
        resizeState.startH = rect.height;
        document.body.style.cursor = cls === 'nz-resize-e' ? 'ew-resize' : cls === 'nz-resize-s' ? 'ns-resize' : 'nwse-resize';
      });
      el.appendChild(h);
    });
  }

  function removeResizeHandles() {
    document.querySelectorAll('.nz-resize-e, .nz-resize-s, .nz-resize-se').forEach(function(h) { h.remove(); });
  }

  document.addEventListener('mousemove', function(e) {
    if (!resizeState.active || !resizeState.el) return;
    var dx = e.clientX - resizeState.startX;
    var dy = e.clientY - resizeState.startY;
    var el = resizeState.el;

    if (resizeState.handle === 'nz-resize-e' || resizeState.handle === 'nz-resize-se') {
      el.style.width = Math.max(60, resizeState.startW + dx) + 'px';
    }
    if (resizeState.handle === 'nz-resize-s' || resizeState.handle === 'nz-resize-se') {
      el.style.height = Math.max(40, resizeState.startH + dy) + 'px';
    }
    el.style.maxWidth = 'none';
    el.style.overflow = 'hidden';
  });

  document.addEventListener('mouseup', function() {
    if (resizeState.active && resizeState.el) {
      parent.postMessage({
        type: 'nz-resize',
        id: resizeState.el.dataset.nzId,
        width: resizeState.el.style.width,
        height: resizeState.el.style.height
      }, '*');
      document.body.style.cursor = '';
    }
    resizeState.active = false;
    resizeState.el = null;
  });

  // Add handles when selecting
  var origSelectElement = selectElement;
  selectElement = function(el) {
    origSelectElement(el);
    addResizeHandles(el);
  };

  // ─── FREE POSITION DRAG (absolute) ──────────────────────────

  var moveState = { active: false, el: null, startX: 0, startY: 0, origLeft: 0, origTop: 0 };

  // Alt+Click to start free-move
  document.addEventListener('mousedown', function(e) {
    if (!e.altKey) return;
    var target = e.target.closest('[data-nz-id]');
    if (!target) return;
    e.preventDefault();
    moveState.active = true;
    moveState.el = target;
    moveState.startX = e.clientX;
    moveState.startY = e.clientY;

    var cs = window.getComputedStyle(target);
    if (cs.position === 'static') {
      target.style.position = 'relative';
    }
    moveState.origLeft = parseInt(cs.left) || 0;
    moveState.origTop = parseInt(cs.top) || 0;
    document.body.style.cursor = 'move';
  });

  document.addEventListener('mousemove', function(e) {
    if (!moveState.active || !moveState.el) return;
    var dx = e.clientX - moveState.startX;
    var dy = e.clientY - moveState.startY;
    moveState.el.style.left = (moveState.origLeft + dx) + 'px';
    moveState.el.style.top = (moveState.origTop + dy) + 'px';
  });

  document.addEventListener('mouseup', function() {
    if (moveState.active && moveState.el) {
      parent.postMessage({
        type: 'nz-move',
        id: moveState.el.dataset.nzId,
        left: moveState.el.style.left,
        top: moveState.el.style.top,
        position: moveState.el.style.position
      }, '*');
      document.body.style.cursor = '';
    }
    moveState.active = false;
    moveState.el = null;
  });

  // ─── EDITOR OVERLAY CSS ──────────────────────────────────────
  var overlayStyle = document.createElement('style');
  overlayStyle.dataset.nzOverlay = 'true';
  overlayStyle.textContent = [
    '.nz-selected { outline: 2px solid #8B5CF6 !important; outline-offset: 2px; position: relative; }',
    '.nz-selected::after { content: attr(data-nz-id); position: absolute; top: -20px; left: 0; font-size: 10px; background: #8B5CF6; color: #fff; padding: 1px 6px; border-radius: 3px; pointer-events: none; z-index: 9999; font-family: monospace; }',
    '[data-nz-editable]:hover { outline: 1px dashed rgba(139,92,246,0.3); outline-offset: 1px; }',
    '[data-nz-editable]:focus { outline: 2px solid #06b6d4 !important; outline-offset: 1px; }',
    '.nz-dragging { opacity: 0.5; }',
    '.nz-drag-over { outline: 2px dashed #06b6d4 !important; outline-offset: 4px; }',
    '[draggable]:not([contenteditable="true"]) { cursor: grab; }',
    '[draggable]:active { cursor: grabbing; }',
    '* { transition: outline 0.1s ease; }',
    '',
    '/* Resize handles */',
    '.nz-resize-e, .nz-resize-s, .nz-resize-se { position: absolute; z-index: 10000; background: #8B5CF6; }',
    '.nz-resize-e { right: -4px; top: 20%; width: 8px; height: 60%; cursor: ew-resize; border-radius: 4px; opacity: 0.7; }',
    '.nz-resize-s { bottom: -4px; left: 20%; height: 8px; width: 60%; cursor: ns-resize; border-radius: 4px; opacity: 0.7; }',
    '.nz-resize-se { right: -5px; bottom: -5px; width: 12px; height: 12px; cursor: nwse-resize; border-radius: 3px; opacity: 0.9; }',
    '.nz-resize-e:hover, .nz-resize-s:hover, .nz-resize-se:hover { opacity: 1; background: #a78bfa; }'
  ].join('\n');
  document.head.appendChild(overlayStyle);

  // ─── INIT ────────────────────────────────────────────────────
  function init() {
    assignIds();
    enableEditing();
    enableDrag();
    parent.postMessage({ type: 'nz-ready' }, '*');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
