import type { ExportDoc } from "@/features/quran/plan/export/exportData";
import type { Cell, SheetSpec } from "@/features/quran/plan/export/xlsx";

export interface SheetLabels {
  summary: string;
  schedule: string;
}

/** Two sheets: a summary and the day-by-day schedule. */
export function buildSheets(doc: ExportDoc, labels: SheetLabels): SheetSpec[] {
  const summaryRows: Cell[][] = [
    [{ value: doc.title, style: "title" }],
    [doc.subtitle],
    [doc.generatedLine],
    [],
    ...doc.summary.map(
      (item): Cell[] => [
        { value: item.label, style: "label" },
        { value: item.value, style: "center" },
      ],
    ),
  ];

  const scheduleRows: Cell[][] = [
    doc.headers.map((value): Cell => ({ value, style: "header" })),
    ...doc.rows.map((row) =>
      row.cells.map((value, i): Cell => ({
        value,
        style: doc.kinds[i] === "number" ? "center" : i === 0 ? "center" : "text",
      })),
    ),
  ];

  // Column widths follow the column order; the portion and review columns are wide.
  const widths = doc.headers.map((header, i) => {
    if (doc.kinds[i] === "number") {
      return 9;
    }

    const longest = Math.max(
      header.length,
      ...doc.rows.map((row) => String(row.cells[i] ?? "").length),
    );

    return Math.min(Math.max(longest + 3, 11), 46);
  });

  return [
    {
      name: labels.summary,
      rows: summaryRows,
      columnWidths: [30, 44],
      rtl: doc.rtl,
    },
    {
      name: labels.schedule,
      rows: scheduleRows,
      columnWidths: widths,
      freezeRows: 1,
      rtl: doc.rtl,
      landscape: true,
    },
  ];
}
