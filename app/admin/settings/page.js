"use client";

import { useEffect, useState } from "react";

const emptySettings = {
  academy_name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  timezone: "UTC",
  currency: "USD",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/settings", {
        cache: "no-store",
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid response from settings API.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to load settings.");
      }

      setSettings({
        academy_name: data.academy_name || "",
        email: data.email || "",
        phone: data.phone || "",
        website: data.website || "",
        address: data.address || "",
        timezone: data.timezone || "UTC",
        currency: data.currency || "USD",
      });
    } catch (err) {
      setError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  function change(e) {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setError("");
  }

  async function saveSettings(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid response from settings API.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setSettings({
        academy_name: data.academy_name || "",
        email: data.email || "",
        phone: data.phone || "",
        website: data.website || "",
        address: data.address || "",
        timezone: data.timezone || "UTC",
        currency: data.currency || "USD",
      });

      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings">
        <div className="loading">
          Loading settings...
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="settings">

      <div className="pageHeader">
        <div>
          <h1>Settings</h1>
          <p>
            Manage your academy information and system preferences.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="alert success">
          {message}
        </div>
      )}

      <form onSubmit={saveSettings}>

        <div className="panel">

          <div className="panelHeader">
            <div>
              <h2>Academy Information</h2>
              <p>
                Basic information about Al Shaimaa Quran Academy.
              </p>
            </div>

            <div className="panelIcon">
              🏫
            </div>
          </div>

          <div className="formGrid">

            <Field
              name="academy_name"
              label="Academy Name"
              value={settings.academy_name}
              onChange={change}
            />

            <Field
              name="email"
              label="Email"
              type="email"
              value={settings.email}
              onChange={change}
            />

            <Field
              name="phone"
              label="Phone"
              value={settings.phone}
              onChange={change}
            />

            <Field
              name="website"
              label="Website"
              value={settings.website}
              onChange={change}
            />

          </div>

          <div className="field full">
            <label>Address</label>

            <textarea
              name="address"
              value={settings.address}
              onChange={change}
              rows={3}
              placeholder="Academy address"
            />
          </div>

        </div>

        <div className="panel preferences">

          <div className="panelHeader">
            <div>
              <h2>System Preferences</h2>
              <p>
                Configure timezone and default currency.
              </p>
            </div>

            <div className="panelIcon">
              ⚙
            </div>
          </div>

          <div className="formGrid">

            <div className="field">
              <label>Timezone</label>

              <select
                name="timezone"
                value={settings.timezone}
                onChange={change}
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Cairo">
                  Africa/Cairo
                </option>
                <option value="America/New_York">
                  America/New_York
                </option>
                <option value="Europe/London">
                  Europe/London
                </option>
              </select>
            </div>

            <div className="field">
              <label>Currency</label>

              <select
                name="currency"
                value={settings.currency}
                onChange={change}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="EUR">EUR - Euro</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="EGP">EGP - Egyptian Pound</option>
              </select>
            </div>

          </div>

        </div>

        <div className="actions">
          <button
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

      </form>

      <style>{styles}</style>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div className="field">
      <label>{label}</label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

const styles = `
  .settings {
    max-width: 1100px;
    margin: 0 auto;
  }

  .pageHeader {
    margin-bottom: 26px;
  }

  .pageHeader h1 {
    margin: 0;
    color: #123b5d;
    font-size: 32px;
    font-weight: 700;
  }

  .pageHeader p {
    margin: 8px 0 0;
    color: #6b8799;
    font-size: 14px;
  }

  .panel {
    background: #fff;
    border: 1px solid #d8eaf2;
    border-radius: 14px;
    padding: 22px;
    box-shadow: 0 2px 10px rgba(18, 59, 93, 0.05);
    margin-bottom: 20px;
  }

  .panelHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding-bottom: 18px;
    margin-bottom: 20px;
    border-bottom: 1px solid #e5f0f5;
  }

  .panelHeader h2 {
    margin: 0;
    color: #123b5d;
    font-size: 19px;
  }

  .panelHeader p {
    margin: 6px 0 0;
    color: #6b8799;
    font-size: 13px;
  }

  .panelIcon {
    width: 42px;
    height: 42px;
    border-radius: 11px;
    background: #edf7fb;
    display: grid;
    place-items: center;
    font-size: 19px;
  }

  .formGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 17px;
  }

  .field {
    min-width: 0;
  }

  .field.full {
    margin-top: 17px;
  }

  .field label {
    display: block;
    margin-bottom: 7px;
    color: #29475d;
    font-size: 13px;
    font-weight: 700;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 12px;
    border: 1px solid #cbdfe8;
    border-radius: 9px;
    background: #fafdff;
    color: #29475d;
    font-size: 14px;
    outline: none;
    font-family: inherit;
  }

  .field textarea {
    resize: vertical;
  }

  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: #7ebbd1;
    box-shadow: 0 0 0 3px rgba(126, 187, 209, 0.14);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .actions button {
    padding: 11px 22px;
    border: 1px solid #1d6f9f;
    border-radius: 9px;
    background: #1d6f9f;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .actions button:hover {
    background: #155b84;
  }

  .actions button:disabled {
    background: #94a3b8;
    border-color: #94a3b8;
    cursor: not-allowed;
  }

  .alert {
    padding: 12px 14px;
    border-radius: 9px;
    margin-bottom: 18px;
    font-size: 13px;
    font-weight: 600;
  }

  .alert.success {
    background: #edf7fb;
    color: #176b8f;
    border: 1px solid #c9e8f3;
  }

  .alert.error {
    background: #fff5f5;
    color: #b42318;
    border: 1px solid #fecaca;
  }

  .loading {
    padding: 40px;
    text-align: center;
    color: #6b8799;
    background: #fff;
    border: 1px solid #d8eaf2;
    border-radius: 14px;
  }

  @media (max-width: 700px) {
    .pageHeader h1 {
      font-size: 28px;
    }

    .formGrid {
      grid-template-columns: 1fr;
    }

    .panel {
      padding: 17px;
    }

    .actions {
      justify-content: stretch;
    }

    .actions button {
      width: 100%;
    }
  }
`;
