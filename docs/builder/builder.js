/* ============================================
   nano-zyrkel Builder — Logic
   ============================================ */

const wizard = {
    step: 1,
    data: {
        url: '',
        condition: '',
        interval: 'daily',
        silenceEnabled: false,
        silenceFreq: 'daily',
        email: ''
    },

    /* ---- Navigation ---- */

    goTo(step) {
        if (step < 1 || step > 5) return;

        // Leaving step 4? skip validation
        if (step === 4) this.renderPreview();

        const oldEl = document.querySelector('.wizard-step.active');
        if (oldEl) oldEl.classList.remove('active');

        const newEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
        if (newEl) {
            newEl.classList.remove('active');
            // Force reflow for animation
            void newEl.offsetWidth;
            newEl.classList.add('active');
        }

        this.step = step;
        this.updateProgress();
    },

    next() {
        if (!this.validate()) return;
        this.saveCurrentStep();
        this.goTo(this.step + 1);
    },

    prev() {
        this.saveCurrentStep();
        this.goTo(this.step - 1);
    },

    /* ---- Validation ---- */

    validate() {
        switch (this.step) {
            case 1: {
                const input = document.getElementById('inputUrl');
                const val = input.value.trim();
                if (!val) {
                    this.shake(input);
                    input.classList.add('error');
                    return false;
                }
                // Basic URL check
                try {
                    new URL(val.startsWith('http') ? val : 'https://' + val);
                } catch {
                    this.shake(input);
                    input.classList.add('error');
                    return false;
                }
                input.classList.remove('error');
                return true;
            }
            case 2: {
                const input = document.getElementById('inputCondition');
                if (!input.value.trim()) {
                    this.shake(input);
                    input.classList.add('error');
                    return false;
                }
                input.classList.remove('error');
                return true;
            }
            case 3: {
                const input = document.getElementById('inputEmail');
                const val = input.value.trim();
                if (!val || !val.includes('@') || !val.includes('.')) {
                    this.shake(input);
                    input.classList.add('error');
                    return false;
                }
                input.classList.remove('error');
                return true;
            }
            default:
                return true;
        }
    },

    shake(el) {
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => { el.style.animation = ''; }, 500);
    },

    /* ---- Save/Restore ---- */

    saveCurrentStep() {
        switch (this.step) {
            case 1:
                this.data.url = document.getElementById('inputUrl').value.trim();
                if (this.data.url && !this.data.url.startsWith('http')) {
                    this.data.url = 'https://' + this.data.url;
                }
                break;
            case 2:
                this.data.condition = document.getElementById('inputCondition').value.trim();
                break;
            case 3:
                this.data.email = document.getElementById('inputEmail').value.trim();
                this.data.silenceEnabled = document.getElementById('silenceToggle').checked;
                break;
        }
    },

    /* ---- Helpers ---- */

    setCondition(btn) {
        document.getElementById('inputCondition').value = btn.textContent;
    },

    setInterval(btn) {
        document.querySelectorAll('.interval-card').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        this.data.interval = btn.dataset.interval;
    },

    toggleSilence() {
        const checked = document.getElementById('silenceToggle').checked;
        this.data.silenceEnabled = checked;
        document.getElementById('silenceOptions').classList.toggle('hidden', !checked);
    },

    setSilenceFreq(btn) {
        document.querySelectorAll('.silence-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.data.silenceFreq = btn.dataset.freq;
    },

    /* ---- Progress ---- */

    updateProgress() {
        const fill = document.getElementById('progressFill');
        const pct = this.step >= 5 ? 100 : (this.step / 4) * 100;
        fill.style.width = pct + '%';

        document.querySelectorAll('.step-indicator').forEach(ind => {
            const s = parseInt(ind.dataset.step);
            ind.classList.remove('active', 'done');
            if (s === this.step && this.step <= 4) ind.classList.add('active');
            else if (s < this.step) ind.classList.add('done');
        });
    },

    /* ---- Interval Label ---- */

    intervalLabel(key) {
        const map = { hourly: 'Stuendlich', daily: 'Taeglich', weekly: 'Woechentlich' };
        return map[key] || key;
    },

    silenceFreqLabel(key) {
        const map = { daily: 'Taeglich', weekly: 'Woechentlich' };
        return map[key] || key;
    },

    /* ---- Timestamp ---- */

    now() {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },

    shortUrl(url) {
        try {
            const u = new URL(url);
            let s = u.hostname + u.pathname;
            if (s.length > 35) s = s.substring(0, 32) + '...';
            return s;
        } catch {
            return url.length > 35 ? url.substring(0, 32) + '...' : url;
        }
    },

    /* ---- Email Preview Render ---- */

    renderPreview() {
        this.saveCurrentStep();
        const d = this.data;
        const ts = this.now();

        // Alert email
        document.getElementById('alertPreview').innerHTML = `
            <div class="email-body">
                <div class="email-header">
                    <span class="email-header-hex">\u2B21</span>
                    <div class="email-header-text">
                        <strong>nano-zyrkel</strong>
                        Tracker-Benachrichtigung
                    </div>
                </div>
                <div class="email-status alert">
                    \uD83D\uDD14 Aenderung erkannt!
                </div>
                <div class="email-details">
                    <div class="email-detail-row">
                        <span class="email-detail-label">URL</span>
                        <span class="email-detail-value">${this.esc(this.shortUrl(d.url))}</span>
                    </div>
                    <div class="email-detail-row">
                        <span class="email-detail-label">Bedingung</span>
                        <span class="email-detail-value">${this.esc(d.condition)}</span>
                    </div>
                    <div class="email-detail-row">
                        <span class="email-detail-label">Erkannt am</span>
                        <span class="email-detail-value">${ts}</span>
                    </div>
                    <div class="email-detail-row">
                        <span class="email-detail-label">Intervall</span>
                        <span class="email-detail-value">${this.intervalLabel(d.interval)}</span>
                    </div>
                </div>
                <div class="email-message">
                    Dein nano-zyrkel hat eine Aenderung auf der beobachteten Seite festgestellt. Die definierte Bedingung <strong>&bdquo;${this.esc(d.condition)}&ldquo;</strong> scheint eingetreten zu sein.
                </div>
                <div class="email-footer">
                    Powered by <span class="email-footer-hex">\u2B21</span> nano-zyrkel
                </div>
            </div>
        `;

        // Silence email
        document.getElementById('silencePreview').innerHTML = `
            <div class="email-body">
                <div class="email-header">
                    <span class="email-header-hex">\u2B21</span>
                    <div class="email-header-text">
                        <strong>nano-zyrkel</strong>
                        Status-Bericht
                    </div>
                </div>
                <div class="email-status ok">
                    \u2705 Keine Aenderung
                </div>
                <div class="email-details">
                    <div class="email-detail-row">
                        <span class="email-detail-label">URL</span>
                        <span class="email-detail-value">${this.esc(this.shortUrl(d.url))}</span>
                    </div>
                    <div class="email-detail-row">
                        <span class="email-detail-label">Bedingung</span>
                        <span class="email-detail-value">${this.esc(d.condition)}</span>
                    </div>
                    <div class="email-detail-row">
                        <span class="email-detail-label">Geprueft am</span>
                        <span class="email-detail-value">${ts}</span>
                    </div>
                    <div class="email-detail-row">
                        <span class="email-detail-label">Naechste Pruefung</span>
                        <span class="email-detail-value">${this.intervalLabel(d.interval)}</span>
                    </div>
                </div>
                <div class="email-message">
                    Dein nano-zyrkel laeuft einwandfrei. Die Bedingung <strong>&bdquo;${this.esc(d.condition)}&ldquo;</strong> ist bisher nicht eingetreten. Der Tracker beobachtet die Seite weiterhin.
                </div>
                <div class="email-footer">
                    Powered by <span class="email-footer-hex">\u2B21</span> nano-zyrkel
                </div>
            </div>
        `;

        // Summary
        document.getElementById('summaryBox').innerHTML = `
            <div class="summary-row">
                <span class="summary-label">Ziel-URL</span>
                <span class="summary-value">${this.esc(this.shortUrl(d.url))}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Bedingung</span>
                <span class="summary-value">${this.esc(d.condition)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Pruef-Intervall</span>
                <span class="summary-value">${this.intervalLabel(d.interval)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Stille-Bestaetigung</span>
                <span class="summary-value">${d.silenceEnabled ? this.silenceFreqLabel(d.silenceFreq) : 'Aus'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">E-Mail</span>
                <span class="summary-value">${this.esc(d.email)}</span>
            </div>
        `;
    },

    esc(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    },

    /* ---- Create ---- */

    create() {
        const btn = document.getElementById('btnCreate');
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-hex">\u2B21</span> Wird erstellt...';

        // Simulate creation delay
        setTimeout(() => {
            const d = this.data;
            document.getElementById('successDetails').innerHTML = `
                <div class="success-row">
                    <span class="success-label">URL</span>
                    <span class="success-value">${this.esc(this.shortUrl(d.url))}</span>
                </div>
                <div class="success-row">
                    <span class="success-label">Bedingung</span>
                    <span class="success-value">${this.esc(d.condition)}</span>
                </div>
                <div class="success-row">
                    <span class="success-label">Intervall</span>
                    <span class="success-value">${this.intervalLabel(d.interval)}</span>
                </div>
                <div class="success-row">
                    <span class="success-label">E-Mail</span>
                    <span class="success-value">${this.esc(d.email)}</span>
                </div>
            `;

            btn.disabled = false;
            btn.innerHTML = '<span class="btn-hex">\u2B21</span> Nano-Zyrkel erstellen';
            this.goTo(5);
        }, 1200);
    },

    /* ---- Reset ---- */

    reset() {
        this.data = {
            url: '',
            condition: '',
            interval: 'daily',
            silenceEnabled: false,
            silenceFreq: 'daily',
            email: ''
        };
        document.getElementById('inputUrl').value = '';
        document.getElementById('inputCondition').value = '';
        document.getElementById('inputEmail').value = '';
        document.getElementById('silenceToggle').checked = false;
        document.getElementById('silenceOptions').classList.add('hidden');
        document.querySelectorAll('.interval-card').forEach(c => c.classList.remove('selected'));
        document.querySelector('.interval-card[data-interval="daily"]').classList.add('selected');
        document.querySelectorAll('.silence-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector('.silence-btn[data-freq="daily"]').classList.add('selected');
        this.goTo(1);
    }
};

/* ---- Init ---- */

document.addEventListener('DOMContentLoaded', () => {
    wizard.updateProgress();

    // Remove error class on input
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('input', () => input.classList.remove('error'));
    });

    // Enter key advances
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                wizard.next();
            }
        });
    });
});

/* ---- Shake animation (injected) ---- */

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
}
`;
document.head.appendChild(shakeStyle);
