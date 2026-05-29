import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: getMock,
    }),
  },
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

describe("ReportsPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    localStorage.clear();
    localStorage.setItem("token", "test-token");

    getMock.mockImplementation((path: string) => {
      switch (path) {
        case "/semesters":
          return Promise.resolve({
            data: [{ id: "semester-1", name: "الفصل الأول" }],
          });
        case "/reports/attendance/overview":
          return Promise.resolve({
            data: {
              overallSummary: {
                totalDays: 20,
                studentAverageAttendance: 88.2,
                teacherAverageAttendance: 91.4,
                totalStudentAbsences: 12,
                totalTeacherAbsences: 3,
              },
              studentAttendanceDetails: [],
              teacherAttendanceDetails: [],
            },
          });
        case "/reports/points/overview":
          return Promise.resolve({
            data: {
              overallSummary: {
                totalPoints: 500,
                quranPoints: 120,
                hadithPoints: 90,
                attendancePoints: 150,
                behaviorPoints: 140,
                totalCourses: 6,
              },
              studentPointsDetails: [],
              teacherPointsGiven: [],
            },
          });
        case "/reports/semesters/semester-1/overview":
          return Promise.resolve({
            data: {
              semesterId: "semester-1",
              semesterName: "الفصل الأول",
              startDate: "2026-01-01T00:00:00Z",
              endDate: "2026-06-01T00:00:00Z",
              statistics: {
                totalStudents: 45,
                totalTeachers: 8,
                totalClasses: 5,
                totalQuranPagesMemorized: 220,
                totalHadithsMemorized: 80,
                totalPointsGiven: 500,
                averageAttendancePercentage: 88.2,
              },
              classSummaries: [
                {
                  classId: "class-1",
                  className: "حلقة الفجر",
                  studentCount: 12,
                  averageAttendance: 91.1,
                  totalPoints: 130,
                },
              ],
              topStudents: [
                {
                  studentId: "student-1",
                  studentName: "أحمد محمد",
                  totalPoints: 97,
                  quranPagesMemorized: 30,
                  hadithsMemorized: 12,
                  attendancePercentage: 96.5,
                },
              ],
              topTeachers: [
                {
                  teacherId: "teacher-1",
                  teacherName: "خالد علي",
                  pointsGiven: 60,
                  studentsCount: 14,
                  attendancePercentage: 93.1,
                },
              ],
            },
          });
        default:
          return Promise.reject(new Error(`Unexpected path: ${path}`));
      }
    });
  });

  it("renders API report data", async () => {
    const { default: ReportsPageView } = await import("./ReportsPage");

    render(<ReportsPageView />);

    expect(await screen.findByText("الفصل الأول")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("حلقة الفجر")).toBeInTheDocument();
    expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
    expect(screen.getByText("خالد علي")).toBeInTheDocument();

    await waitFor(() => {
      expect(getMock).toHaveBeenCalledWith("/reports/semesters/semester-1/overview");
    });
  });
});