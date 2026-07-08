import { Button, Popconfirm, Space, Table } from "antd";
import type { TableProps } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { Employee, PaginationMeta } from "../api/types";

export interface EmployeeTableProps {
  data: Employee[];
  pagination: PaginationMeta;
  isFetching: boolean;
  onChange: (page: number, pageSize: number) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

function buildColumns(
  onEdit: (employee: Employee) => void,
  onDelete: (employee: Employee) => void,
): TableProps<Employee>["columns"] {
  return [
    { title: "Employee Code", dataIndex: "employeeCode", key: "employeeCode" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Department", dataIndex: "department", key: "department" },
    { title: "Country", dataIndex: "country", key: "country" },
    {
      title: "Salary",
      key: "salary",
      render: (_, employee) =>
        `${new Intl.NumberFormat("en-US").format(employee.salaryAmount)} ${employee.currencyCode}`,
    },
    {
      title: "Joined",
      dataIndex: "joinedAt",
      key: "joinedAt",
      render: (joinedAt: string) => new Date(joinedAt).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, employee) => (
        <Space>
          <Button
            type="text"
            aria-label={`Edit ${employee.name}`}
            icon={<EditOutlined />}
            onClick={() => onEdit(employee)}
          />
          <Popconfirm
            title="Remove this employee?"
            okText="Delete"
            cancelText="Cancel"
            onConfirm={() => onDelete(employee)}
          >
            <Button type="text" danger aria-label={`Delete ${employee.name}`} icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}

export function EmployeeTable({
  data,
  pagination,
  isFetching,
  onChange,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  return (
    <Table<Employee>
      rowKey="id"
      columns={buildColumns(onEdit, onDelete)}
      dataSource={data}
      loading={isFetching}
      pagination={{
        current: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
      }}
      onChange={(tablePagination) => {
        onChange(tablePagination.current ?? 1, tablePagination.pageSize ?? pagination.pageSize);
      }}
    />
  );
}
