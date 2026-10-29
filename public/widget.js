(function () {
  var s = document.currentScript;
  var API = new URL(s.src).origin + '/api/chat';
  var pos = s.getAttribute('data-position') === 'left' ? 'left' : 'right';
  var title = s.getAttribute('data-title') || 'Explore AI';
  var color = s.getAttribute('data-color') || '#0B2A5B';
  var accent = s.getAttribute('data-accent') || '#F57C00';
  var greet = s.getAttribute('data-greeting') ||
    'Hello! 👋 I am Explore AI. What kind of institute are you looking for: school, college, university or coaching? Tell me your city and budget.';
  var chips = ['O Level schools in Karachi', 'MDCAT coaching', 'Low fee colleges'];
  var history = [];

  var css = '.emi-b{position:fixed;bottom:22px;' + pos + ':22px;width:74px;height:74px;border-radius:50%;background:' + accent + ';color:#fff;border:0;font-size:34px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35);z-index:99999;transition:transform .2s}' +
    '.emi-b:hover{transform:scale(1.08)}' +
    '.emi-w{position:fixed;bottom:108px;' + pos + ':22px;width:360px;max-width:calc(100vw - 24px);height:520px;max-height:calc(100vh - 130px);background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:99999;font-family:system-ui,Arial,sans-serif}' +
    '.emi-h{background:' + color + ';color:#fff;padding:14px 16px;font-weight:600;display:flex;justify-content:space-between;align-items:center}' +
    '.emi-h span{cursor:pointer;font-size:20px}' +
    '.emi-m{flex:1;overflow-y:auto;padding:12px;background:#f5f7fb;display:flex;flex-direction:column;gap:8px}' +
    '.emi-x{max-width:85%;padding:8px 11px;border-radius:12px;font-size:12.5px;line-height:1.45;word-wrap:break-word}' +
    '.emi-bot{background:#fff;color:#111;align-self:flex-start;border:1px solid #e3e7ef}' +
    '.emi-me{background:' + color + ';color:#fff;align-self:flex-end}' +
    '.emi-c{display:flex;flex-wrap:wrap;gap:6px}' +
    '.emi-c button{background:#fff;border:1px solid ' + accent + ';color:' + accent + ';border-radius:14px;padding:5px 10px;font-size:12px;cursor:pointer}' +
    '.emi-f{display:flex;border-top:1px solid #e3e7ef;background:#fff}' +
    '.emi-f input{flex:1;border:0;padding:14px;font-size:13px;outline:none}' +
    '.emi-f button{border:0;background:' + accent + ';color:#fff;padding:0 18px;font-size:15px;cursor:pointer}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var box = document.createElement('div');
  box.innerHTML =
    '<button class="emi-b" aria-label="Chat">💬</button>' +
    '<div class="emi-w"><div class="emi-h">' + title + '<span>×</span></div>' +
    '<div class="emi-m"></div>' +
    '<div class="emi-f"><input placeholder="Type your question..." /><button>➤</button></div></div>';
  document.body.appendChild(box);

  var btn = box.querySelector('.emi-b'), win = box.querySelector('.emi-w'),
      msgs = box.querySelector('.emi-m'), input = box.querySelector('input'),
      send = box.querySelector('.emi-f button'), closeX = box.querySelector('.emi-h span');

  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function add(text, who) {
    var d = document.createElement('div');
    d.className = 'emi-x ' + (who === 'me' ? 'emi-me' : 'emi-bot');
    d.innerHTML = fmt(text);
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }

  add(greet, 'bot');
  var cw = document.createElement('div'); cw.className = 'emi-c';
  chips.forEach(function (c) {
    var b = document.createElement('button'); b.textContent = c;
    b.onclick = function () { cw.remove(); ask(c); };
    cw.appendChild(b);
  });
  msgs.appendChild(cw);

  function ask(text) {
    text = text.trim(); if (!text) return;
    add(text, 'me'); input.value = '';
    history.push({ role: 'user', text: text });
    var t = add('...', 'bot');
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var reply = d.reply || 'Sorry, please try again.';
        t.innerHTML = fmt(reply);
        history.push({ role: 'bot', text: reply });
        msgs.scrollTop = msgs.scrollHeight;
      })
      .catch(function () { t.innerHTML = 'Connection problem, please try again.'; });
  }

  btn.onclick = function () { win.style.display = win.style.display === 'flex' ? 'none' : 'flex'; };
  closeX.onclick = function () { win.style.display = 'none'; };
  send.onclick = function () { ask(input.value); };
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(input.value); });
})();
