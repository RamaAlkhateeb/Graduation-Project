import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: getMock,
      post: postMock,
      put: putMock,
      delete: deleteMock,
    }),
    isAxiosError: (error: unknown) => Boolean((error as { response?: unknown })?.response),
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

import StatusesPage from "./StatusesPage";
import { toast } from "sonner";

const statuses = [
  { id: 1, name: "متقن", color: "#28a745", sortOrder: 1 },
  { id: 2, name: "قيد المراجعة", color: "#dc3545", sortOrder: 2 },
];

const renderStatusesPage = () =>
  render(
    <MemoryRouter initialEntries={["/statuses"]}>
      <StatusesPage />
    </MemoryRouter>
  );

describe("StatusesPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
    localStorage.clear();
    localStorage.setItem("token", "test-token");

    getMock.mockImplementation((path: string) => {
      switch (path) {
        case "/statuses":
          return Promise.resolve({ data: statuses });
        default:
          return Promise.reject(new Error(`Unexpected path: ${path}`));
      }
    });
  });

  it("lists statuses with their colors and sort order", async () => {
    renderStatusesPage();

    expect(await screen.findByText("متقن")).toBeInTheDocument();
    expect(screen.getByText("قيد المراجعة")).toBeInTheDocument();
    expect(screen.getByText("#28a745")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/statuses");
  });

  it("creates a new status through POST /statuses", async () => {
    postMock.mockResolvedValue({ data: { id: 3, name: "معاد الاختبار", color: "#17a2b8", sortOrder: 3 } });
    renderStatusesPage();

    fireEvent.click(await screen.findByRole("button", { name: "إضافة حالة" }));
    const dialog = await screen.findByRole("dialog", { name: "إضافة حالة" });

    fireEvent.change(within(dialog).getByLabelText("الاسم"), {
      target: { value: "معاد الاختبار" },
    });
    fireEvent.change(within(dialog).getByLabelText("اللون"), {
      target: { value: "#17a2b8" },
    });
    fireEvent.change(within(dialog).getByLabelText("الترتيب"), {
      target: { value: "3" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "إضافة" }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith("/statuses", {
        name: "معاد الاختبار",
        color: "#17a2b8",
        sortOrder: 3,
      });
    });
  });

  it("edits an existing status through PUT /statuses/{id}", async () => {
    putMock.mockResolvedValue({ data: { id: 1, name: "مُتقَن", color: "#28a745", sortOrder: 1 } });
    renderStatusesPage();

    fireEvent.click((await screen.findAllByRole("button", { name: "تعديل" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "تعديل حالة" });

    const nameInput = within(dialog).getByLabelText("الاسم") as HTMLInputElement;
    expect(nameInput.value).toBe("متقن");

    fireEvent.change(nameInput, { target: { value: "مُتقَن" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "حفظ التعديلات" }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith("/statuses/1", {
        name: "مُتقَن",
        color: "#28a745",
        sortOrder: 1,
      });
    });
  });

  it("deletes a status through DELETE /statuses/{id} and refreshes", async () => {
    deleteMock.mockResolvedValue({});
    renderStatusesPage();

    fireEvent.click((await screen.findAllByRole("button", { name: "حذف" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "تأكيد الحذف" });

    fireEvent.click(within(dialog).getByRole("button", { name: "حذف" }));

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith("/statuses/1");
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("تم حذف الحالة بنجاح");
    });
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("shows a friendly message when deleting a status that is in use (409)", async () => {
    deleteMock.mockRejectedValue({ response: { status: 409 } });
    renderStatusesPage();

    fireEvent.click((await screen.findAllByRole("button", { name: "حذف" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "تأكيد الحذف" });

    fireEvent.click(within(dialog).getByRole("button", { name: "حذف" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("لا يمكن حذف هذه الحالة لأنها مستخدمة")
      );
    });
    expect(getMock).toHaveBeenCalledTimes(1);
  });
});
