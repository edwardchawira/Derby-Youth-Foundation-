"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudioBookedSlots, isSlotAvailable } from "@/hooks/use-studio-booked-slots";
import { format } from "date-fns";
import { toast } from "sonner";

interface StudioTimeSlotPickerProps {
  selectedDate: Date | undefined;
  selectedSlots: string[];
  onSlotsChange: (slots: string[]) => void;
  minHours?: number;
  accentColor?: "sky" | "coral" | "teal";
  className?: string;
}

const SLOT_LABELS: Record<string, string> = {
  "09:00": "9:00 AM",
  "10:00": "10:00 AM",
  "11:00": "11:00 AM",
  "12:00": "12:00 PM",
  "13:00": "1:00 PM",
  "14:00": "2:00 PM",
  "15:00": "3:00 PM",
  "16:00": "4:00 PM",
  "17:00": "5:00 PM",
  "18:00": "6:00 PM",
  "19:00": "7:00 PM",
  "20:00": "8:00 PM",
  "21:00": "9:00 PM",
  "22:00": "10:00 PM",
  "23:00": "11:00 PM",
};

function formatSlot(time: string): string {
  return SLOT_LABELS[time] ?? time;
}

function parseHour(time: string): number {
  const [h] = time.split(":").map(Number);
  return h ?? 0;
}

function slotToNext(time: string): string | null {
  const h = parseHour(time);
  if (h >= 23) return null;
  return `${String(h + 1).padStart(2, "0")}:00`;
}

function slotToPrev(time: string): string | null {
  const h = parseHour(time);
  if (h <= 9) return null;
  return `${String(h - 1).padStart(2, "0")}:00`;
}

/** When selection has a gap after removal, keep the earliest consecutive block */
function keepConsecutiveBlock(slots: string[]): string[] {
  if (slots.length <= 1) return slots;
  const sorted = [...slots].sort();
  const blocks: string[][] = [];
  let current: string[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const t = sorted[i];
    const prev = current[current.length - 1];
    const prevH = parseHour(prev);
    const currH = parseHour(t);
    if (currH - prevH === 1) {
      current.push(t);
    } else {
      blocks.push(current);
      current = [t];
    }
  }
  blocks.push(current);
  return blocks[0];
}

const ALL_SLOTS: string[] = [];
for (let h = 9; h <= 23; h++) {
  ALL_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
}

export function StudioTimeSlotPicker({
  selectedDate,
  selectedSlots,
  onSlotsChange,
  minHours = 1,
  accentColor = "teal",
  className,
}: StudioTimeSlotPickerProps) {
  const { bookings, blockedSlots, loading } = useStudioBookedSlots();

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  /** Build consecutive slots from startTime, count slots */
  const buildSlotsFrom = (startTime: string, count: number): string[] => {
    const slots: string[] = [];
    let t: string | null = startTime;
    for (let i = 0; i < count && t; i++) {
      slots.push(t);
      t = slotToNext(t);
    }
    return slots;
  };

  /** Check if all slots in range are available */
  const isRangeAvailable = (slots: string[]): boolean => {
    if (!dateStr) return false;
    return slots.every((s) => isSlotAvailable(dateStr, s, 1, bookings, new Date(), blockedSlots));
  };

  const handleSlotClick = (time: string) => {
    const isSelected = selectedSlots.includes(time);
    const available = !!dateStr && isSlotAvailable(dateStr, time, 1, bookings, new Date(), blockedSlots);

    if (isSelected) {
      if (selectedSlots.length <= minHours) return;
      const next = selectedSlots.filter((s) => s !== time);
      const kept = keepConsecutiveBlock(next);
      if (kept.length < minHours) return;
      onSlotsChange(kept);
      return;
    }

    if (!available) return;

    if (selectedSlots.length === 0) {
      const initialSlots = buildSlotsFrom(time, minHours);
      if (isRangeAvailable(initialSlots)) {
        onSlotsChange(initialSlots);
      } else if (minHours === 1) {
        onSlotsChange([time]);
      } else if (minHours > 1) {
        toast.error(`${minHours} consecutive hours not available from this time. Try another slot.`);
      }
      return;
    }

    const sorted = [...selectedSlots].sort();
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const prev = slotToPrev(min);
    const nextSlot = slotToNext(max);

    if (time === prev || time === nextSlot) {
      onSlotsChange([...sorted, time].sort());
    }
  };

  if (!selectedDate) return null;

  const accentClasses = {
    sky: "border-sky/50 hover:bg-sky/10",
    coral: "border-coral/50 hover:bg-coral/10",
    teal: "border-teal/50 hover:bg-teal/10",
  };

  const selectedClasses = {
    sky: "bg-sky text-background hover:bg-sky/90",
    coral: "bg-coral text-background hover:bg-coral/90",
    teal: "bg-teal text-background hover:bg-teal/90",
  };

  const sortedSelected = [...selectedSlots].sort();
  const minSlot = sortedSelected[0];
  const maxSlot = sortedSelected[sortedSelected.length - 1];
  const canAddBefore = minSlot ? slotToPrev(minSlot) : null;
  const canAddAfter = maxSlot ? slotToNext(maxSlot) : null;

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="text-sm font-medium mb-2">
          Click slots to select hours for {format(selectedDate, "EEE, d MMM")}
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          {selectedSlots.length > 0
            ? `${selectedSlots.length} hour${selectedSlots.length !== 1 ? "s" : ""} selected.${minHours > 1 ? ` Minimum ${minHours}h. ` : " "}Click to add or deselect hours.`
            : minHours > 1
            ? `Click a start time to book ${minHours} hours. Add extra hours by clicking adjacent slots.`
            : "Select consecutive hours (e.g. 9am, 10am, 11am = 3 hours)."}
        </p>
      </div>
      {loading ? (
        <div className="h-24 flex items-center justify-center border rounded-md bg-muted/30">
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {ALL_SLOTS.map((time) => {
            const available = !!dateStr && isSlotAvailable(dateStr, time, 1, bookings, new Date(), blockedSlots);
            const isSelected = selectedSlots.includes(time);

            const canSelect =
              available &&
              (isSelected ||
                selectedSlots.length === 0 ||
                time === canAddBefore ||
                time === canAddAfter);

            return (
              <Button
                key={time}
                type="button"
                variant="outline"
                size="default"
                disabled={!available && !isSelected}
                onClick={() => handleSlotClick(time)}
                className={cn(
                  "min-h-[44px] sm:min-h-[40px]",
                  "transition-all",
                  accentClasses[accentColor],
                  isSelected && selectedClasses[accentColor],
                  isSelected && "ring-2 ring-offset-2 ring-offset-background",
                  accentColor === "sky" && isSelected && "ring-sky",
                  accentColor === "coral" && isSelected && "ring-coral",
                  accentColor === "teal" && isSelected && "ring-teal",
                  available && !canSelect && !isSelected &&
                    "opacity-60 cursor-default",
                  !available &&
                    "opacity-50 cursor-not-allowed line-through bg-muted/50"
                )}
              >
                {formatSlot(time)}
              </Button>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Blocked and booked times are greyed out. Shared across rehearsal, recording & podcast.
      </p>
    </div>
  );
}
