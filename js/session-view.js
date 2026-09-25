/*
  session-view.js — the shared view for session-style screens (vocab drill,
  alphabet lessons, later parsing and reading). It owns the progress bar,
  the intro / question / feedback / summary cards and the footer button, and
  it knows nothing about lessons, SRS or XP: the screen's own script decides
  what to show and what an answer means.

  Markup contract (see drill.html): #body, #footer, #continueBtn, #progressFill.
  Every visual value comes from theme tokens via css/base.css.
*/

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/** Speaker button markup (same as js/speech.js's; duplicated here so the view stays dependency-free). */
export function speakerHtml(text, { small = false, verse = false } = {}) {
  const esc = String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<button class="speak-btn ${small ? 'small' : ''}" type="button" data-speak="${esc}" ${verse ? 'data-speak-mode="verse"' : ''} aria-label="Listen" title="Listen">
    <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </button>`;
}

export function greekKeyboardHtml() {
  const letters = 'αβγδεζηθικλμνξοπρστυφχψω'.split('');
  return `<div class="kbd" id="kbd">` +
    letters.map((l) => `<button type="button" data-key="${l}">${l}</button>`).join('') +
    `<button type="button" data-key="ς">ς</button>` +
    `<button type="button" class="wide" data-key="bs">⌫</button>` +
    `</div>`;
}

export class SessionView {
  constructor() {
    this.body = document.getElementById('body');
    this.footer = document.getElementById('footer');
    this.continueBtn = document.getElementById('continueBtn');
    this.progressFill = document.getElementById('progressFill');
    this.onContinue = null;
    this.onKey = null;
    document.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if ((e.key === 'Enter' || e.key === ' ') && !this.footer.hidden) {
        e.preventDefault();
        if (this.onContinue) this.onContinue();
      } else if (this.onKey && /^[1-6]$/.test(e.key)) {
        this.onKey(parseInt(e.key, 10));
      }
    });
  }

  setProgress(fraction) {
    this.progressFill.style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
  }

  showFooter(label, onClick) {
    this.continueBtn.textContent = label;
    this.continueBtn.onclick = onClick;
    this.onContinue = onClick;
    this.footer.hidden = false;
    let hint = this.footer.querySelector('.key-hint');
    if (!hint) { hint = document.createElement('span'); hint.className = 'key-hint'; this.footer.appendChild(hint); }
    hint.innerHTML = '<kbd>Enter</kbd> to continue';
  }

  hideFooter() {
    this.footer.hidden = true;
    this.onContinue = null;
  }

  /** A presentation card (rule, new item). `html` is trusted markup built by the caller. */
  renderIntro({ kicker, html, note = '', buttonLabel = 'Got it' }, onNext) {
    this.onKey = null;
    this.body.innerHTML = `
      <div class="drill-kicker">${escapeHtml(kicker)}</div>
      ${html}
      ${note ? `<p class="session-note">${escapeHtml(note)}</p>` : ''}`;
    this.showFooter(buttonLabel, onNext);
    this.body.scrollTop = 0;
  }

  /**
   * A retrieval step. Either `options` (multiple choice: [{id, text, greek?}]) or
   * `typed` ({greek, placeholder}). onAnswer(input) gets the option id or the text.
   */
  renderQuestion({ kicker, prompt, promptGreek = true, promptHtml = null, hint = '', options = null, typed = null, speak = null }, onAnswer) {
    this.hideFooter();
    const main = promptHtml || `<div class="prompt-main ${promptGreek ? '' : 'english'}">${escapeHtml(prompt)}</div>`;
    let html = `
      <div class="drill-kicker">${escapeHtml(kicker)}</div>
      <div class="card prompt">
        ${speak ? `<div class="prompt-row">${main}${speakerHtml(speak)}</div>` : main}
        ${hint ? `<div class="prompt-hint">${escapeHtml(hint)}</div>` : ''}
      </div>`;
    if (options) {
      const long = options.some((o) => (o.text || '').length > 28);
      html += `<div class="options ${long ? 'long' : ''}" id="options">` + options.map((o, i) => `
        <button class="option ${o.greek ? 'greek' : ''}" type="button" data-id="${escapeHtml(o.id)}">
          <span class="key">${i + 1}</span><span>${o.html || escapeHtml(o.text)}</span>
        </button>`).join('') + `</div>`;
    } else {
      html += `
        <form class="type-row" id="typeForm" autocomplete="off">
          <input class="type-input ${typed.greek ? 'greek' : ''}" id="typeInput" type="text" autocapitalize="off" autocorrect="off" spellcheck="false"
                 placeholder="${escapeHtml(typed.placeholder || '')}" lang="${typed.greek ? 'el' : 'en'}">
          <button class="btn" type="submit">Check</button>
        </form>`;
      if (typed.greek) html += greekKeyboardHtml();
    }
    html += `<div class="feedback" id="feedback"></div>`;
    this.body.innerHTML = html;
    this.body.scrollTop = 0;

    let done = false;
    const answer = (input) => { if (done) return; done = true; this.onKey = null; onAnswer(input); };
    if (options) {
      this.body.querySelectorAll('.option').forEach((btn) => btn.addEventListener('click', () => answer(btn.dataset.id)));
      this.onKey = (n) => { if (n >= 1 && n <= options.length) answer(options[n - 1].id); };
    } else {
      const input = document.getElementById('typeInput');
      document.getElementById('typeForm').addEventListener('submit', (e) => { e.preventDefault(); if (input.value.trim()) answer(input.value); });
      this.body.querySelectorAll('.kbd button').forEach((k) => k.addEventListener('click', () => {
        if (k.dataset.key === 'bs') input.value = input.value.slice(0, -1); else input.value += k.dataset.key;
        input.focus();
      }));
      input.focus();
      this.onKey = null;
    }
  }

  /** Lock the answered question and colour the correct / chosen options (or the typed input). */
  markAnswer({ correctId = null, chosenId = null, ok = null }) {
    this.body.querySelectorAll('.option').forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.id === correctId) btn.classList.add('correct');
      else if (btn.dataset.id === chosenId) btn.classList.add('wrong');
    });
    const input = document.getElementById('typeInput');
    if (input) {
      input.disabled = true;
      input.classList.add(ok ? 'correct' : 'wrong');
      const submit = this.body.querySelector('#typeForm .btn');
      if (submit) submit.disabled = true;
      this.body.querySelectorAll('.kbd button').forEach((k) => { k.disabled = true; });
    }
  }

  /** The feedback panel (PEDAGOGY M18: correct answer + one-line reason). */
  showFeedback({ ok, headline, answer, reason, xp = 0 }, onContinue, buttonLabel = 'Continue') {
    const el = document.getElementById('feedback');
    el.className = `feedback show ${ok ? '' : 'bad'}`;
    el.innerHTML = `
      <div class="feedback-headline">${escapeHtml(headline)}${xp ? ` · +${xp} XP` : ''}</div>
      <div class="feedback-answer">${escapeHtml(answer)}</div>
      ${reason ? `<div class="feedback-reason">${escapeHtml(reason)}</div>` : ''}`;
    this.showFooter(buttonLabel, onContinue);
    el.scrollIntoView({ block: 'nearest' });
  }

  renderSummary({ kicker = 'Session complete', html, buttonLabel = 'Back to path' }, onClick) {
    this.onKey = null;
    this.setProgress(1);
    this.body.innerHTML = `<div class="drill-kicker">${escapeHtml(kicker)}</div>${html}`;
    this.showFooter(buttonLabel, onClick);
    this.body.scrollTop = 0;
  }

  /** "Pick up where you left off?" — Resume in the footer, Start over as a secondary button. */
  renderResume({ title, detail }, onResume, onRestart) {
    this.onKey = null;
    this.body.innerHTML = `
      <div class="drill-kicker">Welcome back</div>
      <div class="card">
        <div class="rule-title">${escapeHtml(title)}</div>
        <p class="rule-body">${escapeHtml(detail)}</p>
        <div style="margin-top:12px"><button class="btn secondary" id="restartBtn" type="button">Start over</button></div>
      </div>`;
    document.getElementById('restartBtn').addEventListener('click', onRestart);
    this.showFooter('Resume', onResume);
    this.body.scrollTop = 0;
  }

  renderError(message) {
    this.hideFooter();
    this.body.innerHTML = `<div class="card">${escapeHtml(message)}</div>`;
  }
}
