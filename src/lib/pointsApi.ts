import type { AxiosInstance } from "axios";

// ── Types ──────────────────────────────────────────────────────────────────

export interface PointCategoryDto {
  id: string;
  type: string;
}

export interface CreatePointCategoryRequest {
  type: string;
}

export interface UpdatePointCategoryRequest {
  type?: string | null;
}

export interface PointDto {
  id: string;
  studentId: string;
  studentName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  pointValue: number;
  notes?: string | null;
  title?: string | null;
  smesterId?: string | null;
  courseId?: string | null;
  classId?: string | null;
  givenByTeacherId?: string | null;   
  teacherName?: string | null;       
  createdAt?: string | null;
}

export interface CreatePointDto {
  studentId: string;
  teacherId?: string | null;
  categoryId?: string | null;
  pointValue: number;
  notes?: string | null;
}

export interface UpdatePointDto {
  categoryId?: string | null;
  pointValue?: number;
  notes?: string | null;
}

/**
 * البيانات المطلوبة لإضافة أو خصم نقاط لطالب
 */
export interface CreateAssessmentRequest {
  studentId: string;
  courseId: string;
  classId: string;

  /**
   * ملاحظة:
   * استخدمت smesterId كما أرسلتِه تماماً من الـ API.
   */
  smesterId: string;

  pointValue: number;

  title?: string | null;

  notes?: string | null;

  categoryId?: string | null;

  givenByTeacherId?: string | null;
}

export interface PagedListOfPointDto {
  items: PointDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export interface TopStudentPointDto {
  studentId: string;
  studentName: string;
  totalPoints: number;
}

export interface PointsByCategoryDto {
  categoryId: string;
  categoryName: string;
  totalPoints: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const normalize = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (Array.isArray(record.items)) {
      return record.items as T[];
    }

    if (Array.isArray(record.data)) {
      return record.data as T[];
    }
  }

  return [];
};

// ── Point Categories ───────────────────────────────────────────────────────

export const getPointCategories = async (
  client: AxiosInstance,
) => {
  const response = await client.get<PointCategoryDto[]>(
    "/PointCategories",
  );

  return normalize<PointCategoryDto>(
    response.data,
  );
};

export const getPointCategoriesPaged = async (
  client: AxiosInstance,
  page = 1,
  pageSize = 10,
) => {
  const response = await client.get(
    "/PointCategories/paged",
    {
      params: {
        page,
        pageSize,
      },
    },
  );

  return response.data;
};

export const createPointCategory = async (
  client: AxiosInstance,
  payload: CreatePointCategoryRequest,
) => {
  const response =
    await client.post<PointCategoryDto>(
      "/PointCategories",
      payload,
    );

  return response.data;
};

export const updatePointCategory = async (
  client: AxiosInstance,
  id: string,
  payload: UpdatePointCategoryRequest,
) => {
  const response =
    await client.put<PointCategoryDto>(
      `/PointCategories/${id}`,
      payload,
    );

  return response.data;
};

export const deletePointCategory = async (
  client: AxiosInstance,
  id: string,
) => {
  await client.delete(
    `/PointCategories/${id}`,
  );
};

// ── Points CRUD ────────────────────────────────────────────────────────────

export const getPoints = async (
  client: AxiosInstance,
) => {
  const response = await client.get<PointDto[]>(
    "/Points",
  );

  return normalize<PointDto>(
    response.data,
  );
};

export const getPointsPaged = async (
  client: AxiosInstance,
  page = 1,
  pageSize = 10,
) => {
  const response =
    await client.get<PagedListOfPointDto>(
      "/Points/paged",
      {
        params: {
          page,
          pageSize,
        },
      },
    );

  return response.data;
};

export const getPointById = async (
  client: AxiosInstance,
  id: string,
) => {
  const response =
    await client.get<PointDto>(
      `/Points/${id}`,
    );

  return response.data;
};

export const createPoint = async (
  client: AxiosInstance,
  payload: CreatePointDto,
) => {
  const response =
    await client.post<PointDto>(
      "/Points",
      payload,
    );

  return response.data;
};

export const updatePoint = async (
  client: AxiosInstance,
  id: string,
  payload: UpdatePointDto,
) => {
  const response =
    await client.put<PointDto>(
      `/Points/${id}`,
      payload,
    );

  return response.data;
};

export const deletePoint = async (
  client: AxiosInstance,
  id: string,
) => {
  await client.delete(
    `/Points/${id}`,
  );
};

// ── إضافة / خصم نقاط ──────────────────────────────────────────────────────

/**
 * هذه الدالة ترسل الـ payload الكامل الذي يحتاجه الـ API.
 *
 * ملاحظة مهمة:
 * لا نرسل teacherId و studentId ضمن رابط الـ URL،
 * بل ضمن الـ body.
 */
export const addStudentAssessment = async (
  client: AxiosInstance,
  payload: CreateAssessmentRequest,
) => {
  const response =
    await client.post<PointDto>(
      "/Points",
      payload,
    );

  return response.data;
};

// ── نقاط طالب محدد ─────────────────────────────────────────────────────────

export const getStudentPoints = async (
  client: AxiosInstance,
  studentId: string,
  semesterId?: string,
) => {
  const response =
    await client.get<PointDto[]>(
      `/students/${studentId}/points`,
      {
        params: semesterId
          ? { semesterId }
          : undefined,
      },
    );

  return normalize<PointDto>(
    response.data,
  );
};

// ── تقارير ─────────────────────────────────────────────────────────────────

export const getPointsByCategoryReport =
  async (
    client: AxiosInstance,
    params?: {
      semesterId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) => {
    const response =
      await client.get<
        PointsByCategoryDto[]
      >(
        "/reports/points/by-category",
        {
          params,
        },
      );

    return normalize<PointsByCategoryDto>(
      response.data,
    );
  };

export const getTopStudentsReport =
  async (
    client: AxiosInstance,
    params?: {
      semesterId?: string;
      top?: number;
    },
  ) => {
    const response =
      await client.get<
        TopStudentPointDto[]
      >(
        "/reports/points/top-students",
        {
          params,
        },
      );

    return normalize<TopStudentPointDto>(
      response.data,
    );
  };
  // ── إجمالي نقاط الطلاب (لوحة الصدارة) ──────────────────────────────────────

export interface StudentPointsTotalDto {
  studentId: string;
  studentName: string;
  totalPoints: number;
}

export interface PagedStudentsPointsTotals {
  items: StudentPointsTotalDto[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getStudentsPointsTotals = async (
  client: AxiosInstance,
  params?: {
    studentName?: string;
    classId?: string;
    page?: number;
    pageSize?: number;
  },
) => {
  const response = await client.get<PagedStudentsPointsTotals>(
    "/students/points-totals",
    { params },
  );

  return response.data;
};