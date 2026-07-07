import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { App } from "../src/App";
import { renderWithProviders } from "./testUtils";
import { fetchEmployees } from "../src/api/employees";

vi.mock("../src/api/employees", () => ({
  fetchEmployees: vi.fn(),
}));

const fetchEmployeesMock = vi.mocked(fetchEmployees);

describe("App", () => {
  it("renders the employee list search input", () => {
    fetchEmployeesMock.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<App />);

    expect(screen.getByPlaceholderText("Search by name")).toBeInTheDocument();
  });
});
