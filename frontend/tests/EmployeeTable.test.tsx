import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployeeTable } from "../src/components/EmployeeTable";

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

function renderTable(onDelete: (employee: typeof mockEmployee) => void) {
  return render(
    <EmployeeTable
      data={[mockEmployee]}
      pagination={{ page: 1, pageSize: 20, total: 1, totalPages: 1 }}
      isFetching={false}
      onChange={vi.fn()}
      onEdit={vi.fn()}
      onDelete={onDelete}
    />,
  );
}

describe("EmployeeTable delete action", () => {
  it("does not call onDelete when the Delete button is clicked — opens a confirmation first", async () => {
    const onDelete = vi.fn();
    renderTable(onDelete);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete Jane Doe" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(await screen.findByText(/remove this employee/i)).toBeInTheDocument();
  });

  it("calls onDelete with the employee when the confirmation is confirmed", async () => {
    const onDelete = vi.fn();
    renderTable(onDelete);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete Jane Doe" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith(mockEmployee);
  });

  it("calls nothing when the confirmation is cancelled", async () => {
    const onDelete = vi.fn();
    renderTable(onDelete);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete Jane Doe" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(onDelete).not.toHaveBeenCalled();
  });
});
