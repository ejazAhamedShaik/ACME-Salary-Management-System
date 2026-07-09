import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useCreateEmployee } from "../src/hooks/useCreateEmployee";
import { createTestQueryClient } from "./testUtils";
import { createEmployee } from "../src/api/employees";

vi.mock("../src/api/employees", () => ({
  createEmployee: vi.fn(),
}));

const createEmployeeMock = vi.mocked(createEmployee);

beforeEach(() => {
  createEmployeeMock.mockReset();
});

describe("useCreateEmployee", () => {
  it("invalidates employees, insightsSummary, and insightsOutliers queries on success", async () => {
    createEmployeeMock.mockResolvedValue({
      id: 1,
      employeeCode: "EMP-000001",
      name: "Ada Lovelace",
      department: "Engineering",
      country: "India",
      currencyCode: "INR",
      salaryAmount: 85_000,
      joinedAt: "2024-01-15T00:00:00.000Z",
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useCreateEmployee(), { wrapper });

    result.current.mutate({
      name: "Ada Lovelace",
      department: "Engineering",
      country: "India",
      currencyCode: "INR",
      salaryAmount: 85_000,
      joinedAt: "2024-01-15",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["employees"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["insightsSummary"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["insightsOutliers"] });
  });
});
