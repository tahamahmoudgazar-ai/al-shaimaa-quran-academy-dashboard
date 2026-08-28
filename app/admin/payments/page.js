"use client";

import { useEffect, useState } from "react";

const colors = {
  paid: {
    background: "#e3f4fb",
    color: "#16709c",
    border: "#c9e8f3",
  },
  pending: {
    background: "#edf7fb",
    color: "#39718d",
    border: "#d7ebf3",
  },
  refunded: {
    background: "#e8f1fb",
    color: "#2563a6",
    border: "#c9dff2",
  },
  failed: {
    background: "#fff1f2",
    color: "#b42318",
    border: "#fecdd3",
  },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paymentDate, setPaymentDate] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState("paid");
  const [note, setNote] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [paymentsRes, studentsRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/students"),
      ]);

      const paymentsData = await paymentsRes.json();
      const studentsData = await studentsRes.json();

      if (!paymentsRes.ok) {
        throw new Error(
          paymentsData.error || "Failed to load payments"
        );
      }

      setPayments(paymentsData.payments || []);

      setStudents(
        studentsData.students ||
        studentsData.data ||
        []
      );
    } catch (error) {
      setMessage(error.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setStudentId("");
    setAmount("");
    setCurrency("USD");
    setPaymentDate(
      new Date().toISOString().split("T")[0]
    );
    setMethod("");
    setReference("");
    setStatus("paid");
    setNote("");
  }

  async function savePayment(e) {
    e.preventDefault();

    if (!studentId) {
      setMessage("Please select a student.");
      return;
    }

    if (!amount) {
      setMessage("Please enter the payment amount.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        student_id: studentId,
        amount,
        currency,
        payment_date: paymentDate || undefined,
        method,
        reference,
        status,
        note,
      };

      if (editingId) {
        payload.id = editingId;
      }

      const res = await fetch("/api/payments", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to save payment."
        );
      }

      setMessage(
        editingId
          ? "Payment updated successfully."
          : "Payment added successfully."
      );

      resetForm();
      await loadData();
    } catch (error) {
      setMessage(
        error.message || "Failed to save payment."
      );
    } finally {
      setSaving(false);
    }
  }

  function editPayment(item) {
    setEditingId(item.id);
    setStudentId(item.student_id || "");
    setAmount(item.amount ?? "");
    setCurrency(item.currency || "USD");
    setPaymentDate(item.payment_date || "");
    setMethod(item.method || "");
    setReference(item.reference || "");
    setStatus(item.status || "paid");
    setNote(item.note || "");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deletePayment(id) {
    if (!confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      const res = await fetch("/api/payments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to delete payment."
        );
      }

      setMessage("Payment deleted successfully.");
      await loadData();
    } catch (error) {
      setMessage(
        error.message || "Failed to delete payment."
      );
    }
  }

  return (
    <div style={page}>
      <div style={heading}>
        <div>
          <h1 style={title}>Payments</h1>

          <p style={subtitle}>
            Manage student payments and payment history.
          </p>
        </div>
      </div>

      {message && (
        <div style={messageBox}>
          {message}
        </div>
      )}

      <form onSubmit={savePayment} style={formCard}>
        <div style={sectionTitle}>
          {editingId ? "Edit Payment" : "Add Payment"}
        </div>

        <div style={formGrid}>
          <Field label="Student">
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select student</option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name ||
                    student.name ||
                    student.profile?.full_name ||
                   student.profiles?.full_name ||
                    "Student"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Amount">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={inputStyle}
            />
          </Field>

          <Field label="Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={inputStyle}
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
              <option value="CAD">CAD</option>
            </select>
          </Field>

          <Field label="Payment Date">
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Method">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select method</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="PayPal">PayPal</option>
              <option value="Stripe">Stripe</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </Field>

          <Field label="Reference">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Payment reference"
              style={inputStyle}
            />
          </Field>

          <Field label="Note">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={buttonRow}>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...primaryButton,
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Payment"
              : "Add Payment"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setMessage("");
              }}
              style={cancelButton}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={recordsCard}>
        <div style={recordsHeader}>
          <div>
            <h2 style={recordsTitle}>Payment History</h2>
            <p style={recordsSubtitle}>
              All recorded student payments.
            </p>
          </div>

          <div style={countBadge}>
            {payments.length} Records
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={emptyState}>
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div style={emptyState}>
              No payment records found.
            </div>
          ) : (
            <table style={table}>
              <thead>
                <tr>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Method</th>
                  <th style={thStyle}>Reference</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((item) => {
                  const statusStyle =
                    colors[item.status] || colors.pending;

                  return (
                    <tr key={item.id || item.reference}>
                      <td style={tdStyle}>
                        <strong style={{ color: "#123b5d" }}>
                          {item.student_name}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {item.amount} {item.currency}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {item.payment_date || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.method || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.reference || "-"}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 10px",
                            borderRadius: 20,
                            background: statusStyle.background,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <button
                          onClick={() => editPayment(item)}
                          style={editButton}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deletePayment(item.id)}
                          style={deleteButton}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const page = {
  background: "#eef7fb",
  minHeight: "calc(100vh - 72px)",
  padding: 28,
  boxSizing: "border-box",
};

const heading = {
  marginBottom: 22,
};

const title = {
  margin: 0,
  color: "#123b5d",
  fontSize: 32,
  fontWeight: 700,
};

const subtitle = {
  margin: "7px 0 0",
  color: "#6b8799",
  fontSize: 14,
};

const sectionTitle = {
  color: "#123b5d",
  fontSize: 19,
  fontWeight: 700,
  marginBottom: 18,
};

const formCard = {
  background: "#ffffff",
  border: "1px solid #d8eaf2",
  borderRadius: 14,
  padding: 22,
  boxShadow: "0 2px 10px rgba(18,59,93,.05)",
  marginBottom: 24,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
};

const labelStyle = {
  display: "block",
  color: "#52758a",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #c9e1eb",
  borderRadius: 8,
  background: "#ffffff",
  color: "#29475d",
  fontSize: 14,
  outline: "none",
};

const buttonRow = {
  display: "flex",
  gap: 10,
  marginTop: 20,
  flexWrap: "wrap",
};

const primaryButton = {
  padding: "10px 18px",
  border: 0,
  borderRadius: 8,
  background: "#1d6f9f",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const cancelButton = {
  padding: "10px 18px",
  border: "1px solid #c9e1eb",
  borderRadius: 8,
  background: "#ffffff",
  color: "#52758a",
  fontWeight: 700,
  cursor: "pointer",
};

const messageBox = {
  marginBottom: 20,
  padding: 12,
  borderRadius: 8,
  background: "#e3f4fb",
  color: "#16709c",
  border: "1px solid #c9e8f3",
  fontWeight: 600,
};

const recordsCard = {
  background: "#ffffff",
  border: "1px solid #d8eaf2",
  borderRadius: 14,
  padding: 22,
  boxShadow: "0 2px 10px rgba(18,59,93,.05)",
};

const recordsHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 15,
  marginBottom: 18,
  flexWrap: "wrap",
};

const recordsTitle = {
  margin: 0,
  color: "#123b5d",
  fontSize: 19,
};

const recordsSubtitle = {
  margin: "5px 0 0",
  color: "#6b8799",
  fontSize: 12,
};

const countBadge = {
  padding: "6px 11px",
  borderRadius: 20,
  background: "#edf7fb",
  color: "#1d6f9f",
  border: "1px solid #d8eaf2",
  fontSize: 12,
  fontWeight: 700,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 850,
};

const thStyle = {
  textAlign: "left",
  padding: "12px 10px",
  background: "#edf7fb",
  color: "#52758a",
  borderBottom: "1px solid #d8eaf2",
  fontSize: 12,
  fontWeight: 700,
};

const tdStyle = {
  padding: "13px 10px",
  borderBottom: "1px solid #edf3f6",
  color: "#29475d",
  fontSize: 13,
};

const editButton = {
  marginRight: 8,
  padding: "6px 11px",
  border: "1px solid #c9e1eb",
  borderRadius: 6,
  background: "#edf7fb",
  color: "#1d6f9f",
  cursor: "pointer",
  fontWeight: 700,
};

const deleteButton = {
  padding: "6px 11px",
  border: "1px solid #fecdd3",
  borderRadius: 6,
  background: "#fff1f2",
  color: "#b42318",
  cursor: "pointer",
  fontWeight: 700,
};

const emptyState = {
  padding: 35,
  textAlign: "center",
  color: "#6b8799",
  background: "#fafdff",
  borderRadius: 10,
};
