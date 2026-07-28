import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getPublicOrderStatus } from "@/server/actions/order-tracking";
import { stageLabel, stagesForWorkflow } from "@/server/hq/workflows";

export const metadata: Metadata = {
  title: "Track your order",
  robots: { index: false, follow: false },
};

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPublicOrderStatus(id);
  if (!order) notFound();

  const stages = stagesForWorkflow(order.workflow);
  const currentIndex = stages.indexOf(order.stage as (typeof stages)[number]);

  return (
    <Container width="narrow" className="py-20 md:py-28">
      <Eyebrow>Order status</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        {order.lineItems[0]?.description ?? "Your order"}
      </h1>
      <p className="text-muted mt-4 text-[15px]">
        Placed{" "}
        {new Date(order.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <ol className="border-line mt-10 flex flex-col gap-4 border-t pt-8">
        {stages.map((stage, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          return (
            <li key={stage} className="flex items-center gap-3">
              <span
                className={`size-2.5 shrink-0 rounded-full ${
                  done || current ? "bg-ink" : "bg-line"
                }`}
              />
              <span
                className={
                  current
                    ? "text-ink font-medium"
                    : done
                      ? "text-graphite"
                      : "text-muted"
                }
              >
                {stageLabel(stage)}
              </span>
            </li>
          );
        })}
      </ol>

      {order.trackingCarrier && order.trackingNumber ? (
        <div className="border-line bg-sand/20 mt-8 rounded-lg border p-5">
          <p className="text-ink text-[13px] font-semibold tracking-[0.04em]">
            Tracking
          </p>
          <p className="text-graphite mt-1.5 text-[14px]">
            {order.trackingCarrier} — {order.trackingNumber}
          </p>
          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brass mt-2 inline-block text-[13px] underline underline-offset-2"
            >
              Track shipment
            </a>
          ) : null}
        </div>
      ) : null}

      {order.promisedDeliveryDate ? (
        <p className="text-muted mt-6 text-[14px]">
          Estimated delivery:{" "}
          {new Date(order.promisedDeliveryDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
          })}
        </p>
      ) : null}
    </Container>
  );
}
