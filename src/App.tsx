import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { TeacherGate } from "./components/TeacherGate";
import { DownloadCenterPage } from "./pages/DownloadCenterPage";
import { EraPage } from "./pages/EraPage";
import { HomePage } from "./pages/HomePage";
import { LessonPage } from "./pages/LessonPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { TeacherToolSettingsPage } from "./pages/TeacherToolSettingsPage";
import { DataInquiryLessonPage } from './pages/DataInquiryLessonPage';

const ArPreviewPage = lazy(() => import("./pages/ArPreviewPage"));
const SampleExhibition = lazy(() => import('./features/ar-studio/SampleExhibition'));
const StudioPage = lazy(() => import('./features/ar-studio/StudioPage'));

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="three-kingdoms" element={<EraPage eraId="three-kingdoms" />} />
        <Route path="three-kingdoms/data/:sessionId" element={<DataInquiryLessonPage />} />
        <Route path="three-kingdoms/ar-sample" element={<Suspense fallback={<p>AR 예제를 준비해요…</p>}><SampleExhibition /></Suspense>} />
        <Route path="three-kingdoms/ar-studio" element={<Suspense fallback={<p>AR 제작 수업을 준비해요…</p>}><StudioPage /></Suspense>} />
        <Route path="three-kingdoms/ar-maker" element={<Suspense fallback={<p>AR 만들기를 열어요…</p>}><StudioPage maker /></Suspense>} />
        <Route path="joseon/ar-preview" element={<Suspense fallback={<p>AR을 준비하고 있어요…</p>}><ArPreviewPage key="joseon" eraId="joseon" /></Suspense>} />
        <Route path="three-kingdoms/ar-preview" element={<Suspense fallback={<p role="status">첨성대 AR을 준비하고 있어요…</p>}><ArPreviewPage key="three-kingdoms" /></Suspense>} />
        <Route path="three-kingdoms/lesson/:lessonId" element={<LessonPage eraId="three-kingdoms" mode="student" />} />
        <Route path="joseon" element={<EraPage eraId="joseon" />} />
        <Route path="joseon/lesson/:lessonId" element={<LessonPage eraId="joseon" mode="student" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="teacher" element={<TeacherGate />}>
        <Route index element={<TeacherDashboardPage />} />
        <Route path="three-kingdoms/data/:sessionId" element={<DataInquiryLessonPage teacher />} />
        <Route path="three-kingdoms/ar-studio" element={<Suspense fallback={<p>교사 수업 안내를 준비해요…</p>}><StudioPage teacher /></Suspense>} />
        <Route path="three-kingdoms/ar-maker" element={<Suspense fallback={<p>AR 만들기를 열어요…</p>}><StudioPage teacher maker /></Suspense>} />
        <Route path=":eraSlug/lesson/:lessonId" element={<LessonPage mode="teacher" />} />
        <Route path=":eraSlug/downloads" element={<DownloadCenterPage />} />
        <Route path="three-kingdoms/tools" element={<TeacherToolSettingsPage />} />
      </Route>
    </Routes>
  );
}
