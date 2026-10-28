import { Platform } from "react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { buildPlanHtml } from "@/features/quran/plan/export/buildHtml";
import { buildSheets } from "@/features/quran/plan/export/buildSheets";
import type { ExportDoc } from "@/features/quran/plan/export/exportData";
import {
  XLSX_MIME,
  buildXlsxBase64,
  buildXlsxBytes,
} from "@/features/quran/plan/export/xlsx";

export type ExportResult = "shared" | "saved" | "unavailable";

const PDF_MIME = "application/pdf";
const XLSX_UTI = "org.openxmlformats.spreadsheetml.sheet";

let cachedFont: string | null | undefined;

/** The Persian UI font as base64, or null when it cannot be read. */
async function loadFontBase64(): Promise<string | null> {
  if (cachedFont !== undefined) {
    return cachedFont;
  }

  try {
    const asset = Asset.fromModule(
      require("../../../../../assets/fonts/Estedad-Medium.ttf"),
    );

    await asset.downloadAsync();

    cachedFont = asset.localUri
      ? await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: FileSystem.EncodingType.Base64,
        })
      : null;
  } catch {
    cachedFont = null;
  }

  return cachedFont;
}

function fileName(base: string, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);

  return `${base}-${stamp}.${extension}`;
}

async function share(
  uri: string,
  mimeType: string,
  uti: string,
  title: string,
): Promise<ExportResult> {
  if (!(await Sharing.isAvailableAsync())) {
    return "unavailable";
  }

  await Sharing.shareAsync(uri, { mimeType, UTI: uti, dialogTitle: title });

  return "shared";
}

function downloadOnWeb(bytes: Uint8Array, name: string, mime: string): void {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportPlanPdf(
  doc: ExportDoc,
  baseName: string,
): Promise<ExportResult> {
  const html = buildPlanHtml(doc, (await loadFontBase64()) ?? undefined);

  if (Platform.OS === "web") {
    await Print.printAsync({ html });

    return "saved";
  }

  const printed = await Print.printToFileAsync({ html });
  const target = `${FileSystem.cacheDirectory}${fileName(baseName, "pdf")}`;
  let uri = printed.uri;

  try {
    await FileSystem.deleteAsync(target, { idempotent: true });
    await FileSystem.moveAsync({ from: printed.uri, to: target });
    uri = target;
  } catch {
    // The generated file name is fine too.
  }

  return share(uri, PDF_MIME, "com.adobe.pdf", doc.title);
}

export async function exportPlanExcel(
  doc: ExportDoc,
  baseName: string,
  labels: { summary: string; schedule: string },
): Promise<ExportResult> {
  const sheets = buildSheets(doc, labels);
  const name = fileName(baseName, "xlsx");

  if (Platform.OS === "web") {
    downloadOnWeb(await buildXlsxBytes(sheets), name, XLSX_MIME);

    return "saved";
  }

  const uri = `${FileSystem.cacheDirectory}${name}`;

  await FileSystem.writeAsStringAsync(uri, await buildXlsxBase64(sheets), {
    encoding: FileSystem.EncodingType.Base64,
  });

  return share(uri, XLSX_MIME, XLSX_UTI, doc.title);
}
