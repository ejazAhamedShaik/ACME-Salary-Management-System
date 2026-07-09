import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useDeleteEmployee } from "../src/hooks/useDeleteEmployee";
import { createTestQueryClient } from "./testUtils";
import { deleteEmployee } from "../src/api/employees";

vi.mock("../src/api/employees", () => ({
  deleteEmployee: vi.fn(),
}));

const deleteEmployeeMock = vi.mocked(deleteEmployee);

beforeEach(() => {
  deleteEmployeeMock.mockReset();
});

describe("useDeleteEmployee", () => {
  it("invalidates employees, insightsSummary, and insightsOutliers queries on success", async () => {
    deleteEmployeeMock.mockResolvedValue(undefined);

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useDeleteEmployee(), { wrapper });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["employees"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["insightsSummary"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["insightsOutliers"] });
  });
});
