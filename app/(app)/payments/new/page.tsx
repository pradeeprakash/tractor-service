import { PageHeader } from "@/components/common/PageHeader";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { getServerT } from "@/lib/i18n/server";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title={t("payment.title")}
        back={customer ? `/customers/${customer}` : "/customers"}
      />
      <div className="p-4">
        <PaymentForm key={customer ?? "no-customer"} initialCustomerId={customer} />
      </div>
    </>
  );
}
