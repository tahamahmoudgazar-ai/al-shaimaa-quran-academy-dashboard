"use client";

import { useState } from "react";

export default function AddStudent() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter the student's name.");
      return;
    }

    if (!email.trim()) {
      alert("Please enter the student's email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim(),
          country: country.trim(),
          parent_name: parentName.trim(),
          parent_phone: parentPhone.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add student.");
      }

      alert("Student added successfully.");

      setName("");
      setEmail("");
      setCountry("");
      setParentName("");
      setParentPhone("");
      setOpen(false);

      window.location.reload();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "#1f7a5a",
          color: "#fff",
          border: 0,
          borderRadius: 8,
          padding: "11px 18px",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        + Add Student
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 25,
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20
              }}
            >
              <h2 style={{ margin: 0 }}>Add Student</h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  fontSize: 24,
                  cursor: "pointer"
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Student Name</label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter student name"
                style={inputStyle}
              />

              <label>Student Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                style={inputStyle}
              />

              <label>Country</label>

              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter country"
                style={inputStyle}
              />

              <label>Parent Name</label>

              <input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Enter parent name"
                style={inputStyle}
              />

              <label>Parent Phone</label>

              <input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="Enter parent phone"
                style={inputStyle}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 20
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "10px 16px",
                    border: "1px solid #d9e1e8",
                    background: "#fff",
                    borderRadius: 8,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 18px",
                    border: 0,
                    background: "#1f7a5a",
                    color: "#fff",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Saving..." : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 11,
  marginTop: 6,
  marginBottom: 15,
  border: "1px solid #d9e1e8",
  borderRadius: 8,
  outline: "none"
};
