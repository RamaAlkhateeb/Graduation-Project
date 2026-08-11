import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const getMock = vi.fn();
const postMock = vi.fn();
const patchMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: getMock,
      post: postMock,
      patch: patchMock,
      delete: deleteMock,
    }),
    isAxiosError: () => false,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    disabled,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <select
      disabled={disabled}
      value={value ?? ""}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <option value="">{placeholder}</option>,
}));

import StudentMemorizationPage from "./StudentMemorizationPage";

const statuses = [
  { id: 1, name: "متقن", color: "#28a745", sortOrder: 1 },
  { id: 2, name: "قيد المراجعة", color: "#dc3545", sortOrder: 2 },
];

const student = {
  id: "student-1",
  name: "أحمد",
  fatherName: "محمد",
  lastName: "الخطيب",
  parentPhoneNumber: "0999999999",
  schoolName: "مدرسة النور",
  parentWhatsAppPhoneNumber: "0999999998",
  dateOfBirth: "2014-01-01",
  academicStageId: "stage-1",
  userName: "ahmad",
  email: "ahmad@example.com",
};

const halaqas = [
  {
    halaqaId: "halaqa-1",
    halaqaName: "حلقة الفجر",
    isActive: true,
    courseId: "course-1",
    courseName: "الكورس الأول",
    semesterId: "semester-1",
    semesterName: "الفصل الأول",
    enrollmentId: "enrollment-1",
  },
];

const quranPages = [
  {
    id: "rec-q1",
    pageNumber: 5,
    studentId: "student-1",
    teacherId: null,
    classId: "halaqa-1",
    memorizedAt: "2026-08-01T00:00:00Z",
    statusId: 2,
    statusName: "قيد المراجعة",
    notes: "يراجع الآيات",
  },
];

const hadithRecords = [
  {
    id: "rec-h1",
    hadithId: "hadith-1",
    studentId: "student-1",
    teacherId: null,
    classId: "halaqa-1",
    memorizedAt: "2026-08-02T00:00:00Z",
    statusId: 1,
    statusName: "متقن",
    notes: null,
    hadith: {
      id: "hadith-1",
      text: "إنما الأعمال بالنيات",
      bookId: "book-1",
      bookName: "صحيح البخاري",
      chapter: "النية",
    },
  },
];

const hadithLookup = [
  { id: "hadith-1", text: "إنما الأعمال بالنيات", bookId: "book-1", book: { id: "book-1", name: "صحيح البخاري" }, chapter: "النية" },
  { id: "hadith-2", text: "من حسن إسلام المرء تركه ما لا يعنيه", bookId: "book-1", book: { id: "book-1", name: "صحيح البخاري" }, chapter: null },
];

const renderMemorizationPage = (initialEntries = ["/students/student-1/memorization"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/students/:studentId/memorization" element={<StudentMemorizationPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("StudentMemorizationPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    deleteMock.mockReset();
    localStorage.clear();
    localStorage.setItem("token", "test-token");

    getMock.mockImplementation((path: string) => {
      switch (path) {
        case "/students/student-1":
          return Promise.resolve({ data: student });
        case "/statuses":
          return Promise.resolve({ data: statuses });
        case "/students/student-1/halaqas":
          return Promise.resolve({ data: halaqas });
        case "/Hadiths":
          return Promise.resolve({ data: hadithLookup });
        case "/memorize-managment/students/student-1/quran-pages":
          return Promise.resolve({ data: quranPages });
        case "/memorize-managment/students/student-1/hadiths":
          return Promise.resolve({ data: hadithRecords });
        default:
          return Promise.reject(new Error(`Unexpected path: ${path}`));
      }
    });

    postMock.mockResolvedValue({ data: {} });
    patchMock.mockResolvedValue({});
    deleteMock.mockResolvedValue({});
  });

  it("loads the student and shows quran pages with colored status names", async () => {
    renderMemorizationPage();

    expect(await screen.findByText("حفظ الطالب: أحمد")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("قيد المراجعة")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/statuses");
    expect(getMock).toHaveBeenCalledWith("/memorize-managment/students/student-1/quran-pages", {
      params: undefined,
    });
  });

  it("adds a quran page with a statusId and halaqaId", async () => {
    renderMemorizationPage();

    fireEvent.click(await screen.findByRole("button", { name: "إضافة صفحة قرآن" }));
    const dialog = await screen.findByRole("dialog", { name: "إضافة صفحة قرآن" });

    // الحلقة محددة مسبقًا لأن الطالب مسجل في حلقة واحدة فقط
    const comboboxes = within(dialog).getAllByRole("combobox");
    expect(comboboxes[0]).toHaveValue("halaqa-1");

    fireEvent.change(within(dialog).getByLabelText("رقم الصفحة (1 - 604)"), {
      target: { value: "6" },
    });
    fireEvent.change(within(dialog).getByLabelText("ملاحظات"), {
      target: { value: "حفظ جيد" },
    });
    fireEvent.change(comboboxes[1], { target: { value: "1" } });

    fireEvent.click(within(dialog).getByRole("button", { name: "إضافة" }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith(
        "/memorize-managment/halaqas/halaqa-1/students/student-1/quran-pages",
        { pageNumber: 6, statusId: 1, notes: "حفظ جيد" }
      );
    });
  });

  it("updates the status of a record through PATCH with statusId and notes", async () => {
    renderMemorizationPage();

    fireEvent.click(await screen.findByRole("button", { name: "تغيير الحالة" }));
    const dialog = await screen.findByRole("dialog", { name: "تغيير حالة الحفظ" });

    const statusSelect = within(dialog).getByRole("combobox");
    expect(statusSelect).toHaveValue("2");
    fireEvent.change(statusSelect, { target: { value: "1" } });

    fireEvent.click(within(dialog).getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith(
        "/memorize-managment/records/rec-q1/status",
        { statusId: 1, notes: "يراجع الآيات" },
        { params: { recordType: "quran-page" } }
      );
    });
  });

  it("deletes a record with its recordType", async () => {
    renderMemorizationPage();

    fireEvent.click((await screen.findAllByRole("button", { name: "حذف" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "تأكيد الحذف" });

    fireEvent.click(within(dialog).getByRole("button", { name: "حذف" }));

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith("/memorize-managment/records/rec-q1", {
        params: { recordType: "quran-page" },
      });
    });
  });

  it("shows hadith records with their status when switching tabs", async () => {
    renderMemorizationPage();

    await screen.findByText("حفظ الطالب: أحمد");

    // Radix Tabs تختار التبويب عند mousedown وليس click
    fireEvent.mouseDown(screen.getByRole("tab", { name: "الأحاديث" }));

    expect(await screen.findByText("إنما الأعمال بالنيات")).toBeInTheDocument();
    expect(screen.getByText("متقن")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/memorize-managment/students/student-1/hadiths", {
      params: undefined,
    });
  });

  it("filters records by the halaqaId passed in the URL", async () => {
    renderMemorizationPage(["/students/student-1/memorization?halaqaId=halaqa-1&halaqaName=%D8%AD%D9%84%D9%82%D8%A9"]);

    await screen.findByText("حفظ الطالب: أحمد");

    await waitFor(() => {
      expect(getMock).toHaveBeenCalledWith("/memorize-managment/students/student-1/quran-pages", {
        params: { halaqaId: "halaqa-1" },
      });
      expect(getMock).toHaveBeenCalledWith("/memorize-managment/students/student-1/hadiths", {
        params: { halaqaId: "halaqa-1" },
      });
    });
  });
});
