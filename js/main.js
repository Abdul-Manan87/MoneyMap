/* 
   MoneyMap — main.js
   Runs on every page
   */

(function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'overview.html';
  document.querySelectorAll('.sidebar__link').forEach((link) => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('is-active');
    }
  });
})();
