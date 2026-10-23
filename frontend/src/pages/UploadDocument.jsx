import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { contractors, requiredDocuments } from "../data/contractors";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export default function UploadDocument() {
  const { id } = useParams();
  const contractor = contractors.find(
    (item) => item.id === id || item.id === `CNT-${id.padStart(3, "0")}`
  );
  const fileInputRef = useRef(null);
  const [documentType, setDocumentType] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");

  if (!contractor) {
    return (
      <section className="page">
        <Link to="/contractors" className="link-button mb-5">
          <ArrowLeft size={15} />
          Back to contractors
        </Link>
        <div className="panel">
          <h1 className="text-xl font-bold">Contractor not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            There is no contractor record matching this ID.
          </p>
        </div>
      </section>
    );
  }

  const validate = () => {
    const nextErrors = {};

    if (!documentType) nextErrors.documentType = "Select a document type.";
    if (!referenceNumber.trim()) nextErrors.referenceNumber = "Enter the document reference number.";
    if (!issueDate) nextErrors.issueDate = "Select the issue date.";
    if (!expiryDate) nextErrors.expiryDate = "Select the expiry date.";
    if (issueDate && expiryDate && expiryDate <= issueDate) {
      nextErrors.expiryDate = "Expiry date must be after the issue date.";
    }
    if (!file) {
      nextErrors.file = "Choose a document file.";
    } else if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      nextErrors.file = "Choose a PDF, JPG, or PNG file.";
    } else if (file.size > MAX_FILE_SIZE) {
      nextErrors.file = "The selected file must be 10 MB or smaller.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setErrors((current) => ({ ...current, file: "" }));
    setSubmitMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitMessage("");
    if (!validate()) return;

    setSubmitMessage(
      "All fields are valid. Document storage is not connected yet, so this file has not been uploaded."
    );
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setErrors((current) => ({ ...current, file: "" }));
    setSubmitMessage("");
  };

  return (
    <section className="page">
      <Link to={`/contractors/${contractor.id}`} className="link-button mb-5">
        <ArrowLeft size={15} />
        Back to {contractor.name}
      </Link>

      <div className="page-header">
        <div>
          <div className="eyebrow">Contractor documents</div>
          <h1>Upload compliance document</h1>
          <p>Add document details for {contractor.name}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2><FileText size={17} /> Document information</h2>
              <p>Enter the document details and validity dates.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Contractor">
              <div className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                {contractor.name} <span className="ml-2 text-slate-500">· {contractor.regNo}</span>
              </div>
            </FormField>

            <FormField label="Document type" error={errors.documentType}>
              <select
                value={documentType}
                onChange={(event) => {
                  setDocumentType(event.target.value);
                  setErrors((current) => ({ ...current, documentType: "" }));
                  setSubmitMessage("");
                }}
                aria-invalid={Boolean(errors.documentType)}
                className={inputClass(Boolean(errors.documentType))}
              >
                <option value="">Select a required document</option>
                {requiredDocuments.map((document) => (
                  <option key={document} value={document}>{document}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Reference number" error={errors.referenceNumber}>
              <input
                type="text"
                value={referenceNumber}
                onChange={(event) => {
                  setReferenceNumber(event.target.value);
                  setErrors((current) => ({ ...current, referenceNumber: "" }));
                  setSubmitMessage("");
                }}
                placeholder="Enter the reference shown on the document"
                aria-invalid={Boolean(errors.referenceNumber)}
                className={inputClass(Boolean(errors.referenceNumber))}
              />
            </FormField>

            <FormField label="Issue date" error={errors.issueDate}>
              <input
                type="date"
                value={issueDate}
                max={expiryDate || undefined}
                onChange={(event) => {
                  setIssueDate(event.target.value);
                  setErrors((current) => ({ ...current, issueDate: "", expiryDate: "" }));
                  setSubmitMessage("");
                }}
                aria-invalid={Boolean(errors.issueDate)}
                className={inputClass(Boolean(errors.issueDate))}
              />
            </FormField>

            <FormField label="Expiry date" error={errors.expiryDate}>
              <input
                type="date"
                value={expiryDate}
                min={issueDate || undefined}
                onChange={(event) => {
                  setExpiryDate(event.target.value);
                  setErrors((current) => ({ ...current, expiryDate: "" }));
                  setSubmitMessage("");
                }}
                aria-invalid={Boolean(errors.expiryDate)}
                className={inputClass(Boolean(errors.expiryDate))}
              />
            </FormField>

            <FormField label="Notes" optional>
              <textarea
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setSubmitMessage("");
                }}
                rows={3}
                maxLength={1000}
                placeholder="Add any relevant notes about this document"
                className={`${inputClass(false)} resize-y`}
              />
            </FormField>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2><UploadCloud size={17} /> Document file</h2>
              <p>PDF, JPG, or PNG files up to 10 MB.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Choose document file"
          />

          {file ? (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="shrink-0 text-[var(--teal)]" size={20} />
                <div className="min-w-0">
                  <strong className="block truncate text-sm text-slate-800">{file.name}</strong>
                  <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <button type="button" className="secondary-button" onClick={removeFile}>
                <Trash2 size={15} />
                Remove file
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-9 text-center transition hover:border-[var(--teal)] hover:bg-slate-50/70"
            >
              <UploadCloud size={30} className="text-slate-400" />
              <strong className="mt-3 text-sm text-slate-700">Choose a document to upload</strong>
              <span className="mt-1 text-xs text-slate-500">PDF, JPG, or PNG · 10 MB maximum</span>
            </button>
          )}
          {errors.file && <ErrorMessage>{errors.file}</ErrorMessage>}
        </section>

        {submitMessage && (
          <div role="status" className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{submitMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Link to={`/contractors/${contractor.id}`} className="secondary-button">
            Cancel
          </Link>
          <button type="submit" className="primary-button">
            <CheckCircle2 size={16} />
            Validate document
          </button>
        </div>
      </form>
    </section>
  );
}

function FormField({ label, optional = false, error, children }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      <span className="mb-1.5 block">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </span>
      {children}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </label>
  );
}

function ErrorMessage({ children }) {
  return <span className="mt-1.5 block text-xs font-medium text-red-700">{children}</span>;
}

function inputClass(hasError) {
  return `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[var(--teal)] focus:ring-3 focus:ring-emerald-100 ${
    hasError ? "border-red-500" : "border-slate-300"
  }`;
}

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
