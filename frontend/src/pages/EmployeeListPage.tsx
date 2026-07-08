import { useEffect, useState } from "react";
import { Alert, Button, Empty, Flex, Input, Select, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { EmployeeTable } from "../components/EmployeeTable";
import { CreateEmployeeModal } from "../components/CreateEmployeeModal";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useEmployeeFilters } from "../hooks/useEmployeeFilters";
import { useEmployees } from "../hooks/useEmployees";

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function EmployeeListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [department, setDepartment] = useState("");
  const [country, setCountry] = useState("");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const filtersQuery = useEmployeeFilters();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department, country]);

  const query = useEmployees({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    department: department || undefined,
    country: country || undefined,
  });

  const departmentOptions = [
    { value: "", label: "All Departments" },
    ...(filtersQuery.data?.departments ?? []).map((value) => ({ value, label: value })),
  ];

  const countryOptions = [
    { value: "", label: "All Countries" },
    ...(filtersQuery.data?.countries ?? []).map((value) => ({ value, label: value })),
  ];

  const data = query.data?.data ?? [];
  const pagination = query.data?.pagination ?? { page, pageSize, total: 0, totalPages: 0 };
  const isEmpty = !query.isFetching && !query.isError && data.length === 0;

  function handleTableChange(nextPage: number, nextPageSize: number) {
    setPage(nextPage);
    setPageSize(nextPageSize);
  }

  return (
    <div>
      <Flex gap="middle" wrap="wrap" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by name or employee code"
          style={{ maxWidth: 320 }}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          allowClear
        />
        <Space size="middle">
          <div data-testid="department-filter">
            <Select
              value={department}
              onChange={setDepartment}
              options={departmentOptions}
              loading={filtersQuery.isLoading}
              virtual={false}
              style={{ minWidth: 180 }}
            />
          </div>
          <div data-testid="country-filter">
            <Select
              value={country}
              onChange={setCountry}
              options={countryOptions}
              loading={filtersQuery.isLoading}
              virtual={false}
              style={{ minWidth: 180 }}
            />
          </div>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          Add Employee
        </Button>
      </Flex>

      <CreateEmployeeModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />

      {query.isError ? (
        <Alert type="error" showIcon message="Couldn't load employees. Please try again." />
      ) : isEmpty ? (
        <Empty description="No employees found." />
      ) : (
        <EmployeeTable
          data={data}
          pagination={pagination}
          isFetching={query.isFetching}
          onChange={handleTableChange}
        />
      )}
    </div>
  );
}
