import test from "node:test";
import assert from "node:assert/strict";
import { contractors, documentTypes } from "./src/data/demoData.js";

test("demo contractor data is available", () => {
  assert.ok(contractors.length > 0);
  assert.ok(contractors.every((contractor) => contractor.name));
});

test("required document types are configured", () => {
  assert.equal(documentTypes.length, 5);
  assert.ok(documentTypes.every((document) => document.name));
});
