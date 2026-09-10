//#region src/lib/ar/primitives.ts
function validParts(value) {
	const vector = (v, min, max) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max);
	return Array.isArray(value) && value.length >= 1 && value.length <= 40 && value.every((p) => p && typeof p.id === "string" && p.id.length > 0 && p.id.length <= 60 && [
		"box",
		"cylinder",
		"ring"
	].includes(p.kind) && vector(p.position, -3, 3) && vector(p.scale, .05, 3) && vector(p.rotation, -360, 360) && /^#[0-9A-Fa-f]{6}$/.test(p.color)) && new Set(value.map((p) => p.id)).size === value.length;
}
//#endregion
//#region src/lib/ar/preparedCatalog.ts
var preparedHeritages = [
	{
		id: 1,
		key: "samguk-muryeong-v1",
		name: "무령왕릉",
		detail: "사진의 벽돌 질감을 입힌 무덤 내부 · 안이 보이도록 천장과 벽 일부를 열었어요.",
		image: "muryeong-tomb.jpg"
	},
	{
		id: 2,
		key: "samguk-incense-v1",
		name: "백제 금동대향로",
		detail: "금동 표면, 용 받침, 겹친 연꽃과 산봉우리, 날개를 편 봉황을 살펴봐요.",
		image: "baekje-incense-burner.jpg"
	},
	{
		id: 3,
		key: "samguk-cheomseongdae-v1",
		name: "첨성대",
		detail: "층층이 쌓은 돌, 가운데 창과 꼭대기 돌",
		image: "cheomseongdae.jpg"
	},
	{
		id: 4,
		key: "samguk-crown-v1",
		name: "신라 금관",
		detail: "얇은 금판, 나뭇가지와 사슴뿔 장식, 곡옥과 길게 늘어진 드리개를 살펴봐요.",
		image: "silla-crown.jpg"
	},
	{
		id: 5,
		key: "samguk-mural-v1",
		name: "고구려 고분벽화",
		detail: "실제 벽화 사진을 굴곡이 있는 벽면에 입힌 무덤 내부 재현이에요.",
		image: "goguryeo-mural.jpg"
	},
	{
		id: 6,
		key: "samguk-gaya-v1",
		name: "가야 고분군",
		detail: "사진의 잔디 질감을 입힌 봉분과 완만한 지형을 돌려 봐요.",
		image: "gaya-tombs.jpg"
	}
];
var preparedHeritage = (key) => preparedHeritages.find((item) => item.key === key);
var short = (v, max) => typeof v === "string" && v.length <= max;
var vector = (v, length, min, max) => Array.isArray(v) && v.length === length && v.every((n) => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max);
function isAudioData(value) {
	return short(value, Math.ceil(2e5) * 4 + 100) && /^data:audio\/(mp4|webm|ogg|wav|mpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
function isArExhibit(value) {
	if (!value || typeof value !== "object") return false;
	const ar = value;
	if (!Array.isArray(ar.points) || ar.points.length < 2 || ar.points.length > 4 || !short(ar.question, 300) || !short(ar.answerId, 40)) return false;
	if (!ar.points.every((point) => point && short(point.id, 40) && point.id.trim() && short(point.title, 80) && short(point.text, 1500) && vector(point.position, 3, -3, 3) && vector(point.photoPosition, 2, 0, 1) && (point.narration === void 0 || point.narration && isAudioData(point.narration.data) && typeof point.narration.seconds === "number" && point.narration.seconds > 0 && point.narration.seconds <= 31))) return false;
	if (new Set(ar.points.map((point) => point.id)).size !== ar.points.length || !ar.points.some((point) => point.id === ar.answerId)) return false;
	const model = ar.model;
	return model === void 0 || !!model && typeof model === "object" && short(model.name, 180) && short(model.credit, 300) && short(model.source, 2e3) && vector(model.rotation, 3, -360, 360) && (model.format === "preset" && model.asset === void 0 && model.data === "" && model.parts === void 0 && !!preparedHeritage(model.preset) || model.format === "primitives" && model.asset === void 0 && model.preset === void 0 && model.data === "" && validParts(model.parts) || model.asset === "cheomseongdae-nsm-2015" && model.preset === void 0 && model.format === "obj" && model.data === "" || model.asset === void 0 && model.preset === void 0 && ["glb", "stl"].includes(model.format) && short(model.data, Math.ceil(4e6) * 4 + 100) && /^data:application\/octet-stream;base64,[A-Za-z0-9+/]+={0,2}$/.test(model.data));
}
//#endregion
//#region src/features/ar-studio/project.ts
function isStudioProject(v) {
	if (!v || typeof v !== "object") return false;
	const p = v;
	return p.version === 1 && Number.isInteger(p.group) && p.group >= 1 && p.group <= 6 && Number.isInteger(p.heritageId) && p.heritageId >= 1 && p.heritageId <= 6 && typeof p.modelChecked === "boolean" && typeof p.pointsChecked === "boolean" && typeof p.role === "string" && p.role.length <= 300 && typeof p.reflection === "string" && p.reflection.length <= 1e3 && isArExhibit(p.ar) && (p.ar.model?.format === "primitives" || p.ar.model?.format === "preset" && preparedHeritage(p.ar.model.preset)?.id === p.heritageId || p.ar.model?.asset === "cheomseongdae-nsm-2015" && p.heritageId === 3) && p.ar.points.length >= 3 && Array.isArray(p.questions) && p.questions.length >= 2 && p.questions.length <= 3 && new Set(p.questions.map((q) => q?.id)).size === p.questions.length && p.questions.every((q) => q && typeof q.id === "string" && q.id.length > 0 && q.id.length <= 60 && typeof q.prompt === "string" && q.prompt.length <= 300 && Array.isArray(q.options) && q.options.length === 3 && q.options.every((o) => typeof o === "string" && o.length <= 150) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 2 && p.ar.points.some((point) => point.id === q.pointId));
}
//#endregion
//#region src/content/three-kingdoms/arModels.ts
function cheomseongdaeModel() {
	return {
		asset: "cheomseongdae-nsm-2015",
		format: "obj",
		data: "",
		name: "국립중앙과학관 신라첨성대 · 공식 3D 원본",
		credit: "국립중앙과학관 · 신라첨성대(2015) · 공공누리 제3유형(출처표시·변경금지)",
		source: "https://col.science.go.kr/web/MetaDetail.do?menuIdx=480&metaId=meta_000002989",
		rotation: [
			-90,
			0,
			0
		]
	};
}
//#endregion
//#region src/server/arShared.ts
var MAX_BODY = 42e5;
var CODE = /^[a-z0-9]{4,12}$/;
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
	if (Number(request.headers.get("content-length")) > MAX_BODY) throw new RequestError(413, "작품은 4MB 이하, 녹음은 각각 30초 이내로 준비해 주세요.");
	const reader = request.body?.getReader();
	const chunks = [];
	let size = 0;
	if (!reader) throw new RequestError(400, "입력 내용을 확인해 주세요.");
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		size += value.length;
		if (size > MAX_BODY) {
			await reader.cancel();
			throw new RequestError(413, "작품은 4MB 이하, 녹음은 각각 30초 이내로 준비해 주세요.");
		}
		chunks.push(value);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	chunks.forEach((chunk) => {
		bytes.set(chunk, offset);
		offset += chunk.length;
	});
	try {
		const value = JSON.parse(new TextDecoder().decode(bytes));
		if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
		return value;
	} catch {
		throw new RequestError(400, "입력 내용을 확인해 주세요.");
	}
}
async function hash(token) {
	return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), (n) => n.toString(16).padStart(2, "0")).join("");
}
function createArSharedHandler(config) {
	const fetcher = config.fetch || fetch;
	const joins = /* @__PURE__ */ new Map();
	const numericRequests = /* @__PURE__ */ new Map();
	async function rpc(name, payload) {
		const response = await fetcher(`${config.url}/rest/v1/rpc/${name}`, {
			method: "POST",
			signal: AbortSignal.timeout(2e4),
			headers: {
				"Content-Type": "application/json",
				apikey: config.key,
				Authorization: `Bearer ${config.key}`
			},
			body: JSON.stringify(payload)
		});
		if (!response.ok) throw new RequestError(503, "공유 서버에 연결하지 못했어요. 현재 작업은 그대로 두고 다시 시도해 주세요.");
		const value = await response.json();
		if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError(503, "공유 서버 응답을 확인하지 못했어요.");
		return value;
	}
	async function numericRoom(code, request) {
		const key = request.headers.get("x-forwarded-for") || "shared", now = Date.now();
		if (numericRequests.size > 1e3) numericRequests.clear();
		const limit = numericRequests.get(key);
		if (limit && now - limit.start < 6e4) {
			if (++limit.count > 180) throw new RequestError(429, "수업코드 저장 요청이 많아요. 잠시 뒤 다시 시도해 주세요.");
		} else numericRequests.set(key, {
			start: now,
			count: 1
		});
		return rpc("history_ar_create_numeric_room", { p_code: code });
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
			const url = new URL(request.url);
			const path = url.pathname.replace(/^.*\/(?:history-ar|api\/ar-studio)/, "") || "/";
			if (path === "/health" && request.method === "GET") return json({
				status: config.url && config.key ? "ready" : "unconfigured",
				mode: "shared"
			}, config.url && config.key ? 200 : 503, origin);
			if (!["GET", "POST"].includes(request.method)) throw new RequestError(405, "지원하지 않는 요청입니다.");
			if (!config.url || !config.key) throw new RequestError(503, "공유 저장 서버 연결을 확인해 주세요.");
			const input = request.method === "POST" ? await readBody(request) : {};
			if (path === "/classrooms" && request.method === "POST") {
				const number = typeof input.code === "string" ? input.code.trim() : "";
				if (!/^[0-9]{4,12}$/.test(number)) throw new RequestError(400, "숫자 수업코드는 4~12자리로 입력해 주세요.");
				const { _status, ...result } = await numericRoom(number, request);
				return json(result, _status || 200, origin);
			}
			let action = "";
			let code = "";
			let token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1] || "";
			const payload = {};
			const joining = path === "/join" && request.method === "POST";
			if (joining) {
				code = typeof input.code === "string" ? input.code.trim().toLowerCase() : "";
				if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 30 || !Number.isInteger(input.group) || Number(input.group) < 1 || Number(input.group) > 6) throw new RequestError(400, "이름과 1~6모둠 중 내 모둠을 확인해 주세요.");
				const now = Date.now();
				const key = `${code}:${request.headers.get("x-forwarded-for") || "shared"}`;
				if (joins.size > 1e3) joins.clear();
				const limit = joins.get(key);
				if (limit && now - limit.start < 6e4) {
					if (++limit.count > 90) throw new RequestError(429, "입장 요청이 많아요. 잠시 뒤 다시 시도해 주세요.");
				} else joins.set(key, {
					start: now,
					count: 1
				});
				token = Array.from(crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32)), (n) => n.toString(16).padStart(2, "0")).join("");
				action = "join";
				payload.name = input.name.trim();
				payload.group = input.group;
			} else {
				const match = path.match(/^\/rooms\/([a-z0-9]{4,12})(?:\/(.*))?$/);
				if (!match) throw new RequestError(404, "수업허브에서 수업을 열고 참여 코드로 입장해 주세요.");
				code = match[1];
				const tail = match[2] || "";
				if (!TOKEN.test(token)) throw new RequestError(401, "수업코드로 먼저 입장해 주세요.");
				if (!tail && request.method === "GET") action = "room";
				else if (tail === "answers") {
					action = request.method === "GET" ? "answers-get" : "answers-save";
					if (request.method === "POST") Object.assign(payload, {
						answers: input.answers,
						role: input.role,
						reflection: input.reflection,
						questionVersion: input.questionVersion
					});
				} else {
					const work = tail.match(/^works\/([1-6])$/);
					if (!work) throw new RequestError(403, "수업 열기·마감은 기존 수업허브에서 관리해 주세요.");
					payload.group = Number(work[1]);
					action = request.method === "GET" ? url.searchParams.get("draft") === "1" ? "draft-get" : "work-get" : "work-save";
					if (request.method === "POST") {
						if (!isStudioProject(input.project) || input.project.group !== payload.group || !Number.isInteger(input.expectedVersion) || Number(input.expectedVersion) < 0) throw new RequestError(400, "작품 형식과 저장본 번호를 확인해 주세요.");
						const project = input.project;
						if (project.ar.model?.asset === "cheomseongdae-nsm-2015") {
							const original = cheomseongdaeModel();
							project.ar.model = {
								...original,
								rotation: project.ar.model.rotation
							};
						}
						payload.project = project;
						payload.expectedVersion = input.expectedVersion;
						payload.questions = project.questions.filter((q) => q.prompt.trim() && q.options.every((o) => o.trim()) && new Set(q.options.map((o) => o.trim())).size === 3);
					}
				}
			}
			if (!CODE.test(code)) throw new RequestError(400, "수업코드는 영문과 숫자 4~12자로 입력해 주세요.");
			if (joining && /^[0-9]{4,12}$/.test(code)) {
				const { _status, ...result } = await numericRoom(code, request);
				if (_status) return json(result, _status, origin);
			}
			const { _status, ...result } = await rpc("history_ar_dispatch", {
				p_action: action,
				p_code: code,
				p_token_hash: await hash(token),
				p_payload: payload
			});
			return json(joining && !_status ? {
				...result,
				token
			} : result, _status || 200, origin);
		} catch (error) {
			return json({ error: error instanceof RequestError ? error.message : "공유 저장을 완료하지 못했어요. 현재 작업을 보관하고 다시 시도해 주세요." }, error instanceof RequestError ? error.status : 503, origin);
		}
	};
}
//#endregion
export { createArSharedHandler };
