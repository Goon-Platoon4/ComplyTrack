export function csvCell(value) {
  let text = value == null ? "" : String(value);
  // Prevent spreadsheet formula execution from untrusted values, including leading whitespace.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function toCsv(headers, rows) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");
}
