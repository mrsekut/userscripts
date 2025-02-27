export {};

// https://scrapbox.io/mrsekut-p/Cosense上のメモに適度に批判してくれるbot
// @ts-check
cosense.PageMenu.addMenu({
	title: "ask",
	image: "https://gyazo.com/cda5cc71ecf260c8e200ef14c1660e8f/raw",
	onClick: main,
});

async function main() {
	const lines: Line[] = cosense.Page.lines.map((l, i) => ({
		text: l.text,
		index: i,
	}));
	const answer = await askChatGPT(lines);
	updateLines(lines, answer);
}

function updateLines(lines: Line[], answers: AnswerLine[]) {
	answers.reduce((offset, ans) => {
		const originalLine = lines.find((l) => l.index === ans.index);
		if (!originalLine) return offset;

		const indent = createIndent(countIndent(originalLine.text) + 1);
		cosense.Page.insertLine(indent + ans.text, ans.index + 1 + offset);

		return offset + 1;
	}, 0);
}

function countIndent(text: string) {
	const match = text.match(/^(\s*)/);
	return match ? match[1].length : 0;
}

function createIndent(count: number) {
	return " ".repeat(count);
}

type Line = {
	text: string;
	index: number;
};

type AnswerLine = {
	index: number; // Line.indexに対する返答
	text: string;
};

async function askChatGPT(lines: Line[]): Promise<Line[]> {
	const systemPrompt = `
  あなたはCosenseのコメントアシスタントです。
  以下の制約と要件を守って、ユーザーからの指示に応えてください。

  - 出力はJSONの配列である
  - 各要素は { "index": number, "text": string } の形とする
  - "index"はコメントを追加したい元の行のindex番号（0はタイトル行、1以降は本文）
  - "text"は改行なしの1行文章で、末尾に[gpt-4.icon]をつける
  - 必要がない行には返答をしなくてもよい（その場合は配列要素を作らない）
		- 多くても全体で3箇所程度で良い
  - コメントは適度に短い文にする
  `;

	const userPrompt = `
	以下にCosenseの各行を示します（indexとtext）。
	これに対して、有益な指摘、批判、疑問の投げかけ、質問への適切な返答を行ってください

	Lines:
	${JSON.stringify(lines, null, 2)}
	`;

	const result = await openAI(userPrompt, systemPrompt);
	return result.sort((a, b) => a.index - b.index);
}

async function openAI(prompt: string, systemPrompt: string): Promise<Line[]> {
	const apiKey = localStorage.getItem("OPENAI_API_KEY");
	if (!apiKey) {
		throw new Error("OpenAI APIキーが設定されていません。");
	}

	const requestBody = {
		model: "gpt-4o-mini",
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: prompt },
		],
		temperature: 0.7,
		max_tokens: 1000,
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "CosenseAnswer",
				strict: true,
				schema: {
					type: "object",
					properties: {
						lines: {
							type: "array",
							items: {
								type: "object",
								properties: {
									index: { type: "number" },
									text: { type: "string" },
								},
								required: ["index", "text"],
								additionalProperties: false,
							},
						},
					},
					required: ["lines"],
					additionalProperties: false,
				},
			},
		},
	};

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(requestBody),
	});

	const json = await response.json();
	const content = json.choices?.[0]?.message?.content ?? "{}";

	try {
		const parsed = JSON.parse(content);
		return parsed.lines ?? ([] as Line[]);
	} catch (e) {
		throw new Error("JSON parse error: " + e);
	}
}
