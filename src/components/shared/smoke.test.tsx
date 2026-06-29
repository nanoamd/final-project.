import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// A self-contained component proves the React + jsdom + jest-dom pipeline
// works, without depending on any app component yet.
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}

describe("component testing setup", () => {
  it("renders a component into the DOM", () => {
    render(<Greeting name="world" />);

    expect(
      screen.getByRole("heading", { name: "Hello, world" }),
    ).toBeInTheDocument();
  });
});
