import { createOpenLessonHandler } from './openLesson.js';

// The handler uses history-ar's classroom-bound member tokens for classroom
// state and writes. Printed card links have a separate read-only response.
// Teacher questions additionally need the teacher PIN (OPEN_LESSON_TEACHER_PIN, default: the site's PIN).
Deno.serve(createOpenLessonHandler({
  url: Deno.env.get('SUPABASE_URL') || '',
  key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  teacherPin: Deno.env.get('OPEN_LESSON_TEACHER_PIN') || '3035',
}));
