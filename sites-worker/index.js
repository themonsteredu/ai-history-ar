import { handleStudio } from './arStudio';
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/ar-studio')) return handleStudio(request, env);
    const response = await env.ASSETS.fetch(request);
    if (
      response.status !== 404 ||
      request.method !== "GET" ||
      !request.headers.get("accept")?.includes("text/html")
    ) {
      return response;
    }

    const fallbackUrl = new URL("/index.html", request.url);
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  },
};
