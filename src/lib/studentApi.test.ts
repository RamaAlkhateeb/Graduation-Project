import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import {
  createStudent,
  getAcademicStages,
  getMemorizedQuranParts,
  getStudentById,
  getStudents,
  updateStudent,
  updateStudentMemorizedParts,
} from "./studentApi";

const createClient = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }) as unknown as AxiosInstance & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };

describe("studentApi", () => {
  it("loads academic stages from the lookup endpoint", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: [{ id: "stage-1", grade: "FirstGrade" }] });

    await expect(getAcademicStages(client)).resolves.toEqual([
      { id: "stage-1", grade: "FirstGrade" },
    ]);
    expect(client.get).toHaveBeenCalledWith("/academic-stages");
  });

  it("loads memorized Quran parts from the lookup endpoint", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: [{ id: "part-1", memorizedQuranPart: "Part1" }] });

    await expect(getMemorizedQuranParts(client)).resolves.toEqual([
      { id: "part-1", memorizedQuranPart: "Part1" },
    ]);
    expect(client.get).toHaveBeenCalledWith("/memorized-quran-parts");
  });

  it("requests students with list params", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: { items: [] } });

    await getStudents(client, { pageNumber: 1, pageSize: 10, include: "academicStage" });

    expect(client.get).toHaveBeenCalledWith("/students", {
      params: { pageNumber: 1, pageSize: 10, include: "academicStage" },
    });
  });

  it("requests student detail with includes", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: { id: "student-1" } });

    await getStudentById(client, "student-1", ["academicStage", "memorizedParts"]);

    expect(client.get).toHaveBeenCalledWith("/students/student-1", {
      params: { include: "academicStage,memorizedParts" },
    });
  });

  it("creates students with the expanded required fields", async () => {
    const client = createClient();
    const payload = {
      name: "أحمد",
      fatherName: "محمد",
      lastName: "الخطيب",
      fatherWork: "مدرس",
      parentPhoneNumber: "0999999999",
      schoolName: "مدرسة النور",
      parentWhatsAppPhoneNumber: "0999999999",
      dateOfBirth: "2014-01-01",
      landlineNumber: null,
      additionalInformations: null,
      userName: "ahmad",
      password: "secret",
      academicStageId: "stage-1",
      email: "ahmad@example.com",
    };
    client.post.mockResolvedValue({ data: { id: "student-1", ...payload } });

    await createStudent(client, payload);

    expect(client.post).toHaveBeenCalledWith("/students", payload);
  });

  it("updates students without sending memorized parts or credentials", async () => {
    const client = createClient();
    const payload = {
      name: "أحمد",
      fatherName: "محمد",
      lastName: "الخطيب",
      fatherWork: "مدرس",
      parentPhoneNumber: "0999999999",
      schoolName: "مدرسة النور",
      parentWhatsAppPhoneNumber: "0999999999",
      dateOfBirth: "2014-01-01",
      landlineNumber: null,
      academicStageId: "stage-1",
      email: "ahmad@example.com",
    };
    client.put.mockResolvedValue({ data: { id: "student-1", ...payload } });

    await updateStudent(client, "student-1", payload);

    expect(client.put).toHaveBeenCalledWith("/students/student-1", payload);
    expect(client.put.mock.calls[0][1]).not.toHaveProperty("memorizedQuranParts");
    expect(client.put.mock.calls[0][1]).not.toHaveProperty("userName");
    expect(client.put.mock.calls[0][1]).not.toHaveProperty("password");
  });

  it("updates memorized parts through the dedicated endpoint only", async () => {
    const client = createClient();
    client.put.mockResolvedValue({ data: undefined });

    await updateStudentMemorizedParts(client, "student-1", ["part-1", "part-2"]);

    expect(client.put).toHaveBeenCalledWith("/students/student-1/memorized-parts", {
      parts: ["part-1", "part-2"],
    });
  });
});
