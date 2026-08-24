import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { TeacherGate } from "./components/TeacherGate";
import { DownloadCenterPage } from "./pages/DownloadCenterPage";
import { EraPage } from "./pages/EraPage";
import { HomePage } from "./pages/HomePage";
import { LessonPage } from "./pages/LessonPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="three-kingdoms" element={<EraPage eraId="three-kingdoms" />} />
        <Route path="three-kingdoms/lesson/:lessonId" element={<LessonPage eraId="three-kingdoms" mode="student" />} />
        <Route path="joseon" element={<EraPage eraId="joseon" />} />
        <Route path="joseon/lesson/:lessonId" element={<LessonPage eraId="joseon" mode="student" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="teacher" element={<TeacherGate />}>
        <Route index element={<TeacherDashboardPage />} />
        <Route path=":eraSlug/lesson/:lessonId" element={<LessonPage mode="teacher" />} />
        <Route path=":eraSlug/downloads" element={<DownloadCenterPage />} />
      </Route>
    </Routes>
  );
}
