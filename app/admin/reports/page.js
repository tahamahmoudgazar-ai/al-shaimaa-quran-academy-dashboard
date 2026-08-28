import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function ReportsPage() {
  const supabase = getSupabase();

  const [
    studentsResult,
    teachersResult,
    coursesResult,
    paymentsResult,
    attendanceResult,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("teachers").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("amount"),
    supabase.from("attendance").select("status"),
  ]);

  const totalStudents = studentsResult.count || 0;
  const totalTeachers = teachersResult.count || 0;
  const totalCourses = coursesResult.count || 0;

  const totalPayments =
    paymentsResult.data?.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    ) || 0;

  const attendance = attendanceResult.data || [];

  const present = attendance.filter(
    (item) => item.status === "present"
  ).length;

  const absent = attendance.filter(
    (item) => item.status === "absent"
  ).length;

  const late = attendance.filter(
    (item) => item.status === "late"
  ).length;

  const excused = attendance.filter(
    (item) => item.status === "excused"
  ).length;

  const cards = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: "👨‍🎓",
    },
    {
      title: "Total Teachers",
      value: totalTeachers,
      icon: "👨‍🏫",
    },
    {
      title: "Total Courses",
      value: totalCourses,
      icon: "📚",
    },
    {
      title: "Total Payments",
      value: `$${totalPayments.toFixed(2)}`,
      icon: "💳",
    },
  ];

  const attendanceCards = [
    {
      title: "Present",
      value: present,
      className: "present",
    },
    {
      title: "Absent",
      value: absent,
      className: "absent",
    },
    {
      title: "Late",
      value: late,
      className: "late",
    },
    {
      title: "Excused",
      value: excused,
      className: "excused",
    },
  ];

  return (
    <div className="reports">

      <div className="pageHeader">
        <div>
          <h1>Reports</h1>
          <p>
            Academy performance, attendance and financial overview.
          </p>
        </div>
      </div>

      <div className="statsGrid">
        {cards.map((card) => (
          <div className="statCard" key={card.title}>
            <div className="statTop">
              <span>{card.title}</span>
              <div className="statIcon">{card.icon}</div>
            </div>

            <strong>{card.value}</strong>

            <small>Academy overview</small>
          </div>
        ))}
      </div>

      <div className="panel">

        <div className="panelHeader">
          <div>
            <h2>Attendance Summary</h2>
            <p>Current attendance records overview.</p>
          </div>

          <div className="attendanceIcon">
            ✓
          </div>
        </div>

        <div className="attendanceGrid">

          {attendanceCards.map((item) => (
            <div
              className={`attendanceCard ${item.className}`}
              key={item.title}
            >
              <span>{item.title}</span>
              <strong>{item.value}</strong>
            </div>
          ))}

        </div>

        <div className="totalRecords">
          Total attendance records:
          <strong>{attendance.length}</strong>
        </div>

      </div>

      <style>{`
        .reports {
          max-width: 1500px;
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

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }

        .statCard {
          background: #fff;
          border: 1px solid #d8eaf2;
          border-radius: 14px;
          padding: 19px;
          box-shadow: 0 2px 10px rgba(18, 59, 93, 0.05);
        }

        .statTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #6b8799;
          font-size: 12px;
          font-weight: 600;
        }

        .statIcon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #edf7fb;
          display: grid;
          place-items: center;
          font-size: 18px;
        }

        .statCard strong {
          display: block;
          margin-top: 13px;
          color: #123b5d;
          font-size: 28px;
        }

        .statCard small {
          display: block;
          margin-top: 6px;
          color: #6b8799;
          font-size: 11px;
        }

        .panel {
          background: #fff;
          border: 1px solid #d8eaf2;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 2px 10px rgba(18, 59, 93, 0.05);
        }

        .panelHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding-bottom: 17px;
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

        .attendanceIcon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #edf7fb;
          color: #1d6f9f;
          display: grid;
          place-items: center;
          font-size: 20px;
          font-weight: 800;
        }

        .attendanceGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 20px;
        }

        .attendanceCard {
          padding: 17px;
          border-radius: 12px;
          border: 1px solid #d8eaf2;
          background: #fafdff;
        }

        .attendanceCard span {
          display: block;
          color: #52758a;
          font-size: 12px;
          font-weight: 700;
        }

        .attendanceCard strong {
          display: block;
          margin-top: 9px;
          color: #123b5d;
          font-size: 27px;
        }

        .attendanceCard.present {
          background: #f0f9fc;
          border-color: #c9e8f3;
        }

        .attendanceCard.present strong {
          color: #16709c;
        }

        .attendanceCard.absent {
          background: #f8fbfd;
          border-color: #d8eaf2;
        }

        .attendanceCard.absent strong {
          color: #39718d;
        }

        .attendanceCard.late {
          background: #f8fbfd;
          border-color: #d8eaf2;
        }

        .attendanceCard.late strong {
          color: #39718d;
        }

        .attendanceCard.excused {
          background: #edf7fb;
          border-color: #c9e8f3;
        }

        .attendanceCard.excused strong {
          color: #1d6f9f;
        }

        .totalRecords {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e5f0f5;
          color: #6b8799;
          font-size: 13px;
        }

        .totalRecords strong {
          margin-left: 5px;
          color: #123b5d;
        }

        @media (max-width: 1100px) {
          .statsGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .attendanceGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .pageHeader h1 {
            font-size: 28px;
          }

          .statsGrid {
            grid-template-columns: 1fr;
          }

          .attendanceGrid {
            grid-template-columns: 1fr 1fr;
          }

          .panel {
            padding: 16px;
          }
        }
      `}</style>

    </div>
  );
}
