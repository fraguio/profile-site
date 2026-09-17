import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function textFromPdf(pdf) {
  const document = await getDocument({ data: new Uint8Array(pdf) }).promise;
  const pages = await Promise.all(
    Array.from({ length: document.numPages }, async (_, index) => {
      const page = await document.getPage(index + 1);
      const content = await page.getTextContent();

      return content.items.map((item) => item.str).join(" ");
    }),
  );

  return pages.join(" ");
}
