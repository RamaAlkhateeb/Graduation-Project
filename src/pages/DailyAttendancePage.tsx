import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Printer,
  Check,
  X,
  UserPlus,
  CalendarDays,
  Loader2,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Student = {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  userName: string;
};

type AttendanceRecord = {
  id: string;
  startDate: string;
  endDate: string;
  classStudentId: string;
};

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE_URL = "http://alashmar.runasp.net";
const getToken = () => localStorage.getItem("token");

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.title || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// إرجاع تاريخ ووقت الآن بصيغة ISO
const nowISO = () => new Date().toISOString();
const todayISO = () => new Date().toISOString().slice(0, 10);

const studentsApi = {
  getFiltered: () =>
    apiFetch<{ items: Student[] }>("/api/students/filtered"),
};

const attendanceApi = {
  getAll: (date: string) =>
    apiFetch<AttendanceRecord[]>(`/api/StudentAttendances?date=${date}`),

  create: (classStudentId: string) =>
    apiFetch<AttendanceRecord>("/api/StudentAttendances", {
      method: "POST",
      body: JSON.stringify({
        startDate: nowISO(),
        endDate: nowISO(),
        classStudentId,
      }),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/StudentAttendances/${id}`, { method: "DELETE" }),
};

// ─── Component ────────────────────────────────────────────────────────────────
const DailyAttendancePage = () => {
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [{ items }, r] = await Promise.all([
        studentsApi.getFiltered(),
        attendanceApi.getAll(date),
      ]);
      setStudents(items.sort((a, b) => a.name.localeCompare(b.name, "ar")));
      setRecords(r);
    } catch (e: unknown) {
      toast.error("فشل تحميل البيانات: " + (e instanceof Error ? e.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // map: classStudentId → record
  const recordMap = useMemo(() => {
    const m = new Map<string, AttendanceRecord>();
    records.forEach((r) => m.set(r.classStudentId, r));
    return m;
  }, [records]);

  // الطلاب المُصفَّون حسب البحث
  const filteredStudents = useMemo(() =>
    students.filter((s) =>
      s.name.includes(searchQuery) ||
      s.fatherName.includes(searchQuery) ||
      s.userName.includes(searchQuery)
    ), [students, searchQuery]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // ── Add attendance ────────────────────────────────────────────────────────
  const addAttendance = async () => {
    if (!selectedStudentId) {
      toast.error("اختر طالباً أولاً");
      return;
    }
    if (recordMap.has(selectedStudentId)) {
      toast.error("تم تسجيل حضور هذا الطالب مسبقاً");
      return;
    }
    try {
      const created = await attendanceApi.create(selectedStudentId);
      setRecords((prev) => [...prev, created]);
      setSelectedStudentId("");
      setSearchQuery("");
      toast.success("تم تسجيل الحضور");
    } catch (e: unknown) {
      toast.error("فشل تسجيل الحضور: " + (e instanceof Error ? e.message : ""));
    }
  };

  // ── Remove attendance ─────────────────────────────────────────────────────
  const removeAttendance = async (studentId: string) => {
    const rec = recordMap.get(studentId);
    if (!rec) return;
    if (!confirm("حذف سجل الحضور لهذا الطالب؟")) return;
    try {
      await attendanceApi.delete(rec.id);
      setRecords((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success("تم حذف سجل الحضور");
    } catch (e: unknown) {
      toast.error("فشل الحذف: " + (e instanceof Error ? e.message : ""));
    }
  };

  const presentCount = records.length;
  const absentCount = students.length - presentCount;

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>قائمة الحضور - ${date}</title>
<style>
  body{font-family:'Tajawal',Arial,sans-serif;padding:30px;color:#1a1a1a}
  h1{text-align:center;margin:0 0 6px}
  .meta{text-align:center;color:#555;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{border:1px solid #999;padding:8px 10px;text-align:right}
  th{background:#0d4f3c;color:#fff}
  .present{color:#0a7a3b;font-weight:700}
  .absent{color:#b32020;font-weight:700}
  tfoot td{font-weight:700;background:#f3f3f3}
</style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="تسجيل الحضور اليومي"
      subtitle="إدارة قائمة الطلاب وتسجيل الحضور وطباعة التقرير"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Controls + stats */}
        <Card className="p-5 lg:col-span-2 glass-card">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-1.5 block">التاريخ</label>
              <div className="relative">
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> طباعة
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">الإجمالي</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">حاضر</p>
              <p className="text-2xl font-bold text-primary">{presentCount}</p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">غائب</p>
              <p className="text-2xl font-bold text-destructive">{absentCount}</p>
            </div>
          </div>
        </Card>

        {/* Add attendance */}
        <Card className="p-5 glass-card">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> تسجيل حضور طالب
          </h3>
          <div className="space-y-2">
            {/* Custom searchable dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between border border-input rounded-md px-3 py-2 text-sm bg-background hover:bg-muted/50 transition-colors"
              >
                <span className={selectedStudent ? "text-foreground" : "text-muted-foreground"}>
                  {selectedStudent
                    ? `${selectedStudent.name} — ${selectedStudent.fatherName}`
                    : "اختر طالباً..."}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                  <div className="p-2 border-b border-border">
                    <Input
                      placeholder="ابحث بالاسم..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="h-8 text-sm"
                    />
                  </div>
                  <ul className="max-h-48 overflow-y-auto">
                    {filteredStudents.length === 0 && (
                      <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                        لا توجد نتائج
                      </li>
                    )}
                    {filteredStudents.map((s) => (
                      <li
                        key={s.id}
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          setSearchQuery("");
                          setDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted/60 transition-colors ${
                          s.id === selectedStudentId ? "bg-primary/10 font-medium" : ""
                        }`}
                      >
                        <span>{s.name}</span>
                        <span className="text-muted-foreground text-xs mr-2">— {s.fatherName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button onClick={addAttendance} className="w-full gap-2" disabled={!selectedStudentId}>
              <Plus className="h-4 w-4" /> تسجيل حاضر
            </Button>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">#</th>
                <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                <th className="px-4 py-3 text-right font-semibold">اسم الأب</th>
                <th className="px-4 py-3 text-center font-semibold">الحالة</th>
                <th className="px-4 py-3 text-center font-semibold">وقت التسجيل</th>
                <th className="px-4 py-3 text-center font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline ml-2" />
                    جارٍ التحميل…
                  </td>
                </tr>
              )}
              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا يوجد طلاب.
                  </td>
                </tr>
              )}
              {students.map((s, i) => {
                const rec = recordMap.get(s.id);
                const isPresent = !!rec;
                return (
                  <tr key={s.id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.fatherName}</td>
                    <td className="px-4 py-3 text-center">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 text-primary font-semibold text-xs bg-primary/10 px-2 py-1 rounded-full">
                          <Check className="h-3 w-3" /> حاضر
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive font-semibold text-xs bg-destructive/10 px-2 py-1 rounded-full">
                          <X className="h-3 w-3" /> غائب
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                      {rec
                        ? new Date(rec.startDate).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isPresent && (
                        <Button size="icon" variant="ghost" onClick={() => removeAttendance(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Hidden print area */}
      <div className="hidden">
        <div ref={printRef}>
          <h1>قائمة الحضور اليومي</h1>
          <div className="meta">التاريخ: {date} — الحاضرون: {presentCount} / {students.length}</div>
          <table>
            <thead>
              <tr><th>#</th><th>الاسم</th><th>اسم الأب</th><th>الحالة</th></tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const present = recordMap.has(s.id);
                return (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.fatherName}</td>
                    <td className={present ? "present" : "absent"}>
                      {present ? "حاضر" : "غائب"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>الإجمالي</td>
                <td>{presentCount} حاضر / {absentCount} غائب</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyAttendancePage;
