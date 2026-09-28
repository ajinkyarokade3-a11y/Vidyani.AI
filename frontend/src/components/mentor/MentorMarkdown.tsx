import type { ReactNode } from "react";

type MentorMarkdownProps = {
  content: string;
};

type MarkdownBlock =
  | { type: "code"; language: string; content: string }
  | { type: "heading"; level: number; content: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; content: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export function MentorMarkdown({ content }: MentorMarkdownProps) {
  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700">
      {parseBlocks(content).map((block, index) =>
        renderBlock(block, `${block.type}-${index}`)
      )}
    </div>
  );
}

function renderBlock(block: MarkdownBlock, key: string): ReactNode {
  if (block.type === "code") {
    return (
      <div className="overflow-hidden rounded-md bg-slate-950" key={key}>
        {block.language ? (
          <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold text-slate-400">
            {block.language}
          </div>
        ) : null}
        <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-100">
          <code>{block.content}</code>
        </pre>
      </div>
    );
  }

  if (block.type === "heading") {
    const className =
      block.level <= 2
        ? "text-lg font-bold text-slate-950"
        : "text-base font-bold text-slate-950";
    return (
      <div className={className} key={key}>
        {renderInline(block.content)}
      </div>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag
        className={
          block.ordered
            ? "list-decimal space-y-1 pl-5"
            : "list-disc space-y-1 pl-5"
        }
        key={key}
      >
        {block.items.map((item, index) => (
          <li key={`${key}-${index}`}>{renderInline(item)}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "table") {
    return (
      <div className="overflow-x-auto rounded-md border border-slate-200" key={key}>
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {block.headers.map((header, index) => (
                <th className="border-b border-slate-200 px-3 py-2" key={index}>
                  {renderInline(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr className="border-b border-slate-100 last:border-0" key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td className="px-3 py-2 align-top" key={cellIndex}>
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <p key={key}>{renderInline(block.content)}</p>;
}

function parseBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += index < lines.length ? 1 : 0;
      blocks.push({ type: "code", language, content: codeLines.join("\n") });
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        content: heading[2],
      });
      index += 1;
      continue;
    }

    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];
      const pattern = isOrdered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/;
      while (index < lines.length) {
        const match = pattern.exec(lines[index]);
        if (!match) {
          break;
        }
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ type: "list", ordered: isOrdered, items });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isSpecialBlockStart(lines, index)
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", content: paragraph.join(" ") });
  }

  return blocks;
}

function isSpecialBlockStart(lines: string[], index: number): boolean {
  const line = lines[index];
  return (
    line.startsWith("```") ||
    /^(#{1,6})\s+/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    (line.includes("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1]))
  );
}

function isTableSeparator(line: string): boolean {
  return splitTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(content: string): ReactNode[] {
  const tokens = content.split(/(\*\*.+?\*\*|`.+?`|\*.+?\*)/g);
  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-900"
          key={index}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}
