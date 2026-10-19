import { createOpenLessonHandler } from './openLesson.js';

// Platform JWT check is disabled only because the handler authenticates every
// request with the classroom-bound member token issued by history-ar's /join.
// Teacher questions additionally need the teacher PIN (OPEN_LESSON_TEACHER_PIN, default: the site's PIN).
Deno.serve(createOpenLessonHandler({
  url: Deno.env.get('SUPABASE_URL') || '',
  key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  teacherPin: Deno.env.get('OPEN_LESSON_TEACHER_PIN') || '3035',
}));
