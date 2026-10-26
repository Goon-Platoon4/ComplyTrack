import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, toCsv } from "../src/utils/csv.js";
import { createTextPdf } from "../src/services/pdfService.js";

test("CSV output quotes values and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell("normal, value"), '"normal, value"');
  assert.match(toCsv(["name"], [["@SUM(A1:A2)"]]), /'@SUM/);
});

test("PDF export creates a structurally recognizable PDF document", () => {
  const pdf = createTextPdf("Test report", ["One line", "Another line"]);
  assert.equal(pdf.subarray(0, 8).toString("ascii"), "%PDF-1.4");
  assert.match(pdf.toString("ascii"), /\/Type \/Catalog/);
  assert.match(pdf.toString("ascii"), /startxref/);
  assert.match(pdf.toString("ascii"), /%%EOF$/);
});
