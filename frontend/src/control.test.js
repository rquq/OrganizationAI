import { expect, it } from "vitest";
import { controlAvailability } from "./control.js";

it("offers only synthetic review actions in AWAITING_REVIEW", () => {
  expect(controlAvailability("AWAITING_REVIEW")).toEqual({
    pause: true,
    resume: false,
    allow: true,
    decline: true,
    undo: false,
  });
});
