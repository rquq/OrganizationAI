import { describe, expect, it } from "vitest";
import { renderShell } from "./main.js";

describe("renderShell", () => {
  it("keeps the temporary boundary visible and exposes the start action", () => {
    document.body.innerHTML = '<main id="app"></main>';
    renderShell(document.querySelector("#app"));

    expect(document.querySelector("#boundary-notice").textContent).toContain("No payment");
    expect(document.querySelector("#start-case").textContent).toContain("Start a synthetic case");
    expect(document.querySelector("#start-case").getAttribute("type")).toBe("button");
  });
});
