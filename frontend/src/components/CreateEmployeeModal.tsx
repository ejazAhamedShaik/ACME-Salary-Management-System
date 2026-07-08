import { Modal } from "antd";
import { EmployeeForm, type EmployeeFormValues } from "./EmployeeForm";
import { useCreateEmployee } from "../hooks/useCreateEmployee";

export interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateEmployeeModal({ open, onClose }: CreateEmployeeModalProps) {
  const mutation = useCreateEmployee();

  async function handleSubmit(values: EmployeeFormValues) {
    await mutation.mutateAsync(values);
    onClose();
  }

  return (
    <Modal open={open} onCancel={onClose} title="Add Employee" footer={null} destroyOnHidden>
      {open && <EmployeeForm mode="create" onSubmit={handleSubmit} />}
    </Modal>
  );
}
