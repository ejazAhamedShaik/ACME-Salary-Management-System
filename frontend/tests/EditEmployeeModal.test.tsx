import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditEmployeeModal } from "../src/components/EditEmployeeModal";
import { renderWithProviders } from "./testUtils";
import {
  ApiFieldError,
  updateEmployee,
  fetchEmployeeFilters,
  fetchEmployees,
} from "../src/api/employees";
import { fetchCurrencyConfig } from "../src/api/config";

vi.mock("../src/api/employees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/api/employees")>();
  return {
    ...actual,
    fetchEmployeeFilters: vi.fn(),
    fetchEmployees: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
  };
});
vi.mock("../src/api/config", () => ({ fetchCurrencyConfig: vi.fn() }));

const updateEmployeeMock = vi.mocked(updateEmployee);
const fetchEmployeeFiltersMock = vi.mocked(fetchEmployeeFilters);
const fetchEmployeesMock = vi.mocked(fetchEmployees);
const fetchCurrencyConfigMock = vi.mocked(fetchCurrencyConfig);

const employee = {
  id: 1,
  employeeCode: "EMP-000001",
  name: "Ada Lovelace",
  department: "Engineering",
  country: "United Kingdom",
  currencyCode: "GBP",
  salaryAmount: 85_000,
  joinedAt: "2024-01-15T00:00:00.000Z",
};

beforeEach(() => {
  updateEmployeeMock.mockReset();
  fetchEmployeeFiltersMock.mockReset();
  fetchCurrencyConfigMock.mockReset();
  fetchEmployeesMock.mockClear();
  fetchEmployeeFiltersMock.mockResolvedValue({
    departments: ["Engineering", "Finance"],
    countries: ["United Kingdom", "Germany"],
  });
  fetchCurrencyConfigMock.mockResolvedValue({
    currencies: ["USD", "GBP", "EUR"],
    countryCurrencyDefaults: { "United Kingdom": "GBP", Germany: "EUR" },
  });
});

describe("EditEmployeeModal", () => {
  it("opens pre-filled with the clicked row's values, with no employee-list fetch", async () => {
    renderWithProviders(<EditEmployeeModal employee={employee} onClose={vi.fn()} />);

    expect(await screen.findByDisplayValue("Ada Lovelace")).toBeInTheDocument();
    expect(fetchEmployeesMock).not.toHaveBeenCalled();
  });

  it("submits only the changed field, never employeeCode/id", async () => {
    updateEmployeeMock.mockResolvedValue({ ...employee, department: "Finance" });
    const user = userEvent.setup();
    renderWithProviders(<EditEmployeeModal employee={employee} onClose={vi.fn()} />);

    await screen.findByDisplayValue("Ada Lovelace");
    await user.click(screen.getByLabelText("Department"));
    await user.click(await screen.findByRole("option", { name: "Finance" }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateEmployeeMock).toHaveBeenCalledWith(1, { department: "Finance" });
    });
  });

  it("closes the modal only after a successful update", async () => {
    updateEmployeeMock.mockResolvedValue({ ...employee, department: "Finance" });
    const handleClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<EditEmployeeModal employee={employee} onClose={handleClose} />);

    await screen.findByDisplayValue("Ada Lovelace");
    await user.click(screen.getByLabelText("Department"));
    await user.click(await screen.findByRole("option", { name: "Finance" }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(handleClose).toHaveBeenCalled());
  });

  it("surfaces a mocked 400 field error onto the matching Form.Item", async () => {
    updateEmployeeMock.mockRejectedValue(
      new ApiFieldError({ salaryAmount: "Salary amount must be greater than zero" }),
    );
    const user = userEvent.setup();
    renderWithProviders(<EditEmployeeModal employee={employee} onClose={vi.fn()} />);

    await screen.findByDisplayValue("Ada Lovelace");
    await user.click(screen.getByLabelText("Department"));
    await user.click(await screen.findByRole("option", { name: "Finance" }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Salary amount must be greater than zero")).toBeInTheDocument();
  });
});
