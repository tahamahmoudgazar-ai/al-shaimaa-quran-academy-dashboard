"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProgressEditor({ studentId, progress }) {
  const router = useRouter();
  const [currentSurah, setCurrentSurah] = useState(progress?.current_surah || "");
  const [lastMemorized, setLastMemorized] = useState(progress?.last_memorized || "");
  const [lastRevision, setLastRevision] = useState(progress?.last_revision || "");
  const [progressPercent, setProgressPercent] = useState(progress?.progress_percent ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveProgress() {
    setSaving(true);
    setMessage("Saving...");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId,
          currentSurah,
          lastMemorized,
          lastRevision,
          progressPercent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save progress");
      }

      setMessage("Progress saved successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error.message || "Failed to save progress");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      marginTop: 18,
      padding: 20,
      border: "1px solid #e3e9ef",
      borderRadius: 12,
      background: "#fff"
    }}>
      <h2>Edit Quran Progress</h2>

      <div style={{ display: "grid", gap: 16 }}>

        <label>
          Current Surah
          <input
            value={currentSurah}
            onChange={(e) => setCurrentSurah(e.target.value)}
            style={{ width: "100%", padding: 12, marginTop: 6, boxSizing: "border-box" }}
          />
        </label>

        <label>
          Last Memorized
          <input
            value={lastMemorized}
            onChange={(e) => setLastMemorized(e.target.value)}
            style={{ width: "100%", padding: 12, marginTop: 6, boxSizing: "border-box" }}
          />
        </label>

        <label>
          Last Revision
          <input
            value={lastRevision}
            onChange={(e) => setLastRevision(e.target.value)}
            style={{ width: "100%", padding: 12, marginTop: 6, boxSizing: "border-box" }}
          />
        </label>

        <label>
          Progress %
          <input
            type="number"
            min="0"
            max="100"
            value={progressPercent}
            onChange={(e) => setProgressPercent(e.target.value)}
            style={{ width: "100%", padding: 12, marginTop: 6, boxSizing: "border-box" }}
          />
        </label>

        <button
          type="button"
          onClick={saveProgress}
          disabled={saving}
          style={{
            background: saving ? "#8ab9a8" : "#1f7a5a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: 13,
            fontWeight: 600,
            fontSize: 16
          }}
        >
          {saving ? "Saving..." : "Save Progress"}
        </button>

        {message && (
          <div style={{
            padding: 10,
            borderRadius: 8,
            background: "#f3f7f5",
            color: "#1f7a5a",
            fontWeight: 600
          }}>
            {message}
          </div>
        )}

      </div>
    </div>
  );
}
