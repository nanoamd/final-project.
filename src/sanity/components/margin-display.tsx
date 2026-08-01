import { Card, Text } from "@sanity/ui";
import { useFormValue } from "sanity";

/**
 * Read-only margin computed from price/costPrice/shippingCost at render
 * time — never persisted, so it can't drift from the fields it's derived
 * from.
 */
export function MarginDisplay() {
  const price = useFormValue(["price"]) as number | undefined;
  const costPrice = useFormValue(["costPrice"]) as number | undefined;
  const shippingCost = useFormValue(["shippingCost"]) as number | undefined;

  if (!price || !costPrice) {
    return (
      <Card padding={3} radius={2} tone="transparent" border>
        <Text size={1} muted>
          Enter a price and cost price to see margin.
        </Text>
      </Card>
    );
  }

  const totalCost = costPrice + (shippingCost ?? 0);
  const margin = ((price - totalCost) / price) * 100;
  const tone = margin < 0 ? "critical" : margin < 20 ? "caution" : "positive";

  return (
    <Card padding={3} radius={2} tone={tone} border>
      <Text size={2} weight="semibold">
        {margin.toFixed(1)}% margin
      </Text>
      <Text size={1} muted style={{ marginTop: 4 }}>
        {`£${(price - totalCost).toFixed(2)} profit per unit`}
        {shippingCost ? ` (incl. £${shippingCost.toFixed(2)} shipping)` : ""}
      </Text>
    </Card>
  );
}
