import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TimeSelect } from "@/components/TimeSelect";

const triggers = () =>
  screen.getAllByRole("combobox").map((t) => (t.textContent ?? "").trim());

describe("TimeSelect", () => {
  it("shows a time in 24-hour form without AM/PM", () => {
    render(<TimeSelect value="19:00" onChange={() => {}} ariaLabel="Понедельник: начало" />);

    expect(triggers()).toEqual(["19", "00"]);
    expect(document.body.textContent).not.toMatch(/\b(AM|PM)\b/i);
  });

  it("changes the hour and keeps the minutes", () => {
    const onChange = vi.fn();
    render(<TimeSelect value="19:00" onChange={onChange} ariaLabel="Понедельник: конец" />);

    const hour = screen.getByRole("combobox", { name: "Понедельник: конец: часы" });
    fireEvent.keyDown(hour, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name: "08" }));

    expect(onChange).toHaveBeenCalledWith("08:00");
  });
});
