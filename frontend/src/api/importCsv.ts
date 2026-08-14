import { api } from "../lib/apiClient";

export interface ImportResult {
  rows_processed: number;
  subjects_created: number;
  topics_created: number;
  topics_skipped: number;
}

export const importApi = {
  csv: (csvText: string) => api.post<ImportResult>("/import/csv", { csv_text: csvText }),
};
