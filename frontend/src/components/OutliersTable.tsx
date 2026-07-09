import { Table, Typography } from "antd";
import type { TableProps } from "antd";
import type { DepartmentOutlier, OutlierEmployee } from "../api/types";
import { formatUSD } from "../utils/formatCurrency";

export interface OutliersTableProps {
  outliersByDepartment: DepartmentOutlier[];
}

function renderEmployee(employee: OutlierEmployee) {
  return (
    <div>
      <div>
        {employee.name} ({employee.employeeCode})
      </div>
      <div>{formatUSD(employee.salaryUSD)}</div>
    </div>
  );
}

const columns: TableProps<DepartmentOutlier>["columns"] = [
  { title: "Department", dataIndex: "department", key: "department" },
  {
    title: "Highest Earner",
    key: "highest",
    render: (_, record) => renderEmployee(record.highest),
  },
  {
    title: "Lowest Earner",
    key: "lowest",
    render: (_, record) =>
      record.highest.id === record.lowest.id ? (
        <Typography.Text type="secondary">Same as highest — sole employee</Typography.Text>
      ) : (
        renderEmployee(record.lowest)
      ),
  },
];

export function OutliersTable({ outliersByDepartment }: OutliersTableProps) {
  return (
    <Table<DepartmentOutlier>
      rowKey="department"
      columns={columns}
      dataSource={outliersByDepartment}
      pagination={false}
    />
  );
}
