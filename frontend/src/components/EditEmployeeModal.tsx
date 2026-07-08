import { Modal, notification } from "antd";
import dayjs from "dayjs";
import { EmployeeForm, type EmployeeFormValues } from "./EmployeeForm";
import { useUpdateEmployee } from "../hooks/useUpdateEmployee";
import type { Employee, UpdateEmployeePayload } from "../api/types";

export interface EditEmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
}

function diffPayload(employee: Employee, values: EmployeeFormValues): UpdateEmployeePayload {
  const payload: UpdateEmployeePayload = {};

  if (values.name !== employee.name) payload.name = values.name;
  if (values.department !== employee.department) payload.department = values.department;
  if (values.country !== employee.country) payload.country = values.country;
  if (values.currencyCode !== employee.currencyCode) payload.currencyCode = values.currencyCode;
  if (values.salaryAmount !== employee.salaryAmount) payload.salaryAmount = values.salaryAmount;
  if (values.joinedAt !== dayjs(employee.joinedAt).format("YYYY-MM-DD")) {
    payload.joinedAt = values.joinedAt;
  }

  return payload;
}

export function EditEmployeeModal({ employee, onClose }: EditEmployeeModalProps) {
  const mutation = useUpdateEmployee();

  async function handleSubmit(values: EmployeeFormValues) {
    if (!employee) return;

    const payload = diffPayload(employee, values);
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    const updated = await mutation.mutateAsync({ id: employee.id, payload });
    notification.success({
      message: "Employee updated",
      description: `${updated.name} (${updated.employeeCode}) was updated.`,
    });
    onClose();
  }

  return (
    <Modal open={employee !== null} onCancel={onClose} title="Edit Employee" footer={null} destroyOnHidden>
      {employee && (
        <EmployeeForm
          mode="edit"
          initialValues={{
            name: employee.name,
            department: employee.department,
            country: employee.country,
            currencyCode: employee.currencyCode,
            salaryAmount: employee.salaryAmount,
            joinedAt: employee.joinedAt,
          }}
          onSubmit={handleSubmit}
        />
      )}
    </Modal>
  );
}
