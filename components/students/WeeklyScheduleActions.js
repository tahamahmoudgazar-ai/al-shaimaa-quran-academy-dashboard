"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WeeklyScheduleActions({
  id,
  dayOfWeek,
  startTime,
  endTime
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function editClass() {
    const day = window.prompt(
      "Day of week (0=Sunday, 1=Monday, ... 6=Saturday):",
      String(dayOfWeek)
    );

    if (day === null) return;

    const start = window.prompt(
      "Start time (HH:MM):",
      String(startTime || "").slice(0, 5)
    );

    if (start === null) return;

    const end = window.prompt(
      "End time (HH:MM):",
      String(endTime || "").slice(0, 5)
    );

    if (end === null) return;

    setSaving(true);

    try {
      const response = await fetch("/api/weekly-schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          day_of_week: Number(day),
          start_time: start,
          end_time: end
        })
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data.error || "Failed to update weekly class.");
        return;
      }

      router.refresh();
    } catch (error) {
      window.alert(
        error?.message || "Failed to update weekly class."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteClass() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this weekly class?"
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch(
        "/api/weekly-schedule?id=" + encodeURIComponent(id),
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(data.error || "Failed to delete weekly class.");
        return;
      }

      router.refresh();
    } catch (error) {
      window.alert(
        error?.message || "Failed to delete weekly class."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
      }}
    >
      <button
        type="button"
        onClick={editClass}
        disabled={saving}
        style={{
          padding: "7px 11px",
          border: "1px solid #2563eb",
          borderRadius: 7,
          background: "#eff6ff",
          color: "#1d4ed8",
          fontWeight: 700,
          cursor: saving ? "default" : "pointer"
        }}
      >
        {saving ? "..." : "Edit"}
      </button>

      <button
        type="button"
        onClick={deleteClass}
        disabled={saving}
        style={{
          padding: "7px 11px",
          border: "1px solid #dc2626",
          borderRadius: 7,
          background: "#fef2f2",
          color: "#b91c1c",
          fontWeight: 700,
          cursor: saving ? "default" : "pointer"
        }}
      >
        Delete
      </button>
    </div>
  );
}
