import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notification } from "antd";
import { CreateEmployeeModal } from "../src/components/CreateEmployeeModal";
import { renderWithProviders } from "./testUtils";
import { ApiFieldError, createEmployee, fetchEmployeeFilters } from "../src/api/employees";
import { fetchCurrencyConfig } from "../src/api/config";

vi.mock("../src/api/employees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/api/employees")>();
  return {
    ...actual,
    fetchEmployeeFilters: vi.fn(),
    fetchEmployees: vi.fn(),
    createEmployee: vi.fn(),
  };
});
vi.mock("../src/api/config", () => ({ fetchCurrencyConfig: vi.fn() }));
vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();
  return {
    ...actual,
    notification: { ...actual.notification, success: vi.fn(), error: vi.fn() },
  };
});

const createEmployeeMock = vi.mocked(createEmployee);
const fetchEmployeeFiltersMock = vi.mocked(fetchEmployeeFilters);
const fetchCurrencyConfigMock = vi.mocked(fetchCurrencyConfig);
const notificationSuccessMock = vi.mocked(notification.success);

beforeEach(() => {
  createEmployeeMock.mockReset();
  fetchEmployeeFiltersMock.mockReset();
  fetchCurrencyConfigMock.mockReset();
  notificationSuccessMock.mockReset();
  fetchEmployeeFiltersMock.mockResolvedValue({ departments: ["Engineering"], countries: ["India"] });
  fetchCurrencyConfigMock.mockResolvedValue({
    currencies: ["USD", "INR"],
    countryCurrencyDefaults: { India: "INR" },
  });
});

async function fillMinimalValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.click(screen.getByLabelText("Department"));
  await user.click(await screen.findByRole("option", { name: "Engineering" }));
  await user.click(screen.getByLabelText("Country"));
  await user.click(await screen.findByRole("option", { name: "India" }));
  await user.clear(screen.getByLabelText("Salary Amount"));
  await user.type(screen.getByLabelText("Salary Amount"), "85000");
  await user.type(screen.getByLabelText("Joined Date"), "2024-01-15{Escape}");
}

describe("CreateEmployeeModal", () => {
  it("surfaces a mocked 400 field error onto the matching Form.Item", async () => {
    createEmployeeMock.mockRejectedValue(new ApiFieldError({ name: "Name is required" }));
    const user = userEvent.setup();
    renderWithProviders(<CreateEmployeeModal open onClose={vi.fn()} />);

    await fillMinimalValidForm(user);
    await user.click(screen.getByRole("button", { name: /create employee/i }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
  });

  it("closes the modal only after a successful create", async () => {
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
    const handleClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CreateEmployeeModal open onClose={handleClose} />);

    await fillMinimalValidForm(user);
    await user.click(screen.getByRole("button", { name: /create employee/i }));

    await waitFor(() => expect(handleClose).toHaveBeenCalled());
  });

  it("shows a success notification after a successful create", async () => {
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
    const user = userEvent.setup();
    renderWithProviders(<CreateEmployeeModal open onClose={vi.fn()} />);

    await fillMinimalValidForm(user);
    await user.click(screen.getByRole("button", { name: /create employee/i }));

    await waitFor(() => {
      expect(notificationSuccessMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Employee created"),
        }),
      );
    });
  });

  it("calls onClose when the modal's close (X) button is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CreateEmployeeModal open onClose={handleClose} />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(handleClose).toHaveBeenCalled();
  });
});
