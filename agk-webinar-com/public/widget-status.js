// Observe display readiness only. GetCourse owns submission and success redirects.
(() => {
  const root = document.querySelector('.registration-widget');
  if (!root) return;
  const status = root.querySelector('.widget-loading');
  const observer = new MutationObserver(check);
  const timeout = setTimeout(() => {
    if (!status.hidden) status.textContent = 'Форма загружается дольше обычного. Можно открыть её по ссылке ниже';
  }, 15000);
  function check() {
    const frame = root.querySelector('iframe');
    if (!frame) return;
    frame.title = 'Форма регистрации на вебинар';
    if (frame.getBoundingClientRect().height > 50) {
      status.hidden = true;
      clearTimeout(timeout);
      observer.disconnect();
    }
  }
  observer.observe(root.querySelector('.registration-widget-embed'), {childList:true, subtree:true, attributes:true, attributeFilter:['style']});
  check();
})();
