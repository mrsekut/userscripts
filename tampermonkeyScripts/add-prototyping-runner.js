// ==UserScript==
// @name         Cosense → prototyping-runner
// @namespace    http://tampermonkey.net/
// @version      0.4
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

  const PORT = 35719;
  const REPO_BASE =
    'https://github.com/mrsekut/prototypings/tree/master/projects';

  function postTask(text) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: `http://localhost:${PORT}/tasks`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ text }),
        onload: res => {
          const data = JSON.parse(res.responseText);
          if (data.ok) {
            resolve();
          } else {
            reject(new Error(data.error || 'Unknown error'));
          }
        },
        onerror: err => {
          reject(err);
        },
      });
    });
  }

  const waitForReady = setInterval(() => {
    const hasEditor = document.querySelector('.editor');
    const hasScrapbox =
      unsafeWindow.scrapbox && unsafeWindow.scrapbox.PopupMenu;
    if (hasEditor && hasScrapbox) {
      clearInterval(waitForReady);
      init();
    }
  }, 500);

  function buildResultText(text) {
    const lines = text.split('\n');
    const contentIdx = lines.findIndex(l => l.trim() !== '');
    if (contentIdx === -1) return null;

    const contentLine = lines[contentIdx];
    const description = contentLine.trim();
    const protoUrl = `${REPO_BASE}/${encodeURI(description)}`;
    const indent = contentLine.match(/^(\s*)/)[0] + ' ';
    const protoLine = `${indent}→ [proto ${protoUrl}]`;

    return [
      ...lines.slice(0, contentIdx + 1),
      protoLine,
      ...lines.slice(contentIdx + 1),
    ].join('\n');
  }

  function init() {
    unsafeWindow.scrapbox.PopupMenu.addButton({
      title: 'idea',
      onClick: async text => {
        try {
          const projectName = unsafeWindow.scrapbox.Project.name;
          const pageTitle = unsafeWindow.scrapbox.Page.title;
          const sourceUrl = `https://scrapbox.io/${projectName}/${pageTitle}`;
          const textWithSource = `${text}\n元ページ: ${sourceUrl}`;
          await postTask(textWithSource);
          return buildResultText(text);
        } catch (e) {
          console.error('[prototyping-runner] Failed:', e);
          return undefined;
        }
      },
    });
  }
})();
