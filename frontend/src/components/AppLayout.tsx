import type { ReactNode } from "react";
import { Layout, Menu } from "antd";
import { Link, useLocation } from "react-router";

const NAV_ITEMS = [
  { key: "/", label: <Link to="/">Employees</Link> },
  { key: "/insights", label: <Link to="/insights">Insights</Link> },
];

export interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <Layout>
      <Layout.Header>
        <Menu theme="dark" mode="horizontal" selectedKeys={[location.pathname]} items={NAV_ITEMS} />
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>{children}</Layout.Content>
    </Layout>
  );
}
