import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { App } from "../src/App";
import { renderWithProviders } from "./testUtils";
import { fetchEmployeeFilters, fetchEmployees } from "../src/api/employees";

vi.mock("../src/api/employees", () => ({
  fetchEmployees: vi.fn(),
  fetchEmployeeFilters: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
}));

const fetchEmployeesMock = vi.mocked(fetchEmployees);
const fetchEmployeeFiltersMock = vi.mocked(fetchEmployeeFilters);

describe("App", () => {
  it("renders the employee list search input", () => {
    fetchEmployeesMock.mockReturnValue(new Promise(() => {}));
    fetchEmployeeFiltersMock.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<App />);

    expect(screen.getByPlaceholderText("Search by name or employee code")).toBeInTheDocument();
  });
});
