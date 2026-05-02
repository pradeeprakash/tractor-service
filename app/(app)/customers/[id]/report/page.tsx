import { CustomerReportClient } from "./CustomerReportClient";

export default async function CustomerReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerReportClient customerId={id} />;
}
