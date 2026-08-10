import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import SemestersPage from "./pages/SemestersPage";
import CoursesPage from "./pages/CoursesPage";
import TeachersPage from "./pages/TeachersPage";
import StudentsPage from "./pages/StudentsPage";
import CirclesPage from "./pages/CirclesPage";
import StudentEnrollmentPage from "./pages/StudentEnrollmentPage";
import TeacherEnrollmentPage from "./pages/TeacherEnrollmentPage";
import CircleDetailsPage from "./pages/CircleDetailsPage";
import DailyAttendancePage from "./pages/DailyAttendancePage";
import ReportsPage from "./pages/ReportsPage";
import ExamsPage from "./pages/ExamsPage";
import FormListPage from "./pages/FormListPage";
import FormBuilderPage from './pages/FormBuilderPage';
import FormPreviewPage from './pages/FormPreviewPage';
import FormFillPage from './pages/FormFillPage';
import FormResponsesPage from './pages/FormResponsesPage';
import EmailPage from "./pages/EmailPage";
import NotFound from "./pages/NotFound";
import AttendanceCheckInPage from "./pages/AttendanceCheckInPage";
import AttendanceCheckOutPage from "./pages/AttendanceCheckOutPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/index" element={<Index />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/semesters" element={<SemestersPage />} />
           <Route path="/courses" element={<CoursesPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/circles" element={<CirclesPage />} />
          <Route path="/circles/:circleId" element={<CircleDetailsPage />} />
          <Route path="/enrollments/student" element={<StudentEnrollmentPage />} />
          <Route path="/enrollments/teacher" element={<TeacherEnrollmentPage />} />
          <Route path="/attendance/daily" element={<DailyAttendancePage/>}/>
          <Route path="/attendance/check-in" element={<AttendanceCheckInPage />} />
          <Route path="/attendance/check-out" element={<AttendanceCheckOutPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/form" element={<FormListPage />} />
           <Route path="/fill/:accessToken" element={<FormFillPage />} />
           <Route path="/forms/new" element={<FormBuilderPage />} />
        <Route path="/forms/:id/edit" element={<FormBuilderPage />} />
        <Route path="/forms/:id/preview" element={<FormPreviewPage /> }/>
        <Route path="/forms/:id/responses" element={<FormResponsesPage />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;