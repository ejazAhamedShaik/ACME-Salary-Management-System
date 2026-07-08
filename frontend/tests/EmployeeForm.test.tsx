import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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

function getSelectedLabel(label: string): string | null {
  const combobox = screen.getByLabelText(label);
  const content = combobox.closest(".ant-select")?.querySelector(".ant-select-content");
  return content?.getAttribute("title") ?? null;
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
      expect(getSelectedLabel("Currency")).toBe("INR");
    });
  });

  it("keeps currency changeable after it was auto-set from country", async () => {
    renderWithProviders(<EmployeeForm mode="create" onSubmit={vi.fn()} />);
    const user = userEvent.setup();

    await selectOption(user, "Country", "India");
    await waitFor(() => {
      expect(getSelectedLabel("Currency")).toBe("INR");
    });

    await selectOption(user, "Currency", "USD");

    expect(getSelectedLabel("Currency")).toBe("USD");
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

  describe("edit mode salary reset", () => {
    const initialValues = {
      name: "Ada Lovelace",
      department: "Engineering",
      country: "India",
      currencyCode: "INR",
      salaryAmount: 85_000,
      joinedAt: "2024-01-15",
    };

    it("clears salary when country changes to one with a different mapped currency", async () => {
      renderWithProviders(
        <EmployeeForm mode="edit" initialValues={initialValues} onSubmit={vi.fn()} />,
      );
      const user = userEvent.setup();

      await selectOption(user, "Country", "Germany");

      await waitFor(() => {
        expect(getSelectedLabel("Currency")).toBe("EUR");
        expect((screen.getByLabelText("Salary Amount") as HTMLInputElement).value).toBe("");
      });
    });

    it("does not clear salary when country changes to one with the same mapped currency", async () => {
      fetchEmployeeFiltersMock.mockResolvedValue({
        departments: ["Engineering", "Finance"],
        countries: ["India", "Germany", "Nepal"],
      });
      fetchCurrencyConfigMock.mockResolvedValue({
        currencies: ["USD", "INR", "EUR"],
        countryCurrencyDefaults: { India: "INR", Germany: "EUR", Nepal: "INR" },
      });
      renderWithProviders(
        <EmployeeForm mode="edit" initialValues={initialValues} onSubmit={vi.fn()} />,
      );
      const user = userEvent.setup();
      const salaryInput = screen.getByLabelText("Salary Amount") as HTMLInputElement;
      const originalValue = salaryInput.value;

      await selectOption(user, "Country", "Nepal");

      await waitFor(() => expect(getSelectedLabel("Currency")).toBe("INR"));
      expect(salaryInput.value).toBe(originalValue);
    });

    it("clears salary when currency is changed directly, and shows a currency-specific placeholder", async () => {
      renderWithProviders(
        <EmployeeForm mode="edit" initialValues={initialValues} onSubmit={vi.fn()} />,
      );
      const user = userEvent.setup();

      await selectOption(user, "Currency", "USD");

      await waitFor(() => {
        expect(getSelectedLabel("Currency")).toBe("USD");
        expect((screen.getByLabelText("Salary Amount") as HTMLInputElement).value).toBe("");
        expect(screen.getByPlaceholderText("Enter salary in USD")).toBeInTheDocument();
      });
    });

    it("does not clear salary when only an unrelated field changes", async () => {
      renderWithProviders(
        <EmployeeForm mode="edit" initialValues={initialValues} onSubmit={vi.fn()} />,
      );
      const user = userEvent.setup();
      const salaryInput = screen.getByLabelText("Salary Amount") as HTMLInputElement;
      const originalValue = salaryInput.value;

      await selectOption(user, "Department", "Finance");

      expect(salaryInput.value).toBe(originalValue);
    });
  });
});
