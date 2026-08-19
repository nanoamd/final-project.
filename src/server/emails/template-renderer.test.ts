import { describe, expect, it } from "vitest";

import {
  type EmailTemplateDoc,
  fillVariables,
  renderTemplate,
} from "./template-renderer";

const base: EmailTemplateDoc = {
  key: "order-confirmation",
  enabled: true,
  subject: "Thanks, {{customerName}}",
  preheader: "Order {{orderNumber}} is confirmed",
  blocks: [
    { _type: "emailHeading", text: "Order confirmed", eyebrow: "Kaiku" },
    { _type: "emailText", text: "Hello {{customerName}}, thank you." },
  ],
};

const vars = { customerName: "Damien", orderNumber: "KK-1001" };

describe("fillVariables", () => {
  it("substitutes known variables", () => {
    expect(fillVariables("Hi {{customerName}}", vars)).toBe("Hi Damien");
  });

  it("tolerates whitespace inside the braces", () => {
    expect(fillVariables("Hi {{  customerName  }}", vars)).toBe("Hi Damien");
  });

  it("leaves an unknown variable visible rather than blanking it", () => {
    // A typo must be obvious on the first test send, not a silent hole.
    expect(fillVariables("Hi {{customerNmae}}", vars)).toBe(
      "Hi {{customerNmae}}",
    );
  });

  it("leaves a null-valued variable as typed", () => {
    expect(fillVariables("Track: {{trackingUrl}}", { trackingUrl: null })).toBe(
      "Track: {{trackingUrl}}",
    );
  });
});

describe("renderTemplate fallback", () => {
  it("returns null when the template is missing", () => {
    expect(renderTemplate({ template: null, variables: vars })).toBeNull();
  });

  it("returns null when not enabled, so the built-in email still sends", () => {
    expect(
      renderTemplate({
        template: { ...base, enabled: false },
        variables: vars,
      }),
    ).toBeNull();
  });

  it("returns null when there are no blocks", () => {
    expect(
      renderTemplate({ template: { ...base, blocks: [] }, variables: vars }),
    ).toBeNull();
  });

  it("returns null when the subject is blank", () => {
    expect(
      renderTemplate({
        template: { ...base, subject: "   " },
        variables: vars,
      }),
    ).toBeNull();
  });

  it("returns null when every block renders to nothing", () => {
    // An image block with no asset would otherwise send a blank email.
    const result = renderTemplate({
      template: {
        ...base,
        blocks: [{ _type: "emailImage", alt: "x", imageUrl: null }],
      },
      variables: vars,
    });
    expect(result).toBeNull();
  });
});

describe("renderTemplate output", () => {
  it("fills variables in the subject", () => {
    expect(renderTemplate({ template: base, variables: vars })?.subject).toBe(
      "Thanks, Damien",
    );
  });

  it("renders headings and paragraphs with variables filled", () => {
    const html = renderTemplate({ template: base, variables: vars })!.html;
    expect(html).toContain("Order confirmed");
    expect(html).toContain("Hello Damien, thank you.");
  });

  it("escapes text so a name with an apostrophe cannot break the markup", () => {
    const html = renderTemplate({
      template: {
        ...base,
        blocks: [{ _type: "emailText", text: "Hi {{customerName}}" }],
      },
      variables: { customerName: "O'Brien <script>" },
    })!.html;
    expect(html).toContain("O&#39;Brien &lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("renders an image with an absolute src, a width attribute and alt text", () => {
    const html = renderTemplate({
      template: {
        ...base,
        blocks: [
          {
            _type: "emailImage",
            imageUrl: "https://cdn.sanity.io/images/x/y/photo.jpg",
            alt: "A barrel sauna in a garden",
            width: 600,
          },
        ],
      },
      variables: vars,
    })!.html;
    expect(html).toContain('src="https://cdn.sanity.io/images/x/y/photo.jpg"');
    expect(html).toContain('alt="A barrel sauna in a garden"');
    // The attribute, not just the style — Outlook ignores max-width.
    expect(html).toContain('width="600"');
  });

  it("caps an oversized image at the 600px content column", () => {
    const html = renderTemplate({
      template: {
        ...base,
        blocks: [
          {
            _type: "emailImage",
            imageUrl: "https://cdn.sanity.io/x.jpg",
            alt: "x",
            width: 2000,
          },
        ],
      },
      variables: vars,
    })!.html;
    expect(html).toContain('width="600"');
    expect(html).not.toContain('width="2000"');
  });

  it("makes an image clickable when a link is set", () => {
    const html = renderTemplate({
      template: {
        ...base,
        blocks: [
          {
            _type: "emailImage",
            imageUrl: "https://cdn.sanity.io/x.jpg",
            alt: "x",
            href: "{{shopUrl}}",
          },
        ],
      },
      variables: { ...vars, shopUrl: "https://kaikuhome.com/shop" },
    })!.html;
    expect(html).toContain('href="https://kaikuhome.com/shop"');
  });

  it("drops a button whose link is an unresolved variable rather than sending a dead one", () => {
    const html = renderTemplate({
      template: {
        ...base,
        blocks: [
          { _type: "emailHeading", text: "Hello" },
          { _type: "emailButton", label: "Track", href: "{{trackingUrl}}" },
        ],
      },
      variables: {},
    })!.html;
    expect(html).not.toContain("Track");
  });

  it("renders the order summary from real lines", () => {
    const html = renderTemplate({
      template: {
        ...base,
        blocks: [{ _type: "emailOrderSummary" }],
      },
      variables: vars,
      orderLines: [
        {
          description: "Pennine Barrel Sauna",
          quantity: 1,
          amount: "£6,379.00",
        },
        { description: "Sauna Bucket", quantity: 2, amount: "£58.00" },
      ],
    })!.html;
    expect(html).toContain("Pennine Barrel Sauna");
    expect(html).toContain("£6,379.00");
    expect(html).toContain("Quantity: 2");
  });

  it("omits the order summary when there are no lines", () => {
    const result = renderTemplate({
      template: {
        ...base,
        blocks: [
          { _type: "emailHeading", text: "Hello" },
          { _type: "emailOrderSummary" },
        ],
      },
      variables: vars,
      orderLines: [],
    });
    expect(result).not.toBeNull();
    expect(result!.html).toContain("Hello");
  });

  it("skips an unknown block type instead of failing to send", () => {
    const result = renderTemplate({
      template: {
        ...base,
        blocks: [
          { _type: "emailHeading", text: "Still sends" },
          { _type: "somethingAddedLater" },
        ],
      },
      variables: vars,
    });
    expect(result!.html).toContain("Still sends");
  });

  it("produces a plain-text alternative alongside the HTML", () => {
    const result = renderTemplate({ template: base, variables: vars })!;
    expect(result.text).toContain("Order confirmed");
    expect(result.text).toContain("Hello Damien");
    expect(result.text).not.toContain("<p");
  });

  it("uses the description, not the URL, for an image in the text version", () => {
    const result = renderTemplate({
      template: {
        ...base,
        blocks: [
          {
            _type: "emailImage",
            imageUrl: "https://cdn.sanity.io/x.jpg",
            alt: "A barrel sauna",
          },
        ],
      },
      variables: vars,
    })!;
    expect(result.text).toContain("A barrel sauna");
    expect(result.text).not.toContain("cdn.sanity.io");
  });
});
