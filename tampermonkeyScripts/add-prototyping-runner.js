// ==UserScript==
// @name         Cosense → prototyping-runner
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Send selected text to prototyping-runner
// @match        https://scrapbox.io/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

// localで常駐するprototyping-runnerへアイディアを送信する

(function () {
  'use strict';

  console.log('[prototyping-runner] Tampermonkey script loaded');

  // Wait for scrapbox API to be ready (check for .editor DOM element like cosense-userscript-dev does)
  const waitForReady = setInterval(() => {
    const hasEditor = document.querySelector('.editor');
    const hasScrapbox =
      unsafeWindow.scrapbox && unsafeWindow.scrapbox.PopupMenu;
    console.log(
      '[prototyping-runner] waiting... editor:',
      !!hasEditor,
      'scrapbox:',
      !!hasScrapbox,
    );
    if (hasEditor && hasScrapbox) {
      clearInterval(waitForReady);
      init();
    }
  }, 500);

  function init() {
    unsafeWindow.scrapbox.PopupMenu.addButton({
      title: 'idea',
      onClick: text => {
        console.log('[prototyping-runner] onClick called with:', text);
        GM_xmlhttpRequest({
          method: 'POST',
          url: 'http://localhost:35719/tasks', // prototyping-runnerのAPIエンドポイント
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ text }),
          onload: res => {
            alert('sent!');
            console.log('[prototyping-runner] Sent:', res.responseText);
          },
          onerror: err => {
            console.error('[prototyping-runner] Failed:', err);
          },
        });
        return undefined; // don't modify selected text
      },
    });
  }
})();
