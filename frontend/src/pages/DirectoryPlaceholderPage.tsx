import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export function DirectoryPlaceholderPage() {
  return (
    <Card>
      <Title level={2}>Employee Directory — coming soon</Title>
      <Paragraph>
        This is where the paginated, searchable employee directory will live.
      </Paragraph>
    </Card>
  );
}
