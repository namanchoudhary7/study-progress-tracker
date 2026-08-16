import { useRef, useState } from "react";
import { CheckCircle2, Upload, X } from "lucide-react";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { ErrorBanner } from "./ErrorBanner";
import { useImportCsv } from "../hooks/useImportCsv";
import type { ImportResult } from "../api/importCsv";

function parsePreview(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1, 11).map((line) => line.split(",").map((c) => c.trim()));
  return { headers, rows };
}

export function ImportCsvModal({ onClose }: { onClose: () => void }) {
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importCsv = useImportCsv();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function handleImport() {
    if (!csvText) return;
    importCsv.mutate(csvText, { onSuccess: (data) => setResult(data) });
  }

  const preview = csvText ? parsePreview(csvText) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-lg rounded-md border border-neutral-200 bg-white p-4 shadow-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent-500/60 before:to-transparent dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Import from CSV</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        {!result && (
          <>
            <p className="mb-3 text-sm text-neutral-500">
              Expects columns <code>subject</code>, <code>topic</code>, and optionally <code>status</code>{" "}
              (todo/in_progress/done). Existing subjects and topics with matching names are reused, not duplicated.
            </p>

            <Button variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()}>
              {fileName || "Choose CSV file"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {importCsv.error && (
              <div className="mt-3">
                <ErrorBanner message={importCsv.error.message} />
              </div>
            )}

            {preview && preview.headers.length > 0 && (
              <div className="mt-3 max-h-64 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      {preview.headers.map((h, i) => (
                        <th key={i} className="px-2 py-1 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!csvText || importCsv.isPending}
                onClick={handleImport}
              >
                {importCsv.isPending ? "Importing…" : "Import"}
              </Button>
            </div>
          </>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Import complete</span>
            </div>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400">
              <li><span className="font-mono tabular-nums">{result.rows_processed}</span> row(s) processed</li>
              <li><span className="font-mono tabular-nums">{result.subjects_created}</span> new subject(s) created</li>
              <li><span className="font-mono tabular-nums">{result.topics_created}</span> new topic(s) created</li>
              <li><span className="font-mono tabular-nums">{result.topics_skipped}</span> topic(s) skipped (already existed)</li>
            </ul>
            <div className="flex justify-end">
              <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
