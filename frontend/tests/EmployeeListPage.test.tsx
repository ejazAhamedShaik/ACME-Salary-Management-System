import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployeeListPage } from "../src/pages/EmployeeListPage";
import { renderWithProviders } from "./testUtils";
import { fetchEmployeeFilters, fetchEmployees } from "../src/api/employees";

vi.mock("../src/api/employees", () => ({
  fetchEmployees: vi.fn(),
  fetchEmployeeFilters: vi.fn(),
}));

const fetchEmployeesMock = vi.mocked(fetchEmployees);
const fetchEmployeeFiltersMock = vi.mocked(fetchEmployeeFilters);

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
  beforeEach(() => {
    fetchEmployeesMock.mockClear();
    fetchEmployeeFiltersMock.mockReset();
    fetchEmployeeFiltersMock.mockResolvedValue({ departments: [], countries: [] });
  });

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

  describe("debounced search", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does not call the API on every keystroke, only once after the debounce delay", async () => {
      fetchEmployeesMock.mockResolvedValue({
        data: [mockEmployee],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      });

      renderWithProviders(<EmployeeListPage />);

      await vi.advanceTimersByTimeAsync(0);
      expect(fetchEmployeesMock).toHaveBeenCalledTimes(1);

      const searchInput = screen.getByPlaceholderText("Search by name or employee code");
      for (const partial of ["J", "Ja", "Jan", "Jane"]) {
        fireEvent.change(searchInput, { target: { value: partial } });
      }

      expect(fetchEmployeesMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(fetchEmployeesMock).toHaveBeenCalledTimes(2);
      expect(fetchEmployeesMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "Jane", page: 1 }),
      );
    });
  });

  it("calls the API again with the new page when the table's page control changes", async () => {
    const rows = Array.from({ length: 20 }, (_, index) => ({
      ...mockEmployee,
      id: index + 1,
      employeeCode: `EMP-${String(index + 1).padStart(6, "0")}`,
    }));

    fetchEmployeesMock.mockResolvedValue({
      data: rows,
      pagination: { page: 1, pageSize: 20, total: 50, totalPages: 3 },
    });

    const user = userEvent.setup();
    renderWithProviders(<EmployeeListPage />);

    await screen.findByText("EMP-000001");

    await user.click(screen.getByTitle("2"));

    await waitFor(() => {
      expect(fetchEmployeesMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  describe("filter dropdowns", () => {
    beforeEach(() => {
      fetchEmployeeFiltersMock.mockResolvedValue({
        departments: ["Engineering", "Finance"],
        countries: ["Germany", "India"],
      });
      fetchEmployeesMock.mockResolvedValue({
        data: [mockEmployee],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      });
    });

    it("renders populated with the mocked filter options", async () => {
      renderWithProviders(<EmployeeListPage />);

      const departmentSelect = within(screen.getByTestId("department-filter")).getByRole(
        "combobox",
      );
      const user = userEvent.setup();
      await user.click(departmentSelect);

      expect(await screen.findByText("Engineering")).toBeInTheDocument();
      expect(await screen.findByText("Finance")).toBeInTheDocument();

      const countrySelect = within(screen.getByTestId("country-filter")).getByRole("combobox");
      await user.click(countrySelect);

      expect(await screen.findByText("Germany")).toBeInTheDocument();
      expect(await screen.findByText("India")).toBeInTheDocument();
    });

    it("triggers a new employee fetch including the selected department", async () => {
      const user = userEvent.setup();
      renderWithProviders(<EmployeeListPage />);

      await screen.findByText("Jane Doe");
      fetchEmployeesMock.mockClear();

      const departmentSelect = within(screen.getByTestId("department-filter")).getByRole(
        "combobox",
      );
      await user.click(departmentSelect);
      await user.click(await screen.findByText("Engineering"));

      await waitFor(() => {
        expect(fetchEmployeesMock).toHaveBeenLastCalledWith(
          expect.objectContaining({ department: "Engineering", page: 1 }),
        );
      });
    });

    it("combines a selected department and a search term in the same request", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<EmployeeListPage />);

      await vi.advanceTimersByTimeAsync(0);
      fetchEmployeesMock.mockClear();

      const departmentSelect = within(screen.getByTestId("department-filter")).getByRole(
        "combobox",
      );
      await user.click(departmentSelect);
      await user.click(await screen.findByText("Engineering"));

      const searchInput = screen.getByPlaceholderText("Search by name or employee code");
      fireEvent.change(searchInput, { target: { value: "Jane" } });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(fetchEmployeesMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ department: "Engineering", search: "Jane" }),
      );

      vi.useRealTimers();
    });
  });
});
