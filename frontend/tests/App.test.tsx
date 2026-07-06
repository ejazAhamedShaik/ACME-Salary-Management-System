import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowserRouter } from "react-router";
import { App } from "../src/App";

describe("App", () => {
  it("renders the employee directory placeholder", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    expect(screen.getByText("Employee Directory — coming soon")).toBeInTheDocument();
  });
});
