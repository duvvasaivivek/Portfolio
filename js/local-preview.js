// Classic script intentionally works when someone double-clicks the HTML file.
if (location.protocol === 'file:') {
  const notice = document.createElement('aside');
  notice.className = 'local-preview-notice';
  notice.setAttribute('role', 'status');
  const message = document.createElement('p');
  message.textContent = 'For the interactive 3D portfolio, double-click “Open Portfolio.cmd” in the portfolio folder. Keep its preview window open.';
  const link = document.createElement('a');
  link.href = 'http://127.0.0.1:8766/#experience';
  link.textContent = 'Open running 3D preview →';
  notice.append(message, link);
  document.body.prepend(notice);
}
