/**
 * Minimal markdown-to-DOM renderer for the README panel.
 * Handles the subset of markdown used in the project README:
 * headings, paragraphs, code blocks, inline code, bold, links,
 * unordered lists, blockquotes, tables, and horizontal rules.
 * All content is from the static README.md file — no user input.
 */
/** Convert heading text to a URL-safe slug matching GitHub's anchor format */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function renderMarkdown(md: string, container: HTMLElement) {
  const lines = md.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip HTML tags (logo image, alignment divs)
    if (line.trimStart().startsWith("<")) {
      i++;
      continue;
    }

    // Skip badge images
    if (line.trimStart().startsWith("[![")) {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line.trim())) {
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
      const el = document.createElement(tag);
      el.id = slugify(headingMatch[2]);
      appendInline(el, headingMatch[2], container);
      container.appendChild(el);
      i++;
      continue;
    }

    // Code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      highlightCode(code, codeLines.join("\n"), lang);
      pre.appendChild(code);
      container.appendChild(pre);
      continue;
    }

    // Table
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|[\s\-:|]+\|\s*$/.test(lines[i + 1])
    ) {
      const tableEl = document.createElement("table");
      const headerCells = parsePipeRow(line);
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      for (const cell of headerCells) {
        const th = document.createElement("th");
        appendInline(th, cell, container);
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      tableEl.appendChild(thead);
      i += 2; // skip header + separator

      const tbody = document.createElement("tbody");
      while (i < lines.length && lines[i].includes("|")) {
        const cells = parsePipeRow(lines[i]);
        const row = document.createElement("tr");
        for (const cell of cells) {
          const td = document.createElement("td");
          appendInline(td, cell, container);
          row.appendChild(td);
        }
        tbody.appendChild(row);
        i++;
      }
      tableEl.appendChild(tbody);
      container.appendChild(tableEl);
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith(">")) {
      const bq = document.createElement("blockquote");
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        bqLines.push(lines[i].replace(/^>\s*/, ""));
        i++;
      }
      const p = document.createElement("p");
      appendInline(p, bqLines.join(" "), container);
      bq.appendChild(p);
      container.appendChild(bq);
      continue;
    }

    // Unordered list (including nested with 2-space indent)
    if (/^\s*[-*]\s+/.test(line)) {
      const ul = document.createElement("ul");
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const indent = lines[i].match(/^(\s*)/);
        const depth = indent ? indent[1].length : 0;

        if (depth >= 2) {
          // Nested list item — append to last li
          const lastLi = ul.lastElementChild;
          if (lastLi) {
            let nestedUl = lastLi.querySelector("ul");
            if (!nestedUl) {
              nestedUl = document.createElement("ul");
              lastLi.appendChild(nestedUl);
            }
            const li = document.createElement("li");
            appendInline(li, lines[i].replace(/^\s*[-*]\s+/, ""), container);
            nestedUl.appendChild(li);
          }
        } else {
          const li = document.createElement("li");
          appendInline(li, lines[i].replace(/^\s*[-*]\s+/, ""), container);
          ul.appendChild(li);
        }
        i++;
      }
      container.appendChild(ul);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("#") &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].trimStart().startsWith(">") &&
      !lines[i].trimStart().startsWith("---") &&
      !lines[i].trimStart().startsWith("<") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !(
        lines[i].includes("|") &&
        i + 1 < lines.length &&
        /^\s*\|[\s\-:|]+\|\s*$/.test(lines[i + 1])
      )
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      const p = document.createElement("p");
      appendInline(p, paraLines.join(" "), container);
      container.appendChild(p);
    }
  }
}

function parsePipeRow(line: string): string[] {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c !== "");
}

/** Render inline markdown (bold, code, links) into a parent element using safe DOM methods */
function appendInline(parent: HTMLElement, text: string, container?: HTMLElement) {
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parent.appendChild(
        document.createTextNode(text.slice(lastIndex, match.index))
      );
    }

    if (match[1] !== undefined) {
      const strong = document.createElement("strong");
      appendInline(strong, match[1], container);
      parent.appendChild(strong);
    } else if (match[2] !== undefined) {
      const code = document.createElement("code");
      code.textContent = match[2];
      parent.appendChild(code);
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const a = document.createElement("a");
      a.textContent = match[3];
      // Only set href for anchor links and known safe domains
      if (match[4].startsWith("#")) {
        const targetId = match[4].slice(1);
        a.href = match[4];
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const root = container ?? parent.closest(".readme-content");
          const target = root?.querySelector(`#${CSS.escape(targetId)}`);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      } else if (
        match[4].startsWith("https://github.com/") ||
        match[4].startsWith("https://robot.hetzner.com") ||
        match[4].startsWith("https://console.hetzner.cloud") ||
        match[4].startsWith("https://www.hetzner.com/") ||
        match[4].startsWith("https://www.npmjs.com/") ||
        match[4].startsWith("https://opensource.org/")
      ) {
        a.href = match[4];
        a.target = "_blank";
        a.rel = "noopener";
      }
      parent.appendChild(a);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parent.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

function span(cls: string, text: string): HTMLSpanElement {
  const el = document.createElement("span");
  el.className = `hl-${cls}`;
  el.textContent = text;
  return el;
}

function highlightCode(code: HTMLElement, text: string, lang: string) {
  if (lang === "bash" || lang === "sh") {
    highlightBash(code, text);
  } else if (lang === "typescript" || lang === "ts") {
    highlightTS(code, text);
  } else {
    highlightPlain(code, text);
  }
}

function highlightBash(code: HTMLElement, text: string) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) code.appendChild(document.createTextNode("\n"));
    const line = lines[i];

    if (/^\s*#/.test(line)) {
      code.appendChild(span("comment", line));
      continue;
    }

    const pattern = /(["'])(?:(?!\1).)*\1|(\$\([^)]*\))|(\$\w+)|(#.*$)|(--?\w[\w-]*)([=])?|([|>&]+)|(\S+)/g;
    let match: RegExpExecArray | null;
    let last = 0;
    while ((match = pattern.exec(line)) !== null) {
      if (match.index > last) {
        code.appendChild(document.createTextNode(line.slice(last, match.index)));
      }
      const token = match[0];
      if (match[1] !== undefined) {
        code.appendChild(span("string", token));
      } else if (match[2] !== undefined) {
        code.appendChild(span("string", token));
      } else if (match[3] !== undefined) {
        code.appendChild(span("string", token));
      } else if (match[4] !== undefined) {
        code.appendChild(span("comment", token));
      } else if (match[5] !== undefined) {
        code.appendChild(span("flag", match[5]));
        if (match[6]) code.appendChild(document.createTextNode(match[6]));
      } else if (match[7] !== undefined) {
        code.appendChild(span("op", token));
      } else {
        const word = match[8] as string;
        if (last === 0 || line.slice(0, match.index).trimEnd().endsWith("|")) {
          if (word === "export" || word === "echo") {
            code.appendChild(span("keyword", word));
          } else {
            code.appendChild(span("cmd", word));
          }
        } else {
          code.appendChild(document.createTextNode(word));
        }
      }
      last = match.index + token.length;
    }
    if (last < line.length) {
      code.appendChild(document.createTextNode(line.slice(last)));
    }
  }
}

function highlightTS(code: HTMLElement, text: string) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) code.appendChild(document.createTextNode("\n"));
    const line = lines[i];

    if (/^\s*\/\//.test(line)) {
      code.appendChild(span("comment", line));
      continue;
    }

    const pattern = /(\/\/.*$)|('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")|(`(?:[^`\\]|\\.)*`)|(\b(?:import|export|from|const|let|var|await|async|new|function|return|if|else)\b)|(\b\d+\b)|([{}()[\];,.])|(\b\w+)(?=\s*\()/g;
    let match: RegExpExecArray | null;
    let last = 0;
    while ((match = pattern.exec(line)) !== null) {
      if (match.index > last) {
        code.appendChild(document.createTextNode(line.slice(last, match.index)));
      }
      const token = match[0];
      if (match[1] !== undefined) {
        code.appendChild(span("comment", token));
      } else if (match[2] !== undefined || match[3] !== undefined || match[4] !== undefined) {
        code.appendChild(span("string", token));
      } else if (match[5] !== undefined) {
        code.appendChild(span("keyword", token));
      } else if (match[6] !== undefined) {
        code.appendChild(span("number", token));
      } else if (match[7] !== undefined) {
        code.appendChild(span("op", token));
      } else if (match[8] !== undefined) {
        code.appendChild(span("fn", token));
      } else {
        code.appendChild(document.createTextNode(token));
      }
      last = match.index + token.length;
    }
    if (last < line.length) {
      code.appendChild(document.createTextNode(line.slice(last)));
    }
  }
}

function highlightPlain(code: HTMLElement, text: string) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) code.appendChild(document.createTextNode("\n"));
    const line = lines[i];
    const pattern = /(--?\w[\w-]*)(\s+<[^>]+>)?/g;
    let match: RegExpExecArray | null;
    let last = 0;
    while ((match = pattern.exec(line)) !== null) {
      if (match.index > last) {
        code.appendChild(document.createTextNode(line.slice(last, match.index)));
      }
      code.appendChild(span("flag", match[1]));
      if (match[2]) {
        code.appendChild(span("string", match[2]));
      }
      last = match.index + match[0].length;
    }
    if (last < line.length) {
      code.appendChild(document.createTextNode(line.slice(last)));
    }
  }
}
