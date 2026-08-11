import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as XLSX from "xlsx";

const writeFileMock = vi.hoisted(() => vi.fn());
const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("xlsx", async (importOriginal) => {
  const actual = await importOriginal<typeof import("xlsx")>();

  return {
    ...actual,
    writeFile: writeFileMock,
  };
});

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: getMock,
      post: postMock,
      put: putMock,
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

vi.mock("@/components/TableRowContextMenu", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/pagination", () => ({
  default: () => null,
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

import StudentsPage from "./StudentsPage";

const academicStage = {
  id: "stage-1",
  grade: "FirstGrade",
  displayName: "الصف الأول",
};

const memorizedParts = [
  { id: "part-1", memorizedQuranPart: "Part1", displayName: "الجزء الأول" },
  { id: "part-2", memorizedQuranPart: "Part2", displayName: "الجزء الثاني" },
];

const student = {
  id: "student-1",
  name: "أحمد",
  fatherName: "محمد",
  lastName: "الخطيب",
  fatherWork: "مدرس",
  parentPhoneNumber: "0999999999",
  schoolName: "مدرسة النور",
  parentWhatsAppPhoneNumber: "0999999998",
  dateOfBirth: "2014-01-01",
  landlineNumber: null,
  additionalInformations: null,
  academicStageId: "stage-1",
  academicStage,
  memorizedQuranParts: [memorizedParts[0]],
  userName: "ahmad",
  email: "ahmad@example.com",
};

const renderStudentsPage = () =>
  render(
    <MemoryRouter initialEntries={["/students"]}>
      <StudentsPage />
    </MemoryRouter>
  );

describe("StudentsPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    writeFileMock.mockReset();
    localStorage.clear();
    localStorage.setItem("token", "test-token");

    getMock.mockImplementation((path: string) => {
      switch (path) {
        case "/students":
          return Promise.resolve({ data: { items: [student], totalCount: 1, totalPages: 1 } });
        case "/academic-stages":
          return Promise.resolve({ data: [academicStage] });
        case "/memorized-quran-parts":
          return Promise.resolve({ data: memorizedParts });
        case "/Semesters":
          return Promise.resolve({ data: [] });
        case "/students/student-1":
          return Promise.resolve({ data: student });
        default:
          return Promise.reject(new Error(`Unexpected path: ${path}`));
      }
    });

    postMock.mockResolvedValue({ data: student });
    putMock.mockResolvedValue({ data: student });
  });

  it("loads the list with academic stages", async () => {
    renderStudentsPage();

    expect(await screen.findByText("أحمد")).toBeInTheDocument();
    expect(screen.getByText("الصف الأول")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/academic-stages");
    expect(getMock).toHaveBeenCalledWith("/students", {
      params: expect.objectContaining({ include: "academicStage" }),
    });
  });

  it("submits the expanded create payload", async () => {
    renderStudentsPage();

    fireEvent.click(await screen.findByRole("button", { name: /إضافة طالب/ }));
    const dialog = screen.getByRole("dialog", { name: "إضافة طالب جديد" });

    fireEvent.change(within(dialog).getByLabelText(/^الاسم/), { target: { value: "سارة" } });
    fireEvent.change(within(dialog).getByLabelText(/^اسم الأب/), { target: { value: "علي" } });
    fireEvent.change(within(dialog).getByLabelText(/^الكنية/), { target: { value: "العمر" } });
    fireEvent.change(within(dialog).getByLabelText(/^عمل الأب/), { target: { value: "مهندس" } });
    fireEvent.change(within(dialog).getByLabelText(/^هاتف ولي الأمر/), { target: { value: "0988888888" } });
    fireEvent.change(within(dialog).getByLabelText(/^اسم المدرسة/), { target: { value: "مدرسة السلام" } });
    fireEvent.change(within(dialog).getByLabelText(/^واتساب ولي الأمر/), { target: { value: "0988888888" } });
    fireEvent.change(within(dialog).getByLabelText(/^تاريخ الميلاد/), { target: { value: "2015-02-02" } });
    fireEvent.change(within(dialog).getByLabelText(/^الهاتف الأرضي/), { target: { value: "0112222222" } });
    fireEvent.change(within(dialog).getByLabelText(/^البريد الإلكتروني/), { target: { value: "sara@example.com" } });
    fireEvent.change(within(dialog).getByLabelText(/^اسم المستخدم/), { target: { value: "sara" } });
    fireEvent.change(within(dialog).getByLabelText(/^كلمة المرور/), { target: { value: "secret" } });
    fireEvent.change(within(dialog).getAllByRole("combobox").at(-1)!, {
      target: { value: "stage-1" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "إضافة" }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith("/students", {
        name: "سارة",
        fatherName: "علي",
        lastName: "العمر",
        fatherWork: "مهندس",
        parentPhoneNumber: "0988888888",
        schoolName: "مدرسة السلام",
        parentWhatsAppPhoneNumber: "0988888888",
        dateOfBirth: "2015-02-02T00:00:00.000Z",
        landlineNumber: "0112222222",
        additionalInformations: null,
        userName: "sara",
        password: "secret",
        academicStageId: "stage-1",
        email: "sara@example.com",
      });
    });
  });

  it("imports Excel students with the same normalized create payload", async () => {
    const { container } = renderStudentsPage();

    await screen.findByText("أحمد");

    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        "name",
        "fatherName",
        "lastName",
        "fatherWork",
        "parentPhoneNumber",
        "schoolName",
        "parentWhatsAppPhoneNumber",
        "dateOfBirth",
        "landlineNumber",
        "academicStage",
        "userName",
        "password",
        "email",
      ],
      [
        "سارة",
        "علي",
        "العمر",
        "مهندس",
        "0988888888",
        "مدرسة السلام",
        "0988888888",
        "2/2/15",
        "",
        "الصف الأول",
        "sara",
        "secret",
        "sara@example.com",
      ],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "StudentsTemplate");
    const workbookData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new File([workbookData], "students.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(file, "arrayBuffer", {
      value: () => Promise.resolve(workbookData),
    });

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeInTheDocument();
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith("/students", {
        name: "سارة",
        fatherName: "علي",
        lastName: "العمر",
        fatherWork: "مهندس",
        parentPhoneNumber: "0988888888",
        schoolName: "مدرسة السلام",
        parentWhatsAppPhoneNumber: "0988888888",
        dateOfBirth: "2015-02-02T00:00:00.000Z",
        landlineNumber: null,
        additionalInformations: null,
        userName: "sara",
        password: "secret",
        academicStageId: "stage-1",
        email: "sara@example.com",
      });
    });
  });

  it("downloads an Excel error report with highlighted invalid cells", async () => {
    const { container } = renderStudentsPage();

    await screen.findByText("أحمد");

    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        "name",
        "fatherName",
        "lastName",
        "fatherWork",
        "parentPhoneNumber",
        "schoolName",
        "parentWhatsAppPhoneNumber",
        "dateOfBirth",
        "landlineNumber",
        "academicStage",
        "userName",
        "password",
        "email",
      ],
      [
        "",
        "علي",
        "العمر",
        "مهندس",
        "0988888888",
        "مدرسة السلام",
        "0988888888",
        "تاريخ غير صالح",
        "",
        "الصف الأول",
        "sara",
        "secret",
        "sara@example.com",
      ],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "StudentsTemplate");
    const workbookData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new File([workbookData], "students.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(file, "arrayBuffer", {
      value: () => Promise.resolve(workbookData),
    });

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => {
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.any(Object),
        "students-import-errors.xlsx",
        { cellStyles: true }
      );
    });

    const reportWorkbook = writeFileMock.mock.calls[0][0] as XLSX.WorkBook;
    const reportWorksheet = reportWorkbook.Sheets.StudentsTemplate;

    expect(postMock).not.toHaveBeenCalled();
    expect(reportWorksheet.A2.s).toBeDefined();
    expect(reportWorksheet.H2.s).toBeDefined();
    expect(reportWorksheet.N1.v).toBe("أخطاء الاستيراد");
    expect(reportWorksheet.N2.v).toContain("الاسم مطلوب");
    expect(reportWorksheet.N2.v).toContain("تاريخ الميلاد غير صالح");
  });

  it("updates basic student info without memorized parts or credentials", async () => {
    renderStudentsPage();

    fireEvent.click((await screen.findAllByRole("button", { name: "تعديل" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "تعديل بيانات الطالب" });

    fireEvent.change(within(dialog).getByLabelText(/^هاتف ولي الأمر/), {
      target: { value: "0977777777" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "حفظ التعديلات" }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith(
        "/students/student-1",
        expect.objectContaining({
          parentPhoneNumber: "0977777777",
          academicStageId: "stage-1",
        })
      );
    });

    const updatePayload = putMock.mock.calls[0][1];
    expect(updatePayload).not.toHaveProperty("memorizedQuranParts");
    expect(updatePayload).not.toHaveProperty("userName");
    expect(updatePayload).not.toHaveProperty("password");
  });

  it("shows student detail and saves memorized parts through the dedicated endpoint", async () => {
    renderStudentsPage();

    fireEvent.click((await screen.findAllByRole("button", { name: "عرض" }))[0]);

    expect(await screen.findByRole("dialog", { name: "تفاصيل الطالب" })).toBeInTheDocument();
    expect(screen.getByText("الجزء الأول")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/students/student-1", {
      params: { include: "academicStage,memorizedParts" },
    });

    fireEvent.click(screen.getByRole("button", { name: /إدارة الأجزاء/ }));
    expect(await screen.findByRole("dialog", { name: "إدارة الأجزاء المحفوظة" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "الجزء الثاني" }));
    fireEvent.click(screen.getByRole("button", { name: "حفظ الأجزاء" }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith("/students/student-1/memorized-parts", {
        parts: ["part-1", "part-2"],
      });
    });
  });
});
