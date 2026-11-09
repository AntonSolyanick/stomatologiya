import { describe, expect, it } from "vitest";
import { slotsForDate } from "./clinic";

const monday = new Date(2026, 10, 9);

describe("slotsForDate", () => {
  it("builds hourly slots from the edited workday start and end", () => {
    expect(slotsForDate({ "1": ["10:00", "14:00"] }, monday)).toEqual(["10:00", "11:00", "12:00", "13:00"]);
  });
  it("returns no slots on a day off", () => {
    expect(slotsForDate({ "1": null }, monday)).toEqual([]);
  });
});
