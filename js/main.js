/* ==========================================================================
   MoneyMap — main.js
   Runs on every page: highlights the active nav link and applies the
   saved theme before paint. Include this after storage.js on every page.
   ========================================================================== */

(function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'overview.html';
  document.querySelectorAll('.sidebar__link').forEach((link) => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('is-active');
    }
  });
})();