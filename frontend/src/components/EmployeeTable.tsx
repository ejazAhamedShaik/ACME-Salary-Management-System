import { Table } from "antd";
import type { TableProps } from "antd";
import type { Employee, PaginationMeta } from "../api/types";

export interface EmployeeTableProps {
  data: Employee[];
  pagination: PaginationMeta;
  isFetching: boolean;
  onChange: (page: number, pageSize: number) => void;
}

const columns: TableProps<Employee>["columns"] = [
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
];

export function EmployeeTable({ data, pagination, isFetching, onChange }: EmployeeTableProps) {
  return (
    <Table<Employee>
      rowKey="id"
      columns={columns}
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
