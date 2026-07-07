import { useState } from "react";
import { Alert, Empty, Flex, Input, Space } from "antd";
import { EmployeeTable } from "../components/EmployeeTable";
import { useEmployees } from "../hooks/useEmployees";

const DEFAULT_PAGE_SIZE = 20;

export function EmployeeListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");

  const query = useEmployees({ page, pageSize, search: searchInput || undefined });

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
          placeholder="Search by name"
          style={{ maxWidth: 320 }}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          allowClear
        />
        {/* Reserved for department/country filters once GET /employees/filters exists */}
        <Space size="middle" />
      </Flex>

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
