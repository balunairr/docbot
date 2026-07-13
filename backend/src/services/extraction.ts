import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);
const pdfjsPackageDir = path.dirname(
  require.resolve("pdfjs-dist/package.json")
);
const standardFontDataUrl = path.join(pdfjsPackageDir, "standard_fonts/");

const DEFAULT_DOCX_SECTION = "Document";

export class ExtractionError extends Error {
  readonly filePath: string;
  readonly cause: unknown;

  constructor(message: string, filePath: string, cause?: unknown) {
    super(message);
    this.name = "ExtractionError";
    this.filePath = filePath;
    this.cause = cause;
  }
}

export interface PdfPageBlock {
  text: string;
  page: number;
}

export interface DocxSectionBlock {
  text: string;
  section: string;
}

export interface LabeledBlock {
  text: string;
  label: string;
}

export type DocumentFileType = "pdf" | "docx";

interface TextContentItem {
  str?: string;
}

async function assertFileReadable(filePath: string): Promise<void> {
  try {
    await access(filePath);
  } catch (error) {
    throw new ExtractionError(
      `File not found or not readable: ${filePath}`,
      filePath,
      error
    );
  }
}

function extractPageText(items: TextContentItem[]): string {
  return items
    .map((item) => item.str ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripInlineHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
  ).trim();
}

function parseDocxSections(html: string): DocxSectionBlock[] {
  const headingRegex = /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
  const headings: { endIndex: number; section: string; startIndex: number }[] =
    [];

  let match = headingRegex.exec(html);
  while (match !== null) {
    headings.push({
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      section: stripInlineHtml(match[2]),
    });
    match = headingRegex.exec(html);
  }

  if (headings.length === 0) {
    const text = stripHtml(html);
    if (!text) {
      return [];
    }

    return [{ text, section: DEFAULT_DOCX_SECTION }];
  }

  const blocks: DocxSectionBlock[] = [];
  const preamble = stripHtml(html.slice(0, headings[0].startIndex));

  if (preamble) {
    blocks.push({ text: preamble, section: DEFAULT_DOCX_SECTION });
  }

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const nextHeading = headings[index + 1];
    const contentStart = heading.endIndex;
    const contentEnd = nextHeading?.startIndex ?? html.length;
    const text = stripHtml(html.slice(contentStart, contentEnd));

    if (!text) {
      continue;
    }

    blocks.push({
      text,
      section: heading.section || DEFAULT_DOCX_SECTION,
    });
  }

  return blocks;
}

export async function extractPdf(filePath: string): Promise<PdfPageBlock[]> {
  await assertFileReadable(filePath);

  try {
    const pdfData = await readFile(filePath);
    const pdfDocument = await pdfjsLib.getDocument({
      data: new Uint8Array(pdfData),
      standardFontDataUrl,
      useSystemFonts: true,
      disableFontFace: true,
    }).promise;

    const pages: PdfPageBlock[] = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = extractPageText(textContent.items as TextContentItem[]);

      pages.push({ text, page: pageNumber });
    }

    return pages;
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error;
    }

    throw new ExtractionError(
      `Failed to extract text from PDF: ${filePath}`,
      filePath,
      error
    );
  }
}

export async function extractDocx(
  filePath: string
): Promise<DocxSectionBlock[]> {
  await assertFileReadable(filePath);

  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    return parseDocxSections(result.value);
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error;
    }

    throw new ExtractionError(
      `Failed to extract text from DOCX: ${filePath}`,
      filePath,
      error
    );
  }
}

export async function extractDocument(
  filePath: string,
  fileType: DocumentFileType
): Promise<LabeledBlock[]> {
  if (fileType === "pdf") {
    const pages = await extractPdf(filePath);
    return pages.map(({ text, page }) => ({
      text,
      label: `Page ${page}`,
    }));
  }

  if (fileType === "docx") {
    const sections = await extractDocx(filePath);
    return sections.map(({ text, section }) => ({
      text,
      label: section,
    }));
  }

  throw new ExtractionError(
    `Unsupported file type: ${fileType satisfies never}`,
    filePath
  );
}
