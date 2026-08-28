import { notFound } from "next/navigation";
import StudentsList from "../../../components/students/StudentsList";
import AddStudent from "../../../components/students/AddStudent";

const sections = {
  students: ["Students", "Manage students, profiles, enrollments and academic information."],
  teachers: ["Teachers", "Manage teachers, availability, assignments and students."],
  courses: ["Courses", "Create and manage Quran, Tajweed, Arabic and Islamic Studies courses."],
  schedule: ["Schedule", "Manage classes, teacher availability and student bookings."],
  attendance: ["Attendance", "Track attendance, absences and late arrivals."],
  payments: ["Payments", "Manage subscriptions, payments, balances and payment history."],
  reports: ["Reports", "Academy performance, attendance and financial reports."],
  settings: ["Settings", "System settings, academy information and permissions."]
};

function StudentsPage() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e3e9ef",
        borderRadius: 14,
        padding: 28
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 24
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Students</h1>
          <p style={{ color: "#718096", marginBottom: 0 }}>
            Manage students, profiles, enrollments and academic information.
          </p>
        </div>

        <AddStudent />
      </div>

      <StudentsList />
    </div>
  );
}

export default async function SectionPage({ params }) {
  const { section } = await params;

  if (!sections[section]) {
    notFound();
  }

  if (section === "settings") {
    const SettingsForm = (await import("../../../components/settings/SettingsForm")).default;

    return (
      <div style={{ background: "#fff", border: "1px solid #e3e9ef", borderRadius: 14, padding: 28 }}>
        <h1 style={{ marginTop: 0 }}>Settings</h1>
        <p style={{ color: "#718096" }}>Manage academy information and system settings.</p>
        <SettingsForm />
      </div>
    );
  }

  if (section === "students") {
    return <StudentsPage />;
  }

  const data = sections[section];

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e3e9ef",
        borderRadius: 14,
        padding: 28
      }}
    >
      <h1 style={{ marginTop: 0 }}>{data[0]}</h1>

      <p style={{ color: "#718096" }}>
        {data[1]}
      </p>

      <div
        style={{
          marginTop: 25,
          padding: 18,
          borderRadius: 10,
          background: "#f5f8fb",
          color: "#718096",
          fontSize: 13
        }}
      >
        This module is ready for the next implementation phase.
      </div>
    </div>
  );
}
