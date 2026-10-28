import type { ExportDoc } from "@/features/quran/plan/export/exportData";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Printable A4 page for expo-print. `fontBase64` is an optional TTF so Persian
 * text looks the same on every device.
 */
export function buildPlanHtml(doc: ExportDoc, fontBase64?: string): string {
  const dir = doc.rtl ? "rtl" : "ltr";
  const align = doc.rtl ? "right" : "left";
  const fontFace = fontBase64
    ? `@font-face { font-family: "PlanFont"; src: url(data:font/ttf;base64,${fontBase64}) format("truetype"); }`
    : "";
  // A plain table (rows of three) renders the same in every print engine.
  const statCells = doc.summary.map(
    (item) =>
      `<td class="stat"><div class="stat-label">${escapeHtml(item.label)}</div><div class="stat-value">${escapeHtml(item.value)}</div></td>`,
  );
  const statRows: string[] = [];

  for (let i = 0; i < statCells.length; i += 3) {
    const row = statCells.slice(i, i + 3);

    while (row.length < 3) {
      row.push('<td class="stat empty"></td>');
    }

    statRows.push(`<tr>${row.join("")}</tr>`);
  }

  const stats = `<table class="stats"><tbody>${statRows.join("")}</tbody></table>`;
  const head = doc.headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");
  const body = doc.rows
    .map((row) => {
      const cells = row.cells
        .map((cell, i) => {
          const isLast = i === row.cells.length - 1;
          const text = escapeHtml(String(cell));

          return isLast
            ? `<td class="check">${row.done ? `<span class="tick">${text}</span>` : '<span class="box"></span>'}</td>`
            : `<td>${text}</td>`;
        })
        .join("");

      return `<tr class="${row.done ? "done" : ""}">${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="${doc.language}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(doc.title)}</title>
<style>
${fontFace}
@page { size: A4; margin: 14mm 12mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  color: #17251f;
  font-family: "PlanFont", "Estedad", "Vazirmatn", "Noto Naskh Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif;
  font-size: 11px;
  line-height: 1.7;
  direction: ${dir};
  text-align: ${align};
}
.header {
  background: #2f6b4f;
  color: #ffffff;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 12px;
}
.header h1 { margin: 0; font-size: 20px; }
.header .sub { margin-top: 2px; font-size: 12px; opacity: 0.92; }
.header .gen { margin-top: 2px; font-size: 10px; opacity: 0.8; }
table.stats { width: 100%; border-collapse: separate; border-spacing: 6px; margin: 0 -6px 8px; width: calc(100% + 12px); }
td.stat {
  width: 33.33%;
  background: #eaf3ee;
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  text-align: ${align};
  vertical-align: top;
}
td.stat.empty { background: transparent; }
.stat-label { font-size: 9.5px; color: #4b6a5b; }
.stat-value { font-size: 12px; font-weight: bold; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
th {
  background: #2f6b4f;
  color: #ffffff;
  font-size: 10px;
  padding: 6px 4px;
  border: 1px solid #2f6b4f;
  text-align: center;
}
td {
  padding: 5px 4px;
  border: 1px solid #d0d7d3;
  text-align: center;
  vertical-align: middle;
}
tr { page-break-inside: avoid; }
table.plan tbody tr:nth-child(even) td { background: #f6faf8; }
table.plan tr.done td { background: #e3f4ea !important; }
.box {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 1.4px solid #2f6b4f;
  border-radius: 3px;
  vertical-align: middle;
}
.tick { color: #1f7a4d; font-weight: bold; font-size: 13px; }
</style>
</head>
<body>
<div class="header">
  <h1>${escapeHtml(doc.title)}</h1>
  <div class="sub">${escapeHtml(doc.subtitle)}</div>
  <div class="gen">${escapeHtml(doc.generatedLine)}</div>
</div>
${stats}
<table class="plan">
  <thead><tr>${head}</tr></thead>
  <tbody>${body}</tbody>
</table>
</body>
</html>`;
}
