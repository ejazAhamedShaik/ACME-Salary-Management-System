import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEmployee } from "../api/employees";
import { invalidateEmployeeRelatedQueries } from "./invalidateEmployeeRelatedQueries";

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      invalidateEmployeeRelatedQueries(queryClient);
    },
  });
}
