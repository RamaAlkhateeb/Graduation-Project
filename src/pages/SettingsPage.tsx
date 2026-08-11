import {
  Check,
  Circle,
  CircleDot,
  Crosshair,
  MousePointer,
  MousePointer2,
  Square,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Switch } from "@/components/ui/switch";
import {
  CURSOR_COLORS,
  CURSOR_SHAPES,
  useCursorStore,
} from "@/store/cursorStore";
import type { CursorShape } from "@/store/cursorStore";

const SHAPE_ICONS: Record<CursorShape, typeof Circle> = {
  ring: Circle,
  dot: CircleDot,
  square: Square,
  crosshair: Crosshair,
  arrow: MousePointer2,
  arrowOnly: MousePointer,
};

const SettingsPage = () => {
  const { enabled, color, shape, setEnabled, setColor, setShape } =
    useCursorStore();

  return (
    <DashboardLayout title="الإعدادات" subtitle="تخصيص شكل المؤشر بما يناسبك">
      <div className="max-w-3xl">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
              <MousePointer2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">المؤشر المخصص</h3>
              <p className="text-sm text-muted-foreground">
                مؤشر أنيق يتبع حركة الفأرة بحركة سلسة
              </p>
            </div>
          </div>

          {/* تشغيل / إيقاف */}
          <div className="flex items-center justify-between gap-4 py-4 border-t">
            <div>
              <div className="font-medium text-gray-800">تفعيل المؤشر المخصص</div>
              <div className="text-sm text-muted-foreground">
                استبدال المؤشر الافتراضي بالمؤشر المخصص في جميع الصفحات
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* اختيار الشكل */}
          <div className="py-4 border-t">
            <div className="font-medium text-gray-800 mb-1">شكل المؤشر</div>
            <div className="text-sm text-muted-foreground mb-4">
              اختر الشكل الذي يعجبك للمؤشر المخصص
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {CURSOR_SHAPES.map((s) => {
                const selected = s.id === shape;
                const Icon = SHAPE_ICONS[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => setShape(s.id)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-150 hover:border-green-400 ${
                      selected
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* اختيار اللون */}
          <div className="py-4 border-t">
            <div className="font-medium text-gray-800 mb-1">لون المؤشر</div>
            <div className="text-sm text-muted-foreground mb-4">
              اختر اللون الذي يناسبك من الألوان المتاحة
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {CURSOR_COLORS.map((c) => {
                const selected = c.id === color;
                return (
                  <button
                    key={c.id}
                    onClick={() => setColor(c.id)}
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={selected}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 ${
                      selected
                        ? "ring-2 ring-offset-2 ring-offset-white"
                        : ""
                    }`}
                    style={{
                      backgroundColor: c.value,
                      ...(selected ? { boxShadow: `0 0 0 2px ${c.value}` } : {}),
                    }}
                  >
                    {selected && <Check className="h-5 w-5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ملاحظة الحفظ التلقائي */}
          <div className="py-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <span>💾</span>
            <span>
              يتم حفظ الإعدادات تلقائياً في متصفحك، وتبقى محفوظة حتى بعد إغلاق
              الصفحة أو إعادة تحميلها
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
