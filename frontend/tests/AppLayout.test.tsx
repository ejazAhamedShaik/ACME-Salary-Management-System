import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import { renderWithProviders } from "./testUtils";
import { fetchEmployeeFilters, fetchEmployees } from "../src/api/employees";

vi.mock("../src/api/employees", () => ({
  fetchEmployees: vi.fn(),
  fetchEmployeeFilters: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
}));

const fetchEmployeesMock = vi.mocked(fetchEmployees);
const fetchEmployeeFiltersMock = vi.mocked(fetchEmployeeFilters);

describe("AppLayout navigation", () => {
  beforeEach(() => {
    fetchEmployeesMock.mockReturnValue(new Promise(() => {}));
    fetchEmployeeFiltersMock.mockReturnValue(new Promise(() => {}));
  });

  it("renders Employees and Insights nav links, with Employees active on /", () => {
    renderWithProviders(<App />);

    const employeesLink = screen.getByRole("menuitem", { name: "Employees" });
    const insightsLink = screen.getByRole("menuitem", { name: "Insights" });

    expect(employeesLink).toBeInTheDocument();
    expect(insightsLink).toBeInTheDocument();
    expect(employeesLink.className).toContain("ant-menu-item-selected");
    expect(insightsLink.className).not.toContain("ant-menu-item-selected");
  });

  it("navigates to the Insights page and highlights it as active when its nav link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(screen.getByRole("menuitem", { name: "Insights" }));

    expect(await screen.findByTestId("insights-page")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by name or employee code")).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Insights" }).className).toContain(
      "ant-menu-item-selected",
    );
  });
});
