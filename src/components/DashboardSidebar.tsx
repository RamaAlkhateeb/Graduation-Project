import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  ClipboardList,
  FileText,
  MessageSquare,
  ChevronLeft,
  Menu,
  CalendarDays,
  BookMarked,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/index" },
  { icon: CalendarDays, label: "الفصول", path: "/semesters" },
  { icon: BookMarked, label: "الكورسات", path: "/courses" },
  { icon: Users, label: "الأساتذة", path: "/teachers" },
  { icon: GraduationCap, label: "الطلاب", path: "/students" },
  { icon: BookOpen, label: "الحلقات", path: "/circles" },
  { icon: BarChart3, label: "الحضور والتقدم", path: "/attendance" },
  { icon: ClipboardList, label: "الاختبارات", path: "/exams" },
  { icon: FileText, label: "الاستبيانات", path: "/surveys" },
  { icon: MessageSquare, label: "الملاحظات", path: "/notes" },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile button */}
      <button
        className="fixed top-4 right-4 z-50 lg:hidden rounded-lg bg-green-700 p-2 text-white shadow-lg"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={`fixed top-0 right-0 h-screen z-40 transition-all duration-300 flex flex-col bg-white border-l shadow-sm ${
          collapsed ? "w-20" : "w-64"
        } ${collapsed ? "max-lg:-translate-x-full" : ""} lg:translate-x-0`}
      >
        {/* Header */}
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
              <img src="/icon.png" className="w-8 h-8 object-contain" />
            </div>

            {!collapsed && (
              <div>
                <h1 className="text-base font-bold text-gray-800">
                  مسجد الأشمر
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute right-0 top-0 h-full w-1 bg-green-600 rounded-l-md" />
                )}

                {/* Icon container */}
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition ${
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </div>

                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
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

      {/* Spacer */}
      <div
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      />
    </>
  );
};

export default DashboardSidebar;