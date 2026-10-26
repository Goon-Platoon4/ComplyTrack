function escapeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function createTextPdf(title, lines) {
  const allLines = [
    title,
    `Generated: ${new Date().toISOString()}`,
    "",
    ...lines,
  ].flatMap((line) => {
    const text = String(line ?? "");
    if (text.length <= 100) return [text];
    const chunks = [];
    for (let i = 0; i < text.length; i += 100)
      chunks.push(text.slice(i, i + 100));
    return chunks;
  });
  const pages = [];
  for (let i = 0; i < allLines.length; i += 48)
    pages.push(allLines.slice(i, i + 48));
  if (!pages.length) pages.push([title]);
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  pages.forEach((pageLines, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    let stream = "BT\n/F1 10 Tf\n48 750 Td\n";
    pageLines.forEach((line, lineIndex) => {
      if (lineIndex === 0 && index === 0) stream += "/F1 16 Tf\n";
      else if (lineIndex === 1 && index === 0) stream += "/F1 8 Tf\n";
      else if (lineIndex === 2 && index === 0) stream += "/F1 10 Tf\n";
      stream += `(${escapeText(line)}) Tj\n0 -14 Td\n`;
    });
    stream += "ET";
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] =
      `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`;
  });
  let pdf = "%PDF-1.4\n%ComplyTrack\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, "ascii");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1)
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}
