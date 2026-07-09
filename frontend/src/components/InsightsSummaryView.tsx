import { Statistic, Table, Typography } from "antd";
import type { TableProps } from "antd";
import type { InsightsSummary as InsightsSummaryData } from "../api/types";
import { formatUSD } from "../utils/formatCurrency";

export interface InsightsSummaryViewProps {
  summary: InsightsSummaryData;
}

interface DepartmentRow {
  key: string;
  department: string;
  headcount: number;
  avgSalaryUSD: number;
}

interface CountryRow {
  key: string;
  country: string;
  headcount: number;
  totalPayrollUSD: number;
  avgSalaryUSD: number;
}

const departmentColumns: TableProps<DepartmentRow>["columns"] = [
  { title: "Department", dataIndex: "department", key: "department" },
  { title: "Headcount", dataIndex: "headcount", key: "headcount" },
  {
    title: "Avg Salary",
    dataIndex: "avgSalaryUSD",
    key: "avgSalaryUSD",
    render: (value: number) => formatUSD(value),
  },
];

const countryColumns: TableProps<CountryRow>["columns"] = [
  { title: "Country", dataIndex: "country", key: "country" },
  { title: "Headcount", dataIndex: "headcount", key: "headcount" },
  {
    title: "Total Payroll",
    dataIndex: "totalPayrollUSD",
    key: "totalPayrollUSD",
    render: (value: number) => formatUSD(value),
  },
  {
    title: "Avg Salary",
    dataIndex: "avgSalaryUSD",
    key: "avgSalaryUSD",
    render: (value: number) => formatUSD(value),
  },
];

export function InsightsSummaryView({ summary }: InsightsSummaryViewProps) {
  const departmentRows: DepartmentRow[] = Object.keys(summary.headcountByDepartment).map(
    (department) => ({
      key: department,
      department,
      headcount: summary.headcountByDepartment[department]!,
      avgSalaryUSD: summary.avgSalaryByDepartmentUSD[department] ?? 0,
    }),
  );

  const countryRows: CountryRow[] = Object.keys(summary.headcountByCountry).map((country) => ({
    key: country,
    country,
    headcount: summary.headcountByCountry[country]!,
    totalPayrollUSD: summary.totalPayrollByCountryUSD[country] ?? 0,
    avgSalaryUSD: summary.avgSalaryByCountryUSD[country] ?? 0,
  }));

  return (
    <div>
      <Statistic title="Total Payroll" value={formatUSD(summary.totalPayrollUSD)} />

      <Typography.Title level={4} style={{ marginTop: 24 }}>
        By Department
      </Typography.Title>
      <Table<DepartmentRow>
        rowKey="key"
        columns={departmentColumns}
        dataSource={departmentRows}
        pagination={false}
      />

      <Typography.Title level={4} style={{ marginTop: 24 }}>
        By Country
      </Typography.Title>
      <Table<CountryRow> rowKey="key" columns={countryColumns} dataSource={countryRows} pagination={false} />
    </div>
  );
}
