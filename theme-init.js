// theme-init.js — runs synchronously in <head> before first paint
(function() {
  var theme = localStorage.getItem('theme');
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
