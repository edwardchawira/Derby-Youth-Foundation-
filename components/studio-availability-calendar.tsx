"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Matcher } from "react-day-picker";

interface StudioAvailabilityCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  accentColor?: "sky" | "coral" | "teal";
}

export function StudioAvailabilityCalendar({
  selected,
  onSelect,
  className,
  accentColor = "teal",
}: StudioAvailabilityCalendarProps) {
  const [fullyBlockedDates, setFullyBlockedDates] = useState<Set<string>>(new Set());
  const BUSINESS_HOURS_COUNT = 15; // 09:00-23:00

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("blocked_slots")
      .select("blocked_date, blocked_time")
      .gte("blocked_date", today)
      .then(({ data }) => {
        const countByDate = new Map<string, number>();
        (data || []).forEach((r) => {
          const c = (countByDate.get(r.blocked_date) || 0) + 1;
          countByDate.set(r.blocked_date, c);
        });
        const fullyBlocked = new Set<string>();
        countByDate.forEach((count, date) => {
          if (count >= BUSINESS_HOURS_COUNT) fullyBlocked.add(date);
        });
        setFullyBlockedDates(fullyBlocked);
      });
  }, []);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const disabledMatchers: Matcher[] = [
    { before: todayStart },
    ...Array.from(fullyBlockedDates).map((d) => {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, m - 1, day);
    }),
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">Select date</p>
      <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          disabled={disabledMatchers}
          fromDate={new Date()}
          className={cn(
            "rounded-md border",
            accentColor === "sky" && "data-[selected]:bg-sky data-[selected]:text-background",
            accentColor === "coral" && "data-[selected]:bg-coral data-[selected]:text-background",
            accentColor === "teal" && "data-[selected]:bg-teal data-[selected]:text-background"
          )}
          classNames={{
            day_selected:
              accentColor === "sky"
                ? "bg-sky text-background hover:bg-sky/90"
                : accentColor === "coral"
                ? "bg-coral text-background hover:bg-coral/90"
                : "bg-teal text-background hover:bg-teal/90",
          }}
        />
      <p className="text-xs text-muted-foreground">
        Select a date, then choose a time slot.
      </p>
    </div>
  );
}
