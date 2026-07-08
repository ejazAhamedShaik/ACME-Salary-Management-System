import { Modal, notification } from "antd";
import { EmployeeForm, type EmployeeFormValues } from "./EmployeeForm";
import { useCreateEmployee } from "../hooks/useCreateEmployee";

export interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateEmployeeModal({ open, onClose }: CreateEmployeeModalProps) {
  const mutation = useCreateEmployee();

  async function handleSubmit(values: EmployeeFormValues) {
    const created = await mutation.mutateAsync(values);
    notification.success({
      message: "Employee created",
      description: `${created.name} (${created.employeeCode}) was added.`,
    });
    onClose();
  }

  return (
    <Modal open={open} onCancel={onClose} title="Add Employee" footer={null} destroyOnHidden>
      {open && <EmployeeForm mode="create" onSubmit={handleSubmit} />}
    </Modal>
  );
}
