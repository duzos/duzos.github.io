// Theme toggle. The page follows the system colour scheme until the visitor
// picks one; the choice is stored under the same `theme` key as before.
(function () {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    function current() {
        return root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
    }

    function label() {
        toggle.setAttribute('aria-label', 'Switch to ' + (current() === 'dark' ? 'light' : 'dark') + ' theme');
    }

    toggle.hidden = false;
    label();

    toggle.addEventListener('click', () => {
        const next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
        label();
    });

    systemDark.addEventListener('change', label);
})();
