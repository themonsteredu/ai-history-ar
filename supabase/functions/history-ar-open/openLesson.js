//#region src/features/open-class/artifacts.ts
/** The six Joseon science artifacts of the open lesson. `look` gives students places to observe, never the answers. */
var ARTIFACTS = [
	{
		id: 1,
		key: "cheugugi",
		name: "측우기",
		hanja: "測雨器",
		kind: "비의 양을 재는 기구",
		look: [
			"비를 받는 그릇은 어떤 모양일까요?",
			"그릇을 올려 둔 받침은 무엇으로 만들었을까요?",
			"빗물의 깊이는 무엇으로 쟀을까요?"
		],
		teacherNote: "세종 때(1441년 무렵) 만들어 전국에 두고 비의 양을 기록했어요. 쇠 그릇을 돌 받침(측우대)에 올리고 자(주척)로 빗물 깊이를 쟀어요."
	},
	{
		id: 2,
		key: "jagyeongnu",
		name: "자격루",
		hanja: "自擊漏",
		kind: "스스로 시각을 알리는 물시계",
		look: [
			"물은 어디에서 어디로 흘러갈까요?",
			"시간이 되면 무엇이 소리를 낼까요?",
			"왜 높이가 다른 항아리를 여러 개 썼을까요?"
		],
		teacherNote: "1434년 장영실 등이 만든 물시계예요. 물이 일정하게 흘러 잣대가 떠오르면 장치가 움직여 인형이 종·북·징을 울렸어요. 지금 남은 것은 중종 때(1536년) 다시 만든 것의 일부예요."
	},
	{
		id: 3,
		key: "ganui",
		name: "간의",
		hanja: "簡儀",
		kind: "별과 해의 위치를 재는 관측 기구",
		look: [
			"둥근 고리는 몇 개이고 어떤 방향으로 놓였을까요?",
			"하늘을 볼 때 어느 부분으로 들여다볼까요?",
			"혼천의와 비교하면 무엇이 더 간단할까요?"
		],
		teacherNote: "세종 때(1432년 무렵) 만든 천문 관측 기구로, 혼천의를 간단하게 만들었다는 뜻의 이름이에요. 경복궁 간의대에 두고 해와 별의 위치를 관측했어요."
	},
	{
		id: 4,
		key: "angbuilgu",
		name: "앙부일구",
		hanja: "仰釜日晷",
		kind: "솥 모양 해시계",
		look: [
			"그릇은 무엇을 닮았을까요?",
			"그림자를 만드는 바늘은 어디에 있을까요?",
			"안쪽의 가로줄과 세로줄은 무엇을 알려 줄까요?"
		],
		teacherNote: "1434년 무렵 만든 해시계로, 하늘을 우러러보는 솥이라는 뜻이에요. 바늘(영침) 그림자로 시각과 절기를 알았고, 길가에 두어 백성도 볼 수 있게 했어요."
	},
	{
		id: 5,
		key: "honcheonui",
		name: "혼천의",
		hanja: "渾天儀",
		kind: "해·달·별의 움직임을 보는 천문 기구",
		look: [
			"고리가 여러 겹으로 겹친 까닭은 무엇일까요?",
			"가운데에는 무엇이 있을까요?",
			"고리를 돌리면 무엇을 알 수 있을까요?"
		],
		teacherNote: "세종 때(1433년 무렵) 만든 천문 기구로, 여러 겹의 고리로 해·달·별의 위치와 움직임을 살폈어요. 현종 때(1669년) 송이영이 만든 혼천시계도 남아 있어요."
	},
	{
		id: 6,
		key: "nongsajikseol",
		name: "농사직설",
		hanja: "農事直說",
		kind: "우리 땅에 맞는 농사법을 모은 책",
		look: [
			"책은 어떤 글자로 썼을까요?",
			"누구에게 물어보고 내용을 모았을까요?",
			"이 책으로 농사가 어떻게 달라졌을까요?"
		],
		teacherNote: "1429년 세종 때 정초 등이 펴낸 농사책이에요. 각 지방의 경험 많은 농부에게 물어 우리 땅과 기후에 맞는 농사법을 한문으로 정리했어요."
	}
];
var DECISIONS = [
	{
		id: "adopt",
		label: "채택",
		help: "문제와 정답이 맞고 근거도 있어요."
	},
	{
		id: "revise",
		label: "직접 수정",
		help: "틀리거나 애매해서 우리가 고쳐요."
	},
	{
		id: "exclude",
		label: "제외",
		help: "근거를 찾을 수 없어서 빼요."
	}
];
var text = (v, max) => typeof v === "string" && v.length <= max;
var id = (v) => typeof v === "string" && v.length > 0 && v.length <= 40;
var group = (v) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 6;
var ox = (v) => v === "O" || v === "X";
var vector = (v) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number" && Number.isFinite(n) && n >= -3 && n <= 3);
var artifact = (v) => ARTIFACTS.some((item) => item.id === v);
function isQuestion(q) {
	const v = q;
	return !!v && typeof v === "object" && id(v.id) && text(v.statement, 200) && ox(v.answer) && text(v.explanation, 400) && typeof v.pointId === "string" && v.pointId.length <= 40;
}
var uniqueIds = (list) => new Set(list.map((item) => item.id)).size === list.length;
function isGroupCard(value) {
	const v = value;
	return !!v && typeof v === "object" && v.version === 1 && group(v.group) && (v.artifactId === 0 || artifact(v.artifactId)) && text(v.members, 100) && Array.isArray(v.points) && v.points.length <= 6 && uniqueIds(v.points) && v.points.every((p) => p && id(p.id) && vector(p.position) && text(p.title, 40) && text(p.text, 400)) && Array.isArray(v.questions) && v.questions.length <= 5 && uniqueIds(v.questions) && v.questions.every(isQuestion);
}
function isTeacherSet(value) {
	const v = value;
	return !!v && typeof v === "object" && v.version === 1 && artifact(v.artifactId) && Array.isArray(v.questions) && v.questions.length <= 5 && uniqueIds(v.questions) && v.questions.every(isQuestion);
}
function isVerification(value) {
	const v = value, p = v?.parts;
	return !!v && typeof v === "object" && v.version === 1 && group(v.verifier) && group(v.target) && v.verifier !== v.target && !!p && typeof p === "object" && text(p.role, 200) && text(p.situation, 300) && text(p.style, 200) && Array.isArray(v.items) && v.items.length <= 10 && new Set(v.items.map((i) => i?.questionId)).size === v.items.length && v.items.every((i) => i && id(i.questionId) && (i.source === "student" || i.source === "teacher") && (i.solved === "" || ox(i.solved)) && text(i.why, 300) && text(i.curious, 300) && typeof i.asked === "boolean" && text(i.aiAnswer, 800) && (i.decision === "" || DECISIONS.some((d) => d.id === i.decision)) && text(i.revised, 200) && (i.revisedAnswer === "" || ox(i.revisedAnswer)) && text(i.reason, 400) && text(i.explanation, 600));
}
//#endregion
//#region src/server/openLesson.ts
var MAX_BODY = 13e4;
var TOKEN = /^[a-f0-9]{64}$/;
var allowedOrigins = /* @__PURE__ */ new Set([
	"https://ai-history-ar.vercel.app",
	"https://ai-history-ar-themonsteredu.vercel.app",
	"https://ai-history-ar-git-main-themonsteredu.vercel.app"
]);
var json = (value, status = 200, origin = "") => Response.json(value, {
	status,
	headers: {
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff",
		"Vary": "Origin",
		...allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}
	}
});
var RequestError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
	}
};
async function readBody(request) {
	if (!request.headers.get("content-type")?.startsWith("application/json")) throw new RequestError(415, "JSON 요청만 사용할 수 있어요.");
	const raw = await request.text();
	if (raw.length > MAX_BODY) throw new RequestError(413, "저장할 내용이 너무 길어요. 설명을 조금 줄여 주세요.");
	try {
		const value = JSON.parse(raw);
		if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
		return value;
	} catch {
		throw new RequestError(400, "입력 내용을 확인해 주세요.");
	}
}
async function hash(token) {
	return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), (n) => n.toString(16).padStart(2, "0")).join("");
}
/** Joseon open lesson API. Students join through the existing /api/ar-studio/join; this only reads and saves the lesson's items. */
function createOpenLessonHandler(config) {
	const fetcher = config.fetch || fetch;
	const writes = /* @__PURE__ */ new Map();
	async function rpc(payload) {
		const response = await fetcher(`${config.url}/rest/v1/rpc/history_ar_open_dispatch`, {
			method: "POST",
			signal: AbortSignal.timeout(2e4),
			headers: {
				"Content-Type": "application/json",
				apikey: config.key,
				Authorization: `Bearer ${config.key}`
			},
			body: JSON.stringify(payload)
		});
		if (!response.ok) throw new RequestError(503, "저장 서버에 연결하지 못했어요. 쓴 내용은 이 기기에 남아 있으니 다시 눌러 주세요.");
		const value = await response.json();
		if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError(503, "저장 서버 응답을 확인하지 못했어요.");
		return value;
	}
	return async (request) => {
		const origin = request.headers.get("origin") || "";
		try {
			if (origin && !allowedOrigins.has(origin)) throw new RequestError(403, "수업 사이트에서 다시 열어 주세요.");
			if (request.method === "OPTIONS") return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": origin,
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "authorization, content-type",
					"Access-Control-Max-Age": "600",
					"Vary": "Origin"
				}
			});
			const path = new URL(request.url).pathname.replace(/^.*\/(?:history-ar-open|api\/open-lesson)/, "") || "/";
			if (path === "/health" && request.method === "GET") return json({ status: config.url && config.key ? "ready" : "unconfigured" }, config.url && config.key ? 200 : 503, origin);
			if (!["GET", "POST"].includes(request.method)) throw new RequestError(405, "지원하지 않는 요청입니다.");
			if (!config.url || !config.key) throw new RequestError(503, "저장 서버 연결을 확인해 주세요.");
			const match = path.match(/^\/rooms\/([a-z0-9]{4,12})(?:\/(card|verify\/([1-6])|teacher\/([1-6])))?$/);
			if (!match) throw new RequestError(404, "수업 경로를 찾지 못했어요.");
			const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1] || "";
			if (!TOKEN.test(token)) throw new RequestError(401, "수업코드로 먼저 입장해 주세요.");
			const code = match[1], tail = match[2];
			const base = {
				p_code: code,
				p_token_hash: await hash(token)
			};
			if (!tail) {
				if (request.method !== "GET") throw new RequestError(405, "지원하지 않는 요청입니다.");
				const { _status, ...result } = await rpc({
					...base,
					p_action: "state",
					p_payload: {}
				});
				return json(result, Number(_status) || 200, origin);
			}
			if (request.method !== "POST") throw new RequestError(405, "지원하지 않는 요청입니다.");
			const now = Date.now(), limitKey = `${code}:${request.headers.get("x-forwarded-for") || "shared"}`;
			if (writes.size > 1e3) writes.clear();
			const limit = writes.get(limitKey);
			if (limit && now - limit.start < 6e4) {
				if (++limit.count > 240) throw new RequestError(429, "저장 요청이 많아요. 잠시 뒤 다시 눌러 주세요.");
			} else writes.set(limitKey, {
				start: now,
				count: 1
			});
			const input = await readBody(request);
			if (!Number.isInteger(input.expectedVersion) || Number(input.expectedVersion) < 0) throw new RequestError(400, "저장본 번호를 확인해 주세요.");
			let kind = "", key = "";
			if (tail === "card") {
				if (!isGroupCard(input.data)) throw new RequestError(400, "카드 내용의 길이와 형식을 확인해 주세요.");
				kind = "card";
				key = String(input.data.group);
			} else if (match[3]) {
				if (!isVerification(input.data) || input.data.target !== Number(match[3])) throw new RequestError(400, "검증 기록의 길이와 형식을 확인해 주세요.");
				kind = "verify";
				key = `${input.data.verifier}:${input.data.target}`;
			} else {
				if (typeof input.pin !== "string" || !config.teacherPin || input.pin !== config.teacherPin) throw new RequestError(403, "선생님 PIN을 확인해 주세요.");
				if (!isTeacherSet(input.data) || input.data.artifactId !== Number(match[4])) throw new RequestError(400, "선생님 문제의 길이와 형식을 확인해 주세요.");
				kind = "teacher";
				key = String(input.data.artifactId);
			}
			const { _status, ...result } = await rpc({
				...base,
				p_action: "save",
				p_payload: {
					kind,
					key,
					expectedVersion: input.expectedVersion,
					data: input.data
				}
			});
			return json(result, Number(_status) || 200, origin);
		} catch (error) {
			return json({ error: error instanceof RequestError ? error.message : "저장을 마치지 못했어요. 다시 눌러 주세요." }, error instanceof RequestError ? error.status : 503, origin);
		}
	};
}
//#endregion
export { createOpenLessonHandler };
