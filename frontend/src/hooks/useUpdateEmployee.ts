import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEmployee } from "../api/employees";
import type { UpdateEmployeePayload } from "../api/types";
import { invalidateEmployeeRelatedQueries } from "./invalidateEmployeeRelatedQueries";

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEmployeePayload }) =>
      updateEmployee(id, payload),
    onSuccess: () => {
      invalidateEmployeeRelatedQueries(queryClient);
    },
  });
}
