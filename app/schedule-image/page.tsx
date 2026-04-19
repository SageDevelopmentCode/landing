import { Merriweather, Poppins } from "next/font/google";

const merriweather = Merriweather({
  weight: ["700", "900"],
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["400", "600"],
  subsets: ["latin"],
});

const schoolYearRows = [
  { time: "Morning", block: "Core Subjects — English, Reading, Writing & Language Arts" },
  { time: "Mid-Morning", block: "Outdoor Free Time" },
  { time: "Afternoon", block: "Enrichment Subjects" },
];

const summerRows = [
  { time: "8:30–9:00 AM", block: "Check-In & Free Play" },
  { time: "9:00–9:15 AM", block: "Good Citizenship Meeting" },
  { time: "9:15–9:45 AM", block: "Academic Blocks (ELA, Math)" },
  { time: "9:45–10:15 AM", block: "Morning Snack" },
  { time: "10:15–11:15 AM", block: "Daily Themed Activity + Art" },
  { time: "11:15–11:30 AM", block: "Music" },
  { time: "11:30 AM–12:15 PM", block: "Lunch" },
  { time: "12:15–1:15 PM", block: "Water Play" },
  { time: "1:15–2:30 PM", block: "Journaling, Homesteading" },
  { time: "2:30–3:30 PM", block: "Outdoor Exploration & Dismissal" },
];

function ScheduleTable({
  title,
  rows,
}: {
  title: string;
  rows: { time: string; block: string }[];
}) {
  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <h2
        className={merriweather.className}
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: "#f29a8f",
          marginBottom: 12,
          textAlign: "center",
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f29a8f" }}>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "left",
                color: "#fff",
                fontWeight: 600,
                width: "38%",
              }}
            >
              Time
            </th>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "left",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Block
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                backgroundColor: i % 2 === 0 ? "#fff" : "#FFF9F5",
                borderBottom: "1px solid #f3e8e3",
              }}
            >
              <td
                style={{
                  padding: "9px 14px",
                  fontWeight: 600,
                  color: "#5a3a2e",
                  whiteSpace: "nowrap",
                }}
              >
                {row.time}
              </td>
              <td style={{ padding: "9px 14px", color: "#4a3728" }}>
                {row.block}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ScheduleImagePage() {
  return (
    <div
      className={poppins.className}
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
      }}
    >
      <h1
        className={merriweather.className}
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: "#3d2b1f",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Sage Field Private School
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#a07060",
          marginBottom: 40,
          textAlign: "center",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Daily Schedules
      </p>

      <div
        style={{
          display: "flex",
          gap: 40,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: 900,
        }}
      >
        <ScheduleTable title="School Year Daily Schedule" rows={schoolYearRows} />
        <ScheduleTable title="Summer 2026 Daily Schedule" rows={summerRows} />
      </div>
    </div>
  );
}
