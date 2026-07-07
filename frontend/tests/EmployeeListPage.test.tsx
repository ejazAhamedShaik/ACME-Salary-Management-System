import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { EmployeeListPage } from "../src/pages/EmployeeListPage";
import { renderWithProviders } from "./testUtils";
import { fetchEmployees } from "../src/api/employees";

vi.mock("../src/api/employees", () => ({
  fetchEmployees: vi.fn(),
}));

const fetchEmployeesMock = vi.mocked(fetchEmployees);

const mockEmployee = {
  id: 1,
  employeeCode: "EMP-000001",
  name: "Jane Doe",
  department: "Engineering",
  country: "United States",
  currencyCode: "USD",
  salaryAmount: 90_000,
  joinedAt: "2020-01-15T00:00:00.000Z",
};

describe("EmployeeListPage", () => {
  it("renders a loading state before data resolves", async () => {
    fetchEmployeesMock.mockReturnValue(new Promise(() => {}));

    const { container } = renderWithProviders(<EmployeeListPage />);

    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("renders employee rows once the fetch resolves", async () => {
    fetchEmployeesMock.mockResolvedValue({
      data: [mockEmployee],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    renderWithProviders(<EmployeeListPage />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the empty state when data resolves to an empty array", async () => {
    fetchEmployeesMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    renderWithProviders(<EmployeeListPage />);

    expect(await screen.findByText("No employees found.")).toBeInTheDocument();
  });

  it("renders an alert when the fetch fails", async () => {
    fetchEmployeesMock.mockRejectedValue(new Error("network down"));

    renderWithProviders(<EmployeeListPage />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load employees/i)).toBeInTheDocument();
    });
  });
});
