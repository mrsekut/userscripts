/**
 * TODO: 以下に対応していないが欲しい
 * - !
 * - generator関数の引数の型の除去
 * - 関数内で定義された関数の引数. というよりarrow functionかな
 */

/**
 * TypeScript のコード文字列から型情報を除去し、
 * 実行可能な純粋な JavaScript のコード文字列に変換する関数
 */
export function transpileTS(code: string): string {
  return removeAsAssertions(
    processVariableDeclarations(
      processFunctionDeclarations(removeTypeDefinitionBlocks(code)),
    ),
  );
}

/**
 * 型定義（type, interface, enum）のブロックを除去する関数
 * ※ 行単位に分割し、reduce で状態（skipBlock, braceCount, 出力行配列）を更新しています。
 */
export function removeTypeDefinitionBlocks(code: string): string {
  const lines = code.split('\n');
  const finalState = lines.reduce(
    (state, line) => {
      // ブロック外の場合
      if (!state.skipBlock) {
        // 行頭が type, interface, enum で始まる場合は除去
        if (/^\s*(type|interface|enum)\b/.test(line)) {
          if (line.includes('{')) {
            const newBraceCount = state.braceCount + countBraces(line);
            return {
              skipBlock: newBraceCount > 0,
              braceCount: newBraceCount,
              outputLines: state.outputLines,
            };
          } else {
            // 1行で完結する型定義はそのままスキップ
            return state;
          }
        } else {
          // それ以外は出力対象
          return {
            ...state,
            outputLines: [...state.outputLines, line],
          };
        }
      } else {
        // 型定義ブロック内の場合、ブレースの数を更新してスキップ状態を判断
        const newBraceCount = state.braceCount + countBraces(line);
        return {
          skipBlock: newBraceCount > 0,
          braceCount: newBraceCount,
          outputLines: state.outputLines,
        };
      }
    },
    { skipBlock: false, braceCount: 0, outputLines: [] as string[] },
  );
  return finalState.outputLines.join('\n');
}

/**
 * 1行の文字列中の "{" の数から "}" の数を引いた値を返す
 */
export function countBraces(line: string): number {
  const open = (line.match(/{/g) || []).length;
  const close = (line.match(/}/g) || []).length;
  return open - close;
}

/**
 * 関数宣言に含まれるパラメータの型注釈および返り値の型注釈を除去する関数
 * ※ "function" キーワードによる宣言が1行にまとまっているケースを対象としています。
 */
export function processFunctionDeclarations(code: string): string {
  const funcRegex = /^(.*function\s+[A-Za-z0-9_$]+\s*\()([^)]*)(\).*)$/gm;
  return code.replace(funcRegex, (match, head, params, tail) => {
    const newParams = params
      .split(',')
      .map(param => {
        const trimmed = param.trim();
        if (trimmed === '') return '';
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex !== -1) {
          const beforeColon = trimmed.substring(0, colonIndex).trim();
          const afterColon = trimmed.substring(colonIndex + 1);
          const equalIndex = afterColon.indexOf('=');
          if (equalIndex !== -1) {
            const defaultValue = afterColon.substring(equalIndex + 1).trim();
            return beforeColon + ' = ' + defaultValue;
          } else {
            return beforeColon;
          }
        }
        return trimmed;
      })
      .join(', ');
    // 返り値の型注釈 (": 型") を削除
    const newTail = tail.replace(/:\s*[^ {]+/, '');
    return head + newParams + newTail;
  });
}

/**
 * 変数宣言における型注釈を除去する関数
 * ※ 複数変数宣言や複雑なケースには完全対応していませんが、基本的なケースを処理します。
 */
export function processVariableDeclarations(code: string): string {
  return code
    .split('\n')
    .map(line => {
      if (/^\s*(let|const|var)\b/.test(line)) {
        return line
          .replace(/(\b(let|const|var)\s+\S+)\s*:\s*([^=;]+)/, '$1')
          .replace(/(\S)(=)/, '$1 =');
      }
      return line;
    })
    .join('\n');
}

/**
 * 型アサーション (as) を除去する関数
 * 例: 「x as string」 → 「x」
 */
export function removeAsAssertions(code: string): string {
  return code.replace(/\s+as\s+[A-Za-z0-9_<>\[\]\s,|]+/g, '');
}
