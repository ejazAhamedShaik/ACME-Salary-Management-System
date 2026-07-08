import { useEffect } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEmployeeFilters } from "../hooks/useEmployeeFilters";
import { useCurrencyConfig } from "../hooks/useCurrencyConfig";
import { ApiFieldError } from "../api/employees";

export interface EmployeeFormValues {
  name: string;
  department: string;
  country: string;
  currencyCode: string;
  salaryAmount: number;
  joinedAt: string;
}

export interface EmployeeFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}

interface InternalFormValues {
  name?: string;
  department?: string;
  country?: string;
  currencyCode?: string;
  salaryAmount?: number;
  joinedAt?: Dayjs;
}

export function EmployeeForm({ mode, initialValues, onSubmit }: EmployeeFormProps) {
  const [form] = Form.useForm<InternalFormValues>();
  const filtersQuery = useEmployeeFilters();
  const currencyQuery = useCurrencyConfig();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        department: initialValues.department,
        country: initialValues.country,
        currencyCode: initialValues.currencyCode,
        salaryAmount: initialValues.salaryAmount,
        joinedAt: initialValues.joinedAt ? dayjs(initialValues.joinedAt) : undefined,
      });
    }
  }, [initialValues, form]);

  const departmentOptions = (filtersQuery.data?.departments ?? []).map((value) => ({
    value,
    label: value,
  }));
  const countryOptions = (filtersQuery.data?.countries ?? []).map((value) => ({
    value,
    label: value,
  }));
  const currencyOptions = (currencyQuery.data?.currencies ?? []).map((value) => ({
    value,
    label: value,
  }));

  function handleCountryChange(country: string) {
    const defaultCurrency = currencyQuery.data?.countryCurrencyDefaults[country];
    if (defaultCurrency) {
      form.setFieldValue("currencyCode", defaultCurrency);
    }
  }

  async function handleFinish(values: InternalFormValues) {
    const payload: EmployeeFormValues = {
      name: values.name!,
      department: values.department!,
      country: values.country!,
      currencyCode: values.currencyCode!,
      salaryAmount: values.salaryAmount!,
      joinedAt: values.joinedAt!.format("YYYY-MM-DD"),
    };

    try {
      await onSubmit(payload);
      if (mode === "create") {
        form.resetFields();
      }
    } catch (error) {
      if (error instanceof ApiFieldError) {
        form.setFields(
          Object.entries(error.errors).map(([name, message]) => ({
            name: name as keyof InternalFormValues,
            errors: [message],
          })),
        );
      } else {
        throw error;
      }
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, whitespace: true, message: "Name is required" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="department"
        label="Department"
        rules={[{ required: true, message: "Department is required" }]}
      >
        <Select options={departmentOptions} loading={filtersQuery.isLoading} virtual={false} />
      </Form.Item>
      <Form.Item
        name="country"
        label="Country"
        rules={[{ required: true, message: "Country is required" }]}
      >
        <Select
          options={countryOptions}
          loading={filtersQuery.isLoading}
          virtual={false}
          onChange={handleCountryChange}
        />
      </Form.Item>
      <Form.Item
        name="currencyCode"
        label="Currency"
        rules={[{ required: true, message: "Currency is required" }]}
      >
        <Select options={currencyOptions} loading={currencyQuery.isLoading} virtual={false} />
      </Form.Item>
      <Form.Item
        name="salaryAmount"
        label="Salary Amount"
        rules={[
          { required: true, message: "Salary amount is required" },
          { type: "number", min: 1, message: "Salary amount must be greater than zero" },
        ]}
      >
        <InputNumber style={{ width: "100%" }} min={1} />
      </Form.Item>
      <Form.Item
        name="joinedAt"
        label="Joined Date"
        rules={[{ required: true, message: "Joined date is required" }]}
      >
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {mode === "create" ? "Create Employee" : "Save Changes"}
        </Button>
      </Form.Item>
    </Form>
  );
}
