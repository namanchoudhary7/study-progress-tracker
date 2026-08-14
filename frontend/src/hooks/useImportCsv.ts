import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importApi } from "../api/importCsv";

export function useImportCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (csvText: string) => importApi.csv(csvText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["topics"] });
    },
  });
}
