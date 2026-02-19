export {};

cosense.PageMenu.addMenu({
  title: 'book',
  image: 'https://i.gyazo.com/c24ee728d18f60cdeccf124cfe55eafa.png',
});

cosense.PageMenu('book').addItem({
  title: 'open 5 pages',
  onClick: main,
});

async function main() {
  const start = cosense.Page.title ?? '';

  const generator = pagesContentGenerator(start);

  const pages = [];
  for (let i = 0; i < 6; i++) {
    const { value, done } = await generator.next();
    if (done || !value) break;
    pages.push(value);
  }

  const [, ...rest] = pages;
  openPages(rest);
}

function openPages(pages: { title: string }[]) {
  const projectName = cosense.Project.name;

  pages.forEach(page => {
    const url = `https://scrapbox.io/${projectName}/${page.title}`;
    window.open(url);
  });
}

/**
 * ページ内容を逐次取得する
 */
async function* pagesContentGenerator(start: string) {
  let currentTitle = start;

  while (true) {
    const pageText = await pageBody(currentTitle);
    yield { title: currentTitle, content: pageText };

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

function parseNextPageTitle(pageText: string) {
  const nextLineMatch = pageText.match(/^next:\s*\[(.*?)\]/m);
  if (nextLineMatch && nextLineMatch[1]) {
    return nextLineMatch[1].replace(/\s/g, '_');
  }
  return null;
}
