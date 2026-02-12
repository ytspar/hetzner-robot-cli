import { escapeHtml } from "./terminal.ts";

interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  color?: string;
}

export function formatTable(
  columns: Column[],
  rows: Record<string, string | number | boolean>[],
  footer?: string
): string {
  // Calculate column widths
  const widths = columns.map((col) => {
    const headerLen = col.label.length;
    const maxData = rows.reduce((max, row) => {
      const val = String(row[col.key] ?? "");
      return Math.max(max, val.length);
    }, 0);
    return Math.max(headerLen, maxData);
  });

  const pad = (s: string, w: number, align: "left" | "right" = "left") => {
    if (align === "right") return s.padStart(w);
    return s.padEnd(w);
  };

  const esc = escapeHtml;

  // Borders
  const top =
    '<span class="c-dim">┌' +
    widths.map((w) => "─".repeat(w + 2)).join("┬") +
    "┐</span>";
  const mid =
    '<span class="c-dim">├' +
    widths.map((w) => "─".repeat(w + 2)).join("┼") +
    "┤</span>";
  const bot =
    '<span class="c-dim">└' +
    widths.map((w) => "─".repeat(w + 2)).join("┴") +
    "┘</span>";

  // Header row
  const header =
    '<span class="c-dim">│</span>' +
    columns
      .map((col, i) => {
        const padded = pad(col.label, widths[i]);
        return ` <span class="c-cyan c-bold">${esc(padded)}</span> `;
      })
      .join('<span class="c-dim">│</span>') +
    '<span class="c-dim">│</span>';

  // Data rows
  const dataRows = rows.map((row) => {
    return (
      '<span class="c-dim">│</span>' +
      columns
        .map((col, i) => {
          const val = String(row[col.key] ?? "");
          const padded = pad(val, widths[i], col.align);
          if (col.color) {
            return ` <span class="${col.color}">${esc(padded)}</span> `;
          }
          return ` ${esc(padded)} `;
        })
        .join('<span class="c-dim">│</span>') +
      '<span class="c-dim">│</span>'
    );
  });

  const lines = [top, header, mid, ...dataRows, bot];

  if (footer) {
    lines.push(`<span class="c-dim">${esc(footer)}</span>`);
  }

  return `<pre class="table-output">${lines.join("\n")}</pre>`;
}

export function formatDetail(
  title: string,
  properties: [string, string, string?][]
): string {
  const maxKeyLen = properties.reduce(
    (max, [key]) => Math.max(max, key.length),
    0
  );

  const esc = escapeHtml;

  const lines = [
    `<span class="c-cyan c-bold">${esc(title)}</span>`,
    '<span class="c-dim">' + "─".repeat(60) + "</span>",
  ];

  for (const [key, value, color] of properties) {
    const paddedKey = key.padEnd(maxKeyLen);
    const colorClass = color || "c-white";
    lines.push(
      `  <span class="c-gray">${esc(paddedKey)}</span>  <span class="${colorClass}">${esc(value)}</span>`
    );
  }

  return `<pre class="table-output">${lines.join("\n")}</pre>`;
}

export function formatJson(data: unknown): string {
  const json = JSON.stringify(data, null, 2);
  // Syntax highlight JSON
  const highlighted = escapeHtml(json)
    .replace(
      /&quot;([^&]*)&quot;\s*:/g,
      '<span class="json-key">&quot;$1&quot;</span>:'
    )
    .replace(
      /:\s*&quot;([^&]*)&quot;/g,
      ': <span class="json-string">&quot;$1&quot;</span>'
    )
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(
      /:\s*(true|false)/g,
      ': <span class="json-bool">$1</span>'
    )
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');

  return `<pre class="json-output">${highlighted}</pre>`;
}

export function formatError(message: string): string {
  return `<div class="output-line output-error">Error: ${escapeHtml(message)}</div>`;
}

export function formatSuccess(message: string): string {
  return `<div class="output-line c-green">${escapeHtml(message)}</div>`;
}

export function formatInfo(message: string): string {
  return `<div class="output-line c-dim">${escapeHtml(message)}</div>`;
}
