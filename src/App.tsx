import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DownloadCenterPage } from "./pages/DownloadCenterPage";
import { EraPage } from "./pages/EraPage";
import { HomePage } from "./pages/HomePage";
import { LessonPage } from "./pages/LessonPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/three-kingdoms" element={<EraPage eraId="three-kingdoms" />} />
        <Route path="/three-kingdoms/lesson/:lessonId" element={<LessonPage eraId="three-kingdoms" mode="student" />} />
        <Route path="/joseon" element={<EraPage eraId="joseon" />} />
        <Route path="/joseon/lesson/:lessonId" element={<LessonPage eraId="joseon" mode="student" />} />
        <Route path="/teacher" element={<TeacherDashboardPage />} />
        <Route path="/teacher/:eraSlug/lesson/:lessonId" element={<LessonPage mode="teacher" />} />
        <Route path="/teacher/:eraSlug/downloads" element={<DownloadCenterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
