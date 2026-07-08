import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployeeForm } from "../src/components/EmployeeForm";
import { renderWithProviders } from "./testUtils";
import { fetchEmployeeFilters } from "../src/api/employees";
import { fetchCurrencyConfig } from "../src/api/config";

vi.mock("../src/api/employees", () => ({
  fetchEmployeeFilters: vi.fn(),
  fetchEmployees: vi.fn(),
  createEmployee: vi.fn(),
}));
vi.mock("../src/api/config", () => ({ fetchCurrencyConfig: vi.fn() }));

const fetchEmployeeFiltersMock = vi.mocked(fetchEmployeeFilters);
const fetchCurrencyConfigMock = vi.mocked(fetchCurrencyConfig);

beforeEach(() => {
  fetchEmployeeFiltersMock.mockReset();
  fetchCurrencyConfigMock.mockReset();
  fetchEmployeeFiltersMock.mockResolvedValue({
    departments: ["Engineering", "Finance"],
    countries: ["India", "Germany"],
  });
  fetchCurrencyConfigMock.mockResolvedValue({
    currencies: ["USD", "INR", "EUR"],
    countryCurrencyDefaults: { India: "INR", Germany: "EUR" },
  });
});

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("EmployeeForm", () => {
  it("populates the currency Select from the mocked config", async () => {
    renderWithProviders(<EmployeeForm mode="create" onSubmit={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Currency"));

    expect(await screen.findByRole("option", { name: "INR" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "EUR" })).toBeInTheDocument();
  });

  it("sets the mapped default currency when a country is selected", async () => {
    renderWithProviders(<EmployeeForm mode="create" onSubmit={vi.fn()} />);
    const user = userEvent.setup();

    await selectOption(user, "Country", "India");

    await waitFor(() => {
      expect(within(screen.getByLabelText("Currency")).queryByTitle("INR")).toBeInTheDocument();
    });
  });

  it("keeps currency changeable after it was auto-set from country", async () => {
    renderWithProviders(<EmployeeForm mode="create" onSubmit={vi.fn()} />);
    const user = userEvent.setup();

    await selectOption(user, "Country", "India");
    await waitFor(() => {
      expect(within(screen.getByLabelText("Currency")).queryByTitle("INR")).toBeInTheDocument();
    });

    await selectOption(user, "Currency", "USD");

    expect(within(screen.getByLabelText("Currency")).queryByTitle("USD")).toBeInTheDocument();
  });

  it("calls onSubmit with the exact payload shape, no employeeCode", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<EmployeeForm mode="create" onSubmit={handleSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await selectOption(user, "Department", "Engineering");
    await selectOption(user, "Country", "India");
    await user.clear(screen.getByLabelText("Salary Amount"));
    await user.type(screen.getByLabelText("Salary Amount"), "85000");
    await user.type(screen.getByLabelText("Joined Date"), "2024-01-15{Escape}");

    await user.click(screen.getByRole("button", { name: /create employee/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Ada Lovelace",
          department: "Engineering",
          country: "India",
          currencyCode: "INR",
          salaryAmount: 85000,
          joinedAt: "2024-01-15",
        }),
      );
    });
    const submittedPayload = handleSubmit.mock.calls[0][0];
    expect(submittedPayload).not.toHaveProperty("employeeCode");
  });

  it("blocks submission client-side when a required field is empty", async () => {
    const handleSubmit = vi.fn();
    renderWithProviders(<EmployeeForm mode="create" onSubmit={handleSubmit} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /create employee/i }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
