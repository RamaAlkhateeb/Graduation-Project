import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * توليد معرّف فريد.
 *
 * `crypto.randomUUID()` متاح فقط في السياقات الآمنة (HTTPS أو localhost)،
 * لذا في حالة الاستضافة عبر HTTP العادي (مثل alashmar.runasp.net) يكون
 * غير معرّف ويسبب انهيار الصفحة عند فتحها — نستخدم بديلًا آمنًا في هذه الحالة.
 */
export const uuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback: UUID v4 بسيط يعمل في أي بيئة
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};
