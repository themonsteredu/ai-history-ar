import { createArSharedHandler } from './arShared.js';

// Platform JWT check is disabled only because the handler authenticates every
// private request with a cryptographically random, classroom-bound member token.
// The service key stays in the Edge Function's configured server environment.
Deno.serve(createArSharedHandler({
  url: Deno.env.get('SUPABASE_URL') || '',
  key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
}));
