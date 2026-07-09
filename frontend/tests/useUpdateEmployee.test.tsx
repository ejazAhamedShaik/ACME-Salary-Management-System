import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useUpdateEmployee } from "../src/hooks/useUpdateEmployee";
import { createTestQueryClient } from "./testUtils";
import { updateEmployee } from "../src/api/employees";

vi.mock("../src/api/employees", () => ({
  updateEmployee: vi.fn(),
}));

const updateEmployeeMock = vi.mocked(updateEmployee);

beforeEach(() => {
  updateEmployeeMock.mockReset();
});

describe("useUpdateEmployee", () => {
  it("invalidates employees, insightsSummary, and insightsOutliers queries on success", async () => {
    updateEmployeeMock.mockResolvedValue({
      id: 1,
      employeeCode: "EMP-000001",
      name: "Ada Lovelace",
      department: "Finance",
      country: "India",
      currencyCode: "INR",
      salaryAmount: 95_000,
      joinedAt: "2024-01-15T00:00:00.000Z",
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useUpdateEmployee(), { wrapper });

    result.current.mutate({ id: 1, payload: { department: "Finance" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["employees"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["insightsSummary"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["insightsOutliers"] });
  });
});
