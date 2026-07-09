import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEmployee } from "../api/employees";
import { invalidateEmployeeRelatedQueries } from "./invalidateEmployeeRelatedQueries";

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      invalidateEmployeeRelatedQueries(queryClient);
    },
  });
}
