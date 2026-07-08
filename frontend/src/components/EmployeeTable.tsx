import { Button, Table } from "antd";
import type { TableProps } from "antd";
import { EditOutlined } from "@ant-design/icons";
import type { Employee, PaginationMeta } from "../api/types";

export interface EmployeeTableProps {
  data: Employee[];
  pagination: PaginationMeta;
  isFetching: boolean;
  onChange: (page: number, pageSize: number) => void;
  onEdit: (employee: Employee) => void;
}

function buildColumns(onEdit: (employee: Employee) => void): TableProps<Employee>["columns"] {
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
        <Button
          type="text"
          aria-label={`Edit ${employee.name}`}
          icon={<EditOutlined />}
          onClick={() => onEdit(employee)}
        />
      ),
    },
  ];
}

export function EmployeeTable({ data, pagination, isFetching, onChange, onEdit }: EmployeeTableProps) {
  return (
    <Table<Employee>
      rowKey="id"
      columns={buildColumns(onEdit)}
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
