/* =============================================
   KINGDOM BUSINESS LUNCH — SCRIPT
   Rise Up Kings · riseupkings.com/kingdom-business-lunch
   ============================================= */

'use strict';

// -----------------------------------------------
// CONFIG — update these before going live
// -----------------------------------------------
const CONFIG = {
    API_URL: '/api/rsvp',
    EVENT_DATES: [
        { value: '2026-08-04', month: 'August',    day: '4',  year: '2026' },
        { value: '2026-09-01', month: 'September', day: '1',  year: '2026' },
        { value: '2026-10-06', month: 'October',   day: '6',  year: '2026' },
        { value: '2026-11-03', month: 'November',  day: '3',  year: '2026' },
    ],
};

// -----------------------------------------------
// TRACKING — capture & persist URL params
// -----------------------------------------------
function captureURLParams() {
    const params = new URLSearchParams(window.location.search);
    const keys = ['source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    keys.forEach(key => {
        const val = params.get(key);
        if (val) {
            // Sanitize: only allow alphanumeric, hyphens, underscores
            const safe = val.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 100);
            if (safe) sessionStorage.setItem('kbl_' + key, safe);
        }
    });
}

function getTracking() {
    const keys = ['source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    const params = new URLSearchParams(window.location.search);
    const tracking = {};
    keys.forEach(key => {
        const fromURL = params.get(key);
        const fromSession = sessionStorage.getItem('kbl_' + key);
        const raw = fromURL || fromSession || '';
        tracking[key] = raw.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 100);
    });
    return tracking;
}

function populateHiddenFields() {
    const tracking = getTracking();
    Object.entries(tracking).forEach(([key, val]) => {
        const field = document.getElementById(key);
        if (field) field.value = val;
    });
}

// -----------------------------------------------
// CONDITIONAL FORM FIELDS
// Cold traffic (ad / referral) sees extra fields.
// Warm leads (pen / invite) get a shorter form.
// -----------------------------------------------
function handleConditionalFields() {
    const source = (getTracking().source || '').toLowerCase();
    const isWarm = source === 'pen' || source === 'invite';

    document.querySelectorAll('.form-conditional').forEach(el => {
        el.style.display = isWarm ? 'none' : '';
    });
}

// -----------------------------------------------
// GUEST FIELD TOGGLE
// -----------------------------------------------
function initGuestToggle() {
    const radios = document.querySelectorAll('input[name="bringingGuest"]');
    const guestFields = document.getElementById('guest-fields');
    const guestHint   = document.getElementById('guest-hint');
    if (!guestFields) return;

    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            const bringing = document.querySelector('input[name="bringingGuest"]:checked');
            const isYes = bringing && bringing.value === 'yes';
            guestFields.style.display = isYes ? '' : 'none';
            if (guestHint) guestHint.style.display = isYes ? '' : 'none';
        });
    });
}

// -----------------------------------------------
// NEXT DATE DISPLAY (hero pill)
// -----------------------------------------------
function updateNextDateDisplay() {
    const el = document.getElementById('next-date-display');
    if (!el) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = CONFIG.EVENT_DATES.find(d => {
        const dt = new Date(d.value + 'T00:00:00');
        return dt >= today;
    });

    if (next) {
        const dt = new Date(next.value + 'T00:00:00');
        const formatted = dt.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
        el.textContent = formatted;
    }
}

// -----------------------------------------------
// DATES GRID (section #dates)
// -----------------------------------------------
function renderDatesGrid() {
    const grid = document.getElementById('dates-grid');
    if (!grid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let foundNext = false;

    CONFIG.EVENT_DATES.forEach(d => {
        const dt = new Date(d.value + 'T00:00:00');
        const isPast = dt < today;
        const isNext = !isPast && !foundNext;
        if (isNext) foundNext = true;

        const scene = document.createElement('div');
        const classes = ['date-scene'];
        if (isNext) classes.push('date-scene--next');
        if (isPast) classes.push('date-scene--past');
        scene.className = classes.join(' ');

        // Safe: all values are from CONFIG constant, not user input
        scene.innerHTML =
            '<div class="scene-ghost">' + d.month + '</div>' +
            '<div class="scene-num">' + d.day + '</div>' +
            '<div class="scene-info">' +
                '<div class="scene-month">' + d.month + '<span class="scene-month-day"> ' + d.day + ',</span> ' + d.year + '</div>' +
                '<div class="scene-meta">Tuesday &middot; 12:00\u20132:00 PM &middot; RUK HQ, Dallas\u2013Fort Worth</div>' +
            '</div>' +
            '<div class="scene-badge' + (isNext ? '' : ' scene-badge--hidden') + '">' + (isNext ? 'Next Up' : '') + '</div>';

        grid.appendChild(scene);
    });
}

// -----------------------------------------------
// FORM VALIDATION
// -----------------------------------------------
function validateForm(data) {
    const errors = [];
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!data.firstName.trim()) errors.push({ field: 'firstName', msg: 'First name is required.' });
    if (!data.lastName.trim())  errors.push({ field: 'lastName',  msg: 'Last name is required.' });

    if (!data.email.trim()) {
        errors.push({ field: 'email', msg: 'Email is required.' });
    } else if (!emailRe.test(data.email)) {
        errors.push({ field: 'email', msg: 'Please enter a valid email address.' });
    }

    if (!data.mobile.trim()) errors.push({ field: 'mobile',  msg: 'Mobile number is required.' });
    if (!data.company.trim()) errors.push({ field: 'company', msg: 'Company is required.' });
    if (!data.role.trim())    errors.push({ field: 'role',    msg: 'Role is required.' });

    if (!data.dates || data.dates.length === 0) {
        errors.push({ field: 'dates', msg: 'Please select at least one date.' });
    }

    return errors;
}

function clearValidationUI() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.form-error-inline').forEach(el => el.remove());
    const datesErr = document.getElementById('dates-error');
    if (datesErr) datesErr.style.display = 'none';
}

function showValidationErrors(errors) {
    errors.forEach(({ field, msg }) => {
        if (field === 'dates') {
            const el = document.getElementById('dates-error');
            if (el) { el.textContent = msg; el.style.display = 'block'; }
            return;
        }
        const input = document.getElementById(field);
        if (input) {
            input.classList.add('input-error');
            const span = document.createElement('span');
            span.className = 'form-error-inline';
            span.textContent = msg;
            input.parentNode.appendChild(span);
        }
    });

    // Scroll to first problem
    const first = document.querySelector('.input-error, .form-error-dates');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// -----------------------------------------------
// ANALYTICS HELPERS
// -----------------------------------------------
function fireConversionEvents(data) {
    // GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'rsvp_submit', {
            event_category: 'RSVP',
            event_label: data.dates.join(','),
            source: data.source,
        });
    }
    // Meta Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: 'Kingdom Business Lunch RSVP',
            content_category: 'Event RSVP',
        });
    }
}

// -----------------------------------------------
// FORM SUBMIT HANDLER
// -----------------------------------------------
async function handleFormSubmit(e) {
    e.preventDefault();
    clearValidationUI();

    const form = e.target;
    const submitBtn  = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');

    // Collect values
    const selectedDates = Array.from(
        form.querySelectorAll('input[name="dates"]:checked, input[name="dates"][type="hidden"]')
    ).map(cb => cb.value);

    const bringingGuest = (
        form.querySelector('input[name="bringingGuest"]:checked') || {}
    ).value || 'no';

    const tracking = getTracking();

    const payload = {
        firstName:    form.firstName.value.trim(),
        lastName:     form.lastName.value.trim(),
        email:        form.email.value.trim().toLowerCase(),
        mobile:       form.mobile.value.trim(),
        company:      form.company.value.trim(),
        role:         form.role.value.trim(),
        dates:        selectedDates,
        date_attending: selectedDates.map(d => {
            const dt = new Date(d + 'T00:00:00');
            return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }).join(', '),
        industry:     (form.industry    ? form.industry.value.trim()    : ''),
        city:         (form.city        ? form.city.value.trim()        : ''),
        heard_about:  (form.heard_about ? form.heard_about.value.trim() : ''),
        bringingGuest,
        guest1Name:   (bringingGuest === 'yes' && form.guest1Name  ? form.guest1Name.value.trim()  : ''),
        guest1Email:  (bringingGuest === 'yes' && form.guest1Email ? form.guest1Email.value.trim().toLowerCase() : ''),
        guest2Name:   (bringingGuest === 'yes' && form.guest2Name  ? form.guest2Name.value.trim()  : ''),
        guest2Email:  (bringingGuest === 'yes' && form.guest2Email ? form.guest2Email.value.trim().toLowerCase() : ''),
        // Tracking
        source:       tracking.source,
        utm_source:   tracking.utm_source,
        utm_medium:   tracking.utm_medium,
        utm_campaign: tracking.utm_campaign,
        utm_content:  tracking.utm_content,
        // GHL tags
        tags: [
            'kbl-rsvp',
            ...selectedDates.map(d => 'kbl-' + d),
            tracking.source ? 'source-' + tracking.source : '',
        ].filter(Boolean),
    };

    // Validate
    const errors = validateForm(payload);
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }

    // Loading state
    submitBtn.disabled = true;
    if (submitText)    submitText.style.display = 'none';
    if (submitLoading) submitLoading.style.display = 'inline';

    try {
        fireConversionEvents(payload);

        await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const dateParam = selectedDates.length > 0
            ? '?dates=' + encodeURIComponent(selectedDates.join(','))
            : '';
        window.location.href = '/confirmation.html' + dateParam;

    } catch (err) {
        console.error('[KBL] Submission error:', err);

        // Reset button
        submitBtn.disabled = false;
        if (submitText)    submitText.style.display = 'inline';
        if (submitLoading) submitLoading.style.display = 'none';

        // Surface a generic error beneath the button
        const existing = document.getElementById('submit-error');
        if (!existing) {
            const errEl = document.createElement('p');
            errEl.id = 'submit-error';
            errEl.className = 'form-error-inline';
            errEl.style.textAlign = 'center';
            errEl.style.marginTop = '0.5rem';
            errEl.textContent = 'Something went wrong. Please try again or email us directly at support@riseupkings.com';
            submitBtn.after(errEl);
        }
    }
}

function showConfirmation() {
    const cardEl     = document.getElementById('rsvp-form-card');
    const confirmEl  = document.getElementById('rsvp-confirmation');
    if (cardEl)    cardEl.style.display = 'none';
    if (confirmEl) {
        confirmEl.style.display = 'block';
        confirmEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// -----------------------------------------------
// FAQ ACCORDION
// -----------------------------------------------
function initFAQ() {
    document.querySelectorAll('.faq__question').forEach(btn => {
        btn.addEventListener('click', () => {
            const isOpen  = btn.getAttribute('aria-expanded') === 'true';
            const answer  = btn.nextElementSibling;

            // Close all
            document.querySelectorAll('.faq__question').forEach(q => {
                q.setAttribute('aria-expanded', 'false');
                const a = q.nextElementSibling;
                if (a) a.classList.remove('open');
            });

            // Open this one (toggle)
            if (!isOpen) {
                btn.setAttribute('aria-expanded', 'true');
                if (answer) answer.classList.add('open');
            }
        });
    });
}

// -----------------------------------------------
// NAV — subtle border on scroll
// -----------------------------------------------
function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    const onScroll = () => {
        nav.style.borderBottomColor = window.scrollY > 40
            ? 'rgba(201, 168, 76, 0.18)'
            : 'rgba(255,255,255,0.07)';
    };

    window.addEventListener('scroll', onScroll, { passive: true });
}

// -----------------------------------------------
// SMOOTH SCROLL — offset for fixed nav
// -----------------------------------------------
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const id = anchor.getAttribute('href');
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const navHeight = (document.getElementById('nav') || {}).offsetHeight || 70;
            const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

// -----------------------------------------------
// INIT
// -----------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    captureURLParams();
    populateHiddenFields();
    handleConditionalFields();
    initGuestToggle();
    updateNextDateDisplay();
    renderDatesGrid();
    initFAQ();
    initNavScroll();
    initSmoothScroll();

    const form = document.getElementById('rsvp-form');
    if (form) form.addEventListener('submit', handleFormSubmit);
});
