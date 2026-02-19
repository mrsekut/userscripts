export {};

/**
 * Parses the next page title from the page text.
 *
 * このようなページのフォーマットを前提にしている
 * ```
 * prev: [015]
 * next: [017]
 * ...
 * ```
 */
function parseNextPageTitle(pageText: string) {
  const nextLineMatch = pageText.match(/^next:\s*\[(.*?)\]/m);
  if (nextLineMatch && nextLineMatch[1]) {
    return nextLineMatch[1].replace(/\s/g, '_');
  }
  return null;
}

cosense.PageMenu.addMenu({
  title: 'book',
  image: 'https://i.gyazo.com/c24ee728d18f60cdeccf124cfe55eafa.png',
});

cosense.PageMenu('book').addItem({
  title: 'ページ内容をコピー',
  image: 'https://gyazo.com/a1171e2083db9a394dc80072bbeb82da/raw',
  onClick: main,
});

async function main() {
  const { render, close, log, isShown } = modal();

  // TODO: clean
  const onSubmit = async (endPage: string) => {
    const start = cosense.Page.title!;
    const generator = pagesContentGenerator(start, endPage);

    let result = '';
    for await (const { title, content } of generator) {
      if (!isShown()) {
        log('Process aborted.');
        break;
      }

      result += content;
      log(title);
      await sleep(200);
    }

    await navigator.clipboard.writeText(result);
    console.log('Content copied to clipboard:', result);
    close();
  };

  render(onSubmit);
}

function modal() {
  type OnSubmit = (endPage: string) => Promise<void>;
  const container = $('<div></div>');
  let shown = false;

  function render(onSubmit: OnSubmit) {
    shown = true;
    const thisPage = cosense.Page.title;

    const formHtml = `
			<div id="inputForm" style="position:fixed;top:20%;left:30%;background:white;padding:20px;box-shadow:0 0 10px rgba(0,0,0,0.5);display:grid;grid-template-rows:auto auto auto;gap:10px;z-index:10;">
				<div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
					<div style="font-size:2rem;">ページ範囲を入力</div>
					<button id="closeButton" style="background:none;border:none;font-size:1.2em;cursor:pointer;">&times;</button>
				</div>
				<div style="">close or reload で中断</div>
				<div>
					<p>${thisPage} ~ <input id="endPage" placeholder="091" style="width:16rem;"></p>
				</div>
				<div style="display:flex;justify-content:space-between;">
					<button id="submitButton">submit</button>
				</div>
				<div id="logContainer" style="color:gray;font-size:0.9em;"></div>
			</div>
		`;
    container.html(formHtml);
    $('body').append(container);

    setupEventListeners(onSubmit);
  }

  function close() {
    shown = false;
    container.remove();
  }

  function isShown() {
    return shown;
  }

  function setupEventListeners(onSubmit: OnSubmit) {
    $('#submitButton').on('click', () => {
      const endPage = $('#endPage').val() as string;
      onSubmit(endPage);
    });

    $('#closeButton').on('click', close);
  }

  function log(message: string) {
    const logContainer = $('#logContainer');
    logContainer.append(`<div>${message}</div>`);
  }

  return { render, close, log, isShown };
}

/**
 * ページ内容を逐次取得する
 */
async function* pagesContentGenerator(start: string, end: string) {
  let currentTitle = start;

  while (true) {
    const pageText = await pageBody(currentTitle);
    yield { title: currentTitle, content: pageText };

    if (currentTitle === end) {
      break;
    }

    const nextPageTitle = parseNextPageTitle(pageText);
    if (nextPageTitle == null) {
      break;
    }

    currentTitle = nextPageTitle;
  }
}

async function pageBody(title: string) {
  const n = cosense.Project.name;
  const url = encodeURI(`https://scrapbox.io/api/pages/${n}/${title}/text`);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch page ${title}`);
  }

  return await res.text();
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
