"use client";

import { useEffect, useState } from "react";

export default function SettingsForm() {
  const [form, setForm] = useState({
    academy_name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    timezone: "",
    currency: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          academy_name: data.academy_name || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          address: data.address || "",
          timezone: data.timezone || "",
          currency: data.currency || ""
        });

        setLoading(false);
      })
      .catch(() => {
        setMessage("Failed to load settings.");
        setLoading(false);
      });
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setForm({
        academy_name: data.academy_name || "",
        email: data.email || "",
        phone: data.phone || "",
        website: data.website || "",
        address: data.address || "",
        timezone: data.timezone || "",
        currency: data.currency || ""
      });

      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: "#718096" }}>Loading settings...</p>;
  }

  return (
    <div
      style={{
        marginTop: 25,
        display: "grid",
        gap: 18
      }}
    >
      {[
        ["academy_name", "Academy Name"],
        ["email", "Email"],
        ["phone", "Phone"],
        ["website", "Website"],
        ["address", "Address"],
        ["timezone", "Timezone"],
        ["currency", "Currency"]
      ].map(([name, label]) => (
        <div key={name}>
          <label
            style={{
              display: "block",
              marginBottom: 7,
              fontWeight: 600,
              color: "#374151"
            }}
          >
            {label}
          </label>

          <input
            name={name}
            value={form[name]}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 11,
              border: "1px solid #d5dce5",
              borderRadius: 8,
              boxSizing: "border-box",
              fontSize: 14
            }}
          />
        </div>
      ))}

      <div style={{ marginTop: 5 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "11px 22px",
            border: "none",
            borderRadius: 8,
            background: "#2563eb",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: message.includes("successfully")
              ? "#ecfdf5"
              : "#fef2f2",
            color: message.includes("successfully")
              ? "#047857"
              : "#b91c1c",
            fontSize: 14
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
