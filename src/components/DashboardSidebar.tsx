import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  FileText,
  Mail,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  CalendarDays,
  BookMarked,
  ClipboardCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  Settings,
} from "lucide-react";

interface MenuChild {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path?: string;
  children?: MenuChild[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/index" },
  { icon: CalendarDays, label: "الفصول", path: "/semesters" },
  { icon: BookMarked, label: "الكورسات", path: "/courses" },
  { icon: BookOpen, label: "الحلقات", path: "/circles" },
  { icon: Users, label: "الأساتذة", path: "/teachers" },
  { icon: GraduationCap, label: "الطلاب", path: "/students" },
  {
    icon: Users,
    label: "التسجيلات",
    children: [
      { icon: UserPlus, label: "تسجيل طالب في حلقة", path: "/enrollments/student" },
      { icon: UserPlus, label: "تسجيل أستاذ في حلقة", path: "/enrollments/teacher" },
    ],
  },
  {
    icon: ClipboardCheck,
    label: "تسجيل الحضور",
    children: [
      { icon: UserCheck, label: "تسجيل حضور الطالب", path: "/attendance/check-in" },
      { icon: UserMinus, label: "تسجيل خروج الطالب", path: "/attendance/check-out" },
    ],
  },
  { icon: FileText, label: "الاستبيانات والاختبارات", path: "/form" },
  { icon: BarChart3, label: "التقارير", path: "/reports" },
  { icon: Mail, label: "البريد الإلكتروني", path: "/email" },
  { icon: Settings, label: "الإعدادات", path: "/settings" },
];

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
};

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState<string[]>(() =>
    menuItems
      .filter((item) => item.children?.some((child) => location.pathname === child.path))
      .map((item) => item.label)
  );

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleNavigate = () => {
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  // On mobile the sidebar is always full width (labels shown); `collapsed` only affects desktop.
  const showLabels = !collapsed || !isDesktop;

  return (
    <>
      {/* Mobile menu button */}
      <button
        className={`fixed top-4 right-4 z-50 lg:hidden print:hidden rounded-lg bg-green-700 p-2 text-white shadow-lg transition-opacity ${
          mobileOpen ? "opacity-0 pointer-events-none" : ""
        }`}
        onClick={() => setMobileOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={`flex flex-col bg-white border-l shadow-sm print:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          mobileOpen ? "w-64 visible" : "w-0 invisible"
        } lg:visible lg:w-64 lg:h-screen lg:sticky lg:top-0 ${
          collapsed ? "lg:w-20" : ""
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
              <img src="/icon.png" className="w-8 h-8 object-contain" />
            </div>

            {showLabels && (
              <div className="flex-1">
                <h1 className="text-base font-bold text-gray-800">
                  مسجد الأشمر
                </h1>
              </div>
            )}

            {/* Mobile close button */}
            <button
              type="button"
              className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
              onClick={() => setMobileOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            // ── عنصر له تبويبات فرعية ──
            if (item.children) {
              const isChildActive = item.children.some(
                (child) => location.pathname === child.path
              );
              const isOpen = openMenus.includes(item.label) || isChildActive;

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isChildActive
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {isChildActive && (
                      <span className="absolute right-0 top-0 h-full w-1 bg-green-600 rounded-l-md" />
                    )}

                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-lg transition ${
                        isChildActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>

                    {showLabels && (
                      <>
                        <span className="text-sm font-medium flex-1 text-right">
                          {item.label}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {/* التبويبات الفرعية */}
                  {showLabels && isOpen && (
                    <div className="mt-1 mr-4 pr-3 border-r-2 border-green-100 space-y-1">
                      {item.children.map((child) => {
                        const isActive = location.pathname === child.path;

                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={handleNavigate}
                            className={`relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                              isActive
                                ? "bg-green-50 text-green-700"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {isActive && (
                              <span className="absolute right-0 top-0 h-full w-1 bg-green-600 rounded-l-md" />
                            )}

                            <div
                              className={`flex items-center justify-center w-7 h-7 rounded-lg transition ${
                                isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                              }`}
                            >
                              <child.icon className="h-4 w-4" />
                            </div>

                            <span className="text-sm font-medium">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ── عنصر عادي بدون تبويبات فرعية ──
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path!}
                onClick={handleNavigate}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {isActive && (
                  <span className="absolute right-0 top-0 h-full w-1 bg-green-600 rounded-l-md" />
                )}

                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition ${
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </div>

                {showLabels && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center p-3 border-t text-gray-500 hover:text-gray-800 transition"
        >
          <ChevronLeft
            className={`h-5 w-5 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </aside>
    </>
  );
};

export default DashboardSidebar;