import JSZip from "jszip";

/**
 * Minimal .xlsx writer (SpreadsheetML) on top of JSZip.
 * Supports several sheets, column widths, a frozen header row, right-to-left
 * sheets and a few cell styles. Strings are written inline, so no shared
 * string table is needed.
 */

export type CellStyle = "title" | "header" | "label" | "center" | "text";

export interface StyledCell {
  value: string | number;
  style?: CellStyle;
}

export type Cell = string | number | StyledCell | null;

export interface SheetSpec {
  name: string;
  rows: Cell[][];
  columnWidths?: number[];
  /** Freeze the first N rows. */
  freezeRows?: number;
  rtl?: boolean;
  /** Print on a landscape page (always one page wide). */
  landscape?: boolean;
}

const STYLE_ID: Record<CellStyle, number> = {
  text: 0,
  title: 1,
  header: 2,
  label: 3,
  center: 4,
};

const FONT = "Tahoma";

// Characters XML 1.0 does not allow.
// eslint-disable-next-line no-control-regex
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

function escapeXml(value: string): string {
  return value
    .replace(INVALID_XML, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function columnLetter(index: number): string {
  let n = index + 1;
  let letters = "";

  while (n > 0) {
    const rest = (n - 1) % 26;

    letters = String.fromCharCode(65 + rest) + letters;
    n = Math.floor((n - 1) / 26);
  }

  return letters;
}

export function safeSheetName(name: string, taken: readonly string[]): string {
  const cleaned =
    name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Sheet";
  let candidate = cleaned;
  let n = 2;

  while (taken.includes(candidate)) {
    const suffix = ` ${n}`;

    candidate = cleaned.slice(0, 31 - suffix.length) + suffix;
    n += 1;
  }

  return candidate;
}

function normalize(cell: Cell): StyledCell | null {
  if (cell === null) {
    return null;
  }

  if (typeof cell === "object") {
    return cell;
  }

  return { value: cell };
}

function sheetXml(sheet: SheetSpec): string {
  const widths = sheet.columnWidths ?? [];
  const freeze = sheet.freezeRows ?? 0;
  const maxColumns = sheet.rows.reduce((max, row) => Math.max(max, row.length), 0);
  const lastRef = `${columnLetter(Math.max(maxColumns - 1, 0))}${Math.max(sheet.rows.length, 1)}`;
  const view = `<sheetViews><sheetView workbookViewId="0"${sheet.rtl ? ' rightToLeft="1"' : ""}${
    freeze > 0
      ? `><pane ySplit="${freeze}" topLeftCell="A${freeze + 1}" activePane="bottomLeft" state="frozen"/></sheetView>`
      : "/>"
  }</sheetViews>`;
  const cols =
    widths.length > 0
      ? `<cols>${widths
          .map(
            (width, i) =>
              `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`,
          )
          .join("")}</cols>`
      : "";
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((raw, c) => {
          const cell = normalize(raw);

          if (!cell) {
            return "";
          }

          const ref = `${columnLetter(c)}${r + 1}`;
          const style = STYLE_ID[cell.style ?? "text"];

          if (typeof cell.value === "number" && Number.isFinite(cell.value)) {
            return `<c r="${ref}" s="${style}"><v>${cell.value}</v></c>`;
          }

          return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(cell.value))}</t></is></c>`;
        })
        .join("");

      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    `<dimension ref="A1:${lastRef}"/>` +
    view +
    '<sheetFormatPr defaultRowHeight="18"/>' +
    cols +
    `<sheetData>${rows}</sheetData>` +
    '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    `<pageSetup paperSize="9" orientation="${sheet.landscape ? "landscape" : "portrait"}" fitToWidth="1" fitToHeight="0"/>` +
    "</worksheet>"
  );
}

function stylesXml(): string {
  const border =
    '<border><left style="thin"><color rgb="FFD0D7D3"/></left><right style="thin"><color rgb="FFD0D7D3"/></right><top style="thin"><color rgb="FFD0D7D3"/></top><bottom style="thin"><color rgb="FFD0D7D3"/></bottom><diagonal/></border>';

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="4">' +
    `<font><sz val="11"/><name val="${FONT}"/></font>` +
    `<font><b/><sz val="15"/><color rgb="FF2F6B4F"/><name val="${FONT}"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="${FONT}"/></font>` +
    `<font><b/><sz val="11"/><name val="${FONT}"/></font>` +
    "</fonts>" +
    '<fills count="4">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FF2F6B4F"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF3EE"/><bgColor indexed="64"/></patternFill></fill>' +
    "</fills>" +
    `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>${border}</borders>` +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="5">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    "</cellXfs>" +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>"
  );
}

function contentTypesXml(sheetCount: number): string {
  const sheets = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    sheets +
    "</Types>"
  );
}

function workbookXml(names: readonly string[]): string {
  const sheets = names
    .map(
      (name, i) =>
        `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join("");

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets>${sheets}</sheets>` +
    "</workbook>"
  );
}

function workbookRelsXml(sheetCount: number): string {
  const sheets = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  ).join("");

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets +
    `<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    "</Relationships>"
  );
}

const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  "</Relationships>";

function buildZip(sheets: readonly SheetSpec[]): JSZip {
  const names: string[] = [];

  sheets.forEach((sheet) => names.push(safeSheetName(sheet.name, names)));

  const zip = new JSZip();

  zip.file("[Content_Types].xml", contentTypesXml(sheets.length));
  zip.file("_rels/.rels", ROOT_RELS);
  zip.file("xl/workbook.xml", workbookXml(names));
  zip.file("xl/_rels/workbook.xml.rels", workbookRelsXml(sheets.length));
  zip.file("xl/styles.xml", stylesXml());
  sheets.forEach((sheet, i) =>
    zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sheet)),
  );

  return zip;
}

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** The workbook as a base64 string (what expo-file-system writes to disk). */
export function buildXlsxBase64(sheets: readonly SheetSpec[]): Promise<string> {
  return buildZip(sheets).generateAsync({
    type: "base64",
    compression: "DEFLATE",
    mimeType: XLSX_MIME,
  });
}

/** The workbook as raw bytes (used by tests and by the web download). */
export function buildXlsxBytes(
  sheets: readonly SheetSpec[],
): Promise<Uint8Array> {
  return buildZip(sheets).generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    mimeType: XLSX_MIME,
  });
}
