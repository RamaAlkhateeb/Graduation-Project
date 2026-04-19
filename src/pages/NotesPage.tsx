import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquare, User, Send } from "lucide-react";

interface Note {
  id: number;
  from: string;
  to: string;
  toType: "teacher" | "parent";
  message: string;
  date: string;
}

const initialNotes: Note[] = [
  { id: 1, from: "الإدارة", to: "خالد الأحمد", toType: "teacher", message: "يرجى إرسال تقرير أداء الطلاب الشهري قبل نهاية الأسبوع", date: "2026-02-18" },
  { id: 2, from: "الإدارة", to: "والد الطالب أحمد", toType: "parent", message: "نود إعلامكم بتميز ابنكم في حفظ سورة البقرة، بارك الله فيكم", date: "2026-02-17" },
  { id: 3, from: "الإدارة", to: "سامر الخطيب", toType: "teacher", message: "تم تعيينكم للإشراف على اختبار سورة آل عمران يوم الأحد القادم", date: "2026-02-16" },
  { id: 4, from: "الإدارة", to: "والد الطالب خالد", toType: "parent", message: "نلاحظ غياب متكرر لابنكم، يرجى التواصل مع الأستاذ", date: "2026-02-15" },
];

const NotesPage = () => {
  const [notes, setNotes] = useState(initialNotes);
  const [open, setOpen] = useState(false);
  const [newNote, setNewNote] = useState({ to: "", toType: "teacher", message: "" });

  const handleAdd = () => {
    if (!newNote.message || !newNote.to) return;
    setNotes([{
      id: Date.now(),
      from: "الإدارة",
      to: newNote.to,
      toType: newNote.toType as "teacher" | "parent",
      message: newNote.message,
      date: new Date().toISOString().split("T")[0],
    }, ...notes]);
    setNewNote({ to: "", toType: "teacher", message: "" });
    setOpen(false);
  };

  return (
    <DashboardLayout title="الملاحظات" subtitle="إرسال ملاحظات للأساتذة وأولياء الأمور">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />إرسال ملاحظة</Button>
          </DialogTrigger>
          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader><DialogTitle>إرسال ملاحظة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>إرسال إلى</Label>
                <Select value={newNote.toType} onValueChange={(v) => setNewNote({ ...newNote, toType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">أستاذ</SelectItem>
                    <SelectItem value="parent">ولي أمر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الاسم</Label><input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newNote.to} onChange={(e) => setNewNote({ ...newNote, to: e.target.value })} /></div>
              <div><Label>نص الملاحظة</Label><Textarea rows={4} value={newNote.message} onChange={(e) => setNewNote({ ...newNote, message: e.target.value })} /></div>
              <Button onClick={handleAdd} className="w-full gap-2"><Send className="h-4 w-4" />إرسال</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {notes.map((note, i) => (
          <div key={note.id} className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${note.toType === "teacher" ? "bg-primary/10" : "bg-accent/20"}`}>
                {note.toType === "teacher" ? <User className="h-5 w-5 text-primary" /> : <MessageSquare className="h-5 w-5 text-accent-foreground" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-foreground">{note.to}</h4>
                  <span className="text-xs text-muted-foreground">{note.date}</span>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground mb-2 inline-block">
                  {note.toType === "teacher" ? "أستاذ" : "ولي أمر"}
                </span>
                <p className="text-sm text-foreground/80 mt-1">{note.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NotesPage;
