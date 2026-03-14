"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

export interface BookedSlot {
  date: string;
  time: string; // "HH:mm"
  sessionHours: number;
}

/**
 * Fetches all booked time slots from studio_bookings.
 * Includes: pending (during checkout), confirmed, completed (paid).
 * Excludes: cancelled, expired.
 * Shared across rehearsal, recording, podcast.
 * Subscribes to realtime for instant updates when bookings change.
 */
export function useStudioBookedSlots() {
  const [bookings, setBookings] = useState<BookedSlot[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set()); // keys: "date|time"
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [{ data, error }, { data: blocked }] = await Promise.all([
        supabase
          .from("studio_bookings")
          .select("booking_date, booking_time, session_hours")
          .in("booking_status", ["pending", "confirmed", "completed"])
          .gte("booking_date", today),
        supabase.from("blocked_slots").select("blocked_date, blocked_time").gte("blocked_date", today),
      ]);

      if (error) {
        console.error("Error fetching studio booked slots:", error);
        return;
      }

      setBookings(
        (data || []).map((row) => ({
          date: row.booking_date,
          time: String(row.booking_time).padStart(5, "0").slice(0, 5),
          sessionHours: Number(row.session_hours) || 1,
        }))
      );
      const set = new Set<string>((blocked || []).map((r) => `${r.blocked_date}|${r.blocked_time}`));
      setBlockedSlots(set);
    } catch (err) {
      console.error("Error in useStudioBookedSlots:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel("studio-bookings-slots")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "studio_bookings",
        },
        fetchBookings
      )
      .subscribe();

    const channelBlocked = supabase
      .channel("studio-blocked-slots")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blocked_slots",
        },
        fetchBookings
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channelBlocked);
    };
  }, [fetchBookings]);

  return { bookings, blockedSlots, loading };
}

const BUSINESS_HOURS = { start: 9, end: 23 }; // 9am - 11pm

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Check if [slotStart, slotStart + durationHours) overlaps with any booking on date.
 *  Also returns false if the slot is in the past (for today) or if any hour is blocked. */
export function isSlotAvailable(
  dateStr: string,
  slotTime: string,
  durationHours: number,
  bookings: BookedSlot[],
  now?: Date,
  blockedSlots?: Set<string>
): boolean {
  const slotStart = parseTimeToMinutes(slotTime);
  if (blockedSlots) {
    for (let h = 0; h < durationHours; h++) {
      const t = minutesToTime(slotStart + h * 60);
      if (blockedSlots.has(`${dateStr}|${t}`)) return false;
    }
  }

  const slotEnd = slotStart + durationHours * 60;

  const today = (now || new Date()).toISOString().split("T")[0];
  if (dateStr === today) {
    const nowMinutes =
      (now || new Date()).getHours() * 60 +
      (now || new Date()).getMinutes();
    if (slotStart < nowMinutes) return false;
  }

  for (const b of bookings) {
    if (b.date !== dateStr) continue;
    const bookStart = parseTimeToMinutes(b.time);
    const bookEnd = bookStart + b.sessionHours * 60;
    if (slotStart < bookEnd && slotEnd > bookStart) return false;
  }
  return true;
}

/** Get available time slots for a date (1-hour intervals, HH:mm format) */
export function getAvailableSlots(
  dateStr: string,
  durationHours: number,
  bookings: BookedSlot[],
  now?: Date,
  blockedSlots?: Set<string>
): string[] {
  const slots: string[] = [];
  const start = BUSINESS_HOURS.start * 60;
  const end = (BUSINESS_HOURS.end - durationHours) * 60;

  for (let m = start; m <= end; m += 60) {
    const time = minutesToTime(m);
    if (isSlotAvailable(dateStr, time, durationHours, bookings, now, blockedSlots)) {
      slots.push(time);
    }
  }
  return slots;
}

/** Get all booked time ranges for a date (for UI display) */
export function getBookedRangesForDate(
  dateStr: string,
  bookings: BookedSlot[]
): Array<{ start: string; end: string }> {
  return bookings
    .filter((b) => b.date === dateStr)
    .map((b) => {
      const start = parseTimeToMinutes(b.time);
      const end = start + b.sessionHours * 60;
      return {
        start: minutesToTime(start),
        end: minutesToTime(end),
      };
    });
}
