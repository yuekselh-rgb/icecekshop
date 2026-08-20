/*
 * Rein clientseitige Beleg-Texterkennung (Tesseract.js + pdfjs-dist),
 * keine externe API, keine Kosten. Liest den Beleg per OCR und versucht
 * per Heuristik (Schlüsselwörter, Zahlenmuster), Lieferant, Gesamtbetrag
 * und ggf. einzelne Warenzeilen zu erraten. Das ist deutlich unzuverlässiger
 * als ein Vision-Modell — das Ergebnis ist immer nur ein Vorschlag zum
 * Prüfen, nie eine verlässliche automatische Buchung.
 */

export type ReceiptExtraction = {
  rawText: string;
  matchedSupplierId: string | null;
  suggestedTotal: number | null;
  suggestedItems: {
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
};

const TOTAL_KEYWORDS = [
  "gesamtbetrag",
  "gesamt",
  "endbetrag",
  "rechnungsbetrag",
  "summe",
  "toplam",
  "genel toplam",
  "total",
];

const NUMBER_PATTERN = /\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g;

/*
 * Für die zeilenweise Erkennung von Warenzeilen reicht das strikte
 * NUMBER_PATTERN nicht — eine Menge wie "10" oder "5" hat kein Komma und
 * würde nie matchen. Dieses lockere Muster erfasst sowohl reine
 * Ganzzahlen (Menge) als auch Kommazahlen (Preis).
 */
const ITEM_NUMBER_PATTERN = /\d+(?:[.,]\d{1,2})?/g;

function parseGermanNumber(raw: string): number | null {
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const value = Number(cleaned);

  return Number.isFinite(value) ? value : null;
}

function parseFlexibleNumber(raw: string): number | null {
  if (raw.includes(",")) {
    return parseGermanNumber(raw);
  }

  const value = Number(raw.replace(",", "."));

  return Number.isFinite(value) ? value : null;
}

async function toOcrSource(file: File): Promise<HTMLCanvasElement | File> {
  if (file.type !== "application/pdf") {
    return file;
  }

  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas-Kontext nicht verfügbar.");
  }

  await page.render({ canvasContext: context, viewport, canvas }).promise;

  return canvas;
}

async function runOcr(source: HTMLCanvasElement | File): Promise<string> {
  const { recognize } = await import("tesseract.js");

  const result = await recognize(source, "deu");

  return result.data.text;
}

function findSuggestedTotal(rawText: string, lines: string[]): number | null {
  for (const line of lines) {
    const lower = line.toLowerCase();

    if (!TOTAL_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      continue;
    }

    const matches = line.match(NUMBER_PATTERN);

    if (!matches || matches.length === 0) {
      continue;
    }

    const value = parseGermanNumber(matches[matches.length - 1]);

    if (value !== null) {
      return value;
    }
  }

  const allMatches = rawText.match(NUMBER_PATTERN) || [];

  const values = allMatches
    .map(parseGermanNumber)
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function findSuggestedItems(
  lines: string[],
): { productName: string; quantity: number; unitPrice: number }[] {
  const items: { productName: string; quantity: number; unitPrice: number }[] = [];

  for (const line of lines) {
    const numberMatches = line.match(ITEM_NUMBER_PATTERN);

    if (!numberMatches || numberMatches.length < 3) {
      continue;
    }

    const numbers = numberMatches
      .map(parseFlexibleNumber)
      .filter((value): value is number => value !== null);

    if (numbers.length < 3) {
      continue;
    }

    const total = numbers[numbers.length - 1];
    const unitPrice = numbers[numbers.length - 2];
    const quantity = numbers[numbers.length - 3];

    if (
      quantity <= 0 ||
      quantity > 9999 ||
      Math.abs(quantity * unitPrice - total) > Math.max(0.05, total * 0.02)
    ) {
      continue;
    }

    const firstNumberIndex = line.indexOf(numberMatches[numberMatches.length - 3]);
    const productName = (firstNumberIndex > 0
      ? line.slice(0, firstNumberIndex)
      : line
    ).trim();

    if (!productName) {
      continue;
    }

    items.push({ productName, quantity, unitPrice });
  }

  return items;
}

export async function extractReceiptFromFile(
  file: File,
  suppliers: { id: string; name: string }[],
): Promise<ReceiptExtraction> {
  const source = await toOcrSource(file);
  const rawText = await runOcr(source);

  const normalized = rawText.toLowerCase();

  const matchedSupplier = suppliers.find(
    (supplier) =>
      supplier.name.trim().length > 2 &&
      normalized.includes(supplier.name.toLowerCase()),
  );

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    rawText,
    matchedSupplierId: matchedSupplier?.id ?? null,
    suggestedTotal: findSuggestedTotal(rawText, lines),
    suggestedItems: findSuggestedItems(lines),
  };
}
