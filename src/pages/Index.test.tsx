import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const getMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: getMock,
    }),
  },
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
}));

import Index from "./Index";

describe("Index", () => {
  beforeEach(() => {
    getMock.mockReset();
    localStorage.clear();
    localStorage.setItem("token", "test-token");

    getMock.mockImplementation((path: string) => {
      switch (path) {
        case "/students/filtered":
          return Promise.resolve({ data: { totalCount: 42, items: [] } });
        case "/teachers/filtered":
          return Promise.resolve({ data: { totalCount: 7, items: [] } });
        case "/halaqas":
          return Promise.resolve({ data: [{ id: "1" }, { id: "2" }, { id: "3" }] });
        case "/reports/attendance/overview":
          return Promise.resolve({
            data: {
              overallSummary: {
                totalDays: 20,
                studentAverageAttendance: 87.5,
                teacherAverageAttendance: 91.2,
                totalStudentAbsences: 11,
                totalTeacherAbsences: 4,
              },
              studentAttendanceDetails: [
                {
                  studentId: "s1",
                  studentName: "أحمد",
                  presentDays: 19,
                  absentDays: 1,
                  attendancePercentage: 95,
                  absenceDates: ["2026-05-10T00:00:00Z"],
                },
                {
                  studentId: "s2",
                  studentName: "سارة",
                  presentDays: 17,
                  absentDays: 3,
                  attendancePercentage: 82.3,
                  absenceDates: ["2026-05-12T00:00:00Z"],
                },
              ],
              teacherAttendanceDetails: [],
            },
          });
        case "/reports/points/overview":
          return Promise.resolve({
            data: {
              overallSummary: {
                totalPoints: 100,
                quranPoints: 10,
                hadithPoints: 20,
                attendancePoints: 30,
                behaviorPoints: 40,
                totalCourses: 4,
              },
              studentPointsDetails: [
                {
                  studentId: "s1",
                  studentName: "أحمد",
                  totalPoints: 90,
                  quranPoints: 10,
                  hadithPoints: 20,
                  attendancePoints: 30,
                  behaviorPoints: 30,
                },
              ],
              teacherPointsGiven: [
                {
                  teacherId: "t1",
                  teacherName: "خالد",
                  totalPointsGiven: 55,
                  pointsByCategory: 22,
                  studentsCount: 10,
                },
              ],
            },
          });
        case "/Auth/me":
          return Promise.resolve({
            data: {
              name: "أحمد المسؤول",
              roleName: "مدير",
            },
          });
        default:
          return Promise.reject(new Error(`Unexpected path: ${path}`));
      }
    });
  });

  it("renders live dashboard data from the server", async () => {
    render(
      <MemoryRouter initialEntries={["/index"]}>
        <Index />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getMock).toHaveBeenCalledTimes(6);
    });

    expect(
      await screen.findByText(/مرحبًا أحمد المسؤول، هذه بيانات حية من الخادم/)
    ).toBeInTheDocument();
    expect(screen.getByText("أفضل حضور: أحمد")).toBeInTheDocument();
    expect(screen.getByText("أعلى طالب نقاطًا: أحمد")).toBeInTheDocument();
    expect(screen.getByText("أكثر المعلمين منحًا للنقاط: خالد")).toBeInTheDocument();
  });
});