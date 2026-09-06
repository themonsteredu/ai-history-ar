import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { heritageResearchCases } from "../content/three-kingdoms/webActivities";
import type { ArExhibit } from '../lib/ar/exhibit';

const ArExhibitViewer = lazy(() => import('./ArExhibitViewer'));

const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;
const targetFile = `${import.meta.env.BASE_URL}ar/three-kingdoms-targets.mind`;

type ArStatus = "idle" | "loading" | "scanning" | "found" | "lost" | "error" | "fallback";

interface RunningAr {
  started: boolean;
  stop: () => void;
  dispose: () => void;
  renderer: {
    dispose: () => void;
    setAnimationLoop: (callback: (() => void) | null) => void;
  };
}

function cameraErrorMessage(error: unknown) {
  if (!window.isSecureContext) return "카메라 AR은 HTTPS로 배포된 주소 또는 localhost에서 사용할 수 있습니다.";
  if (error instanceof DOMException && error.name === "NotAllowedError") return "카메라 사용이 차단되었습니다. 브라우저 주소창의 카메라 권한을 허용해 주세요.";
  if (error instanceof DOMException && error.name === "NotFoundError") return "사용할 수 있는 카메라를 찾지 못했습니다.";
  return "카메라를 시작하지 못했습니다. 아래 대체 체험으로 같은 내용을 확인할 수 있습니다.";
}

export default function TrackedHeritageAr(props: { heritageId?: number; explanation?: string; caution?: string; ar?: ArExhibit } = {}) {
  const heritage = heritageResearchCases.find(item => item.id === props.heritageId);
  if (props.ar && heritage) return <Suspense fallback={<p>입체 유물과 녹음을 준비해요…</p>}><ArExhibitViewer value={props.ar} heritage={heritage.heritage} heritageId={heritage.id} image={`${imageRoot}/${heritage.image}`} /></Suspense>;
  return <LegacyTrackedHeritageAr {...props} />;
}
function LegacyTrackedHeritageAr({ heritageId, explanation, caution }: { heritageId?: number; explanation?: string; caution?: string } = {}) {
  const [selectedId, setSelectedId] = useState(heritageId ?? 1);
  const [status, setStatus] = useState<ArStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef<RunningAr | null>(null);
  const selectedCase = heritageResearchCases[selectedId - 1];
  const confirmedFact = selectedCase.sources.flatMap((source) => source.facts).find((fact) => fact.kind === "confirmed");
  const cautionFact = selectedCase.sources.flatMap((source) => source.facts).find((fact) => fact.kind === "caution");

  function stopAr(nextStatus: ArStatus = "idle", updateStatus = true) {
    const running = runningRef.current;
    if (running) {
      running.renderer.setAnimationLoop(null);
      if (running.started) {
        try {
          running.stop();
        } catch {
          // 이미 닫힌 카메라는 다시 정지하지 않습니다.
        }
      }
      running.dispose();
      running.renderer.dispose();
      runningRef.current = null;
    }
    stageRef.current?.replaceChildren();
    if (updateStatus) setStatus(nextStatus);
  }

  useEffect(() => () => stopAr("idle", false), []);

  function chooseTarget(id: number) {
    if (runningRef.current) stopAr("idle");
    setSelectedId(id);
    setErrorMessage("");
    setStatus("idle");
  }

  async function startAr() {
    const container = stageRef.current;
    if (!container) return;
    stopAr("loading");
    setErrorMessage("");

    try {
      const [{ MindARThree }, THREE] = await Promise.all([
        import("mind-ar/dist/mindar-image-three.prod.js"),
        import("three"),
      ]);
      const mindarThree = new MindARThree({
        container,
        imageTargetSrc: targetFile,
        maxTrack: 1,
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no",
      });
      const { renderer, scene, camera } = mindarThree;
      const disposables: Array<{ dispose: () => void }> = [];
      const running: RunningAr = {
        started: false,
        stop: () => mindarThree.stop(),
        dispose: () => disposables.forEach((item) => item.dispose()),
        renderer,
      };
      runningRef.current = running;

      const anchor = mindarThree.addAnchor(selectedId - 1);
      const accentMaterial = new THREE.MeshBasicMaterial({ color: 0xe9c36d, transparent: true, opacity: 0.88 });
      const brickMaterial = new THREE.MeshBasicMaterial({ color: 0xa84a3b, transparent: true, opacity: 0.96 });
      disposables.push(accentMaterial, brickMaterial);

      const connectorGeometry = new THREE.BoxGeometry(0.012, 0.3, 0.012);
      const connector = new THREE.Mesh(connectorGeometry, accentMaterial);
      connector.position.set(0, 0.35, 0.1);
      disposables.push(connectorGeometry);

      const pinGeometry = new THREE.BoxGeometry(0.075, 0.075, 0.018);
      const pin = new THREE.Mesh(pinGeometry, brickMaterial);
      pin.position.set(0, 0.18, 0.11);
      pin.rotation.z = Math.PI / 4;
      disposables.push(pinGeometry);

      const bracketGeometry = new THREE.BoxGeometry(0.16, 0.018, 0.012);
      const bracketVerticalGeometry = new THREE.BoxGeometry(0.018, 0.16, 0.012);
      disposables.push(bracketGeometry, bracketVerticalGeometry);
      const bracketPositions = [
        [-0.42, 0.31, 1, -1],
        [0.42, 0.31, -1, -1],
        [-0.42, -0.31, 1, 1],
        [0.42, -0.31, -1, 1],
      ] as const;
      const brackets: unknown[] = [];
      for (const [x, y, horizontalDirection, verticalDirection] of bracketPositions) {
        const horizontal = new THREE.Mesh(bracketGeometry, accentMaterial);
        horizontal.position.set(x + horizontalDirection * 0.07, y, 0.06);
        const vertical = new THREE.Mesh(bracketVerticalGeometry, accentMaterial);
        vertical.position.set(x, y + verticalDirection * 0.07, 0.06);
        brackets.push(horizontal, vertical);
      }

      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 1280;
      labelCanvas.height = 420;
      const context = labelCanvas.getContext("2d");
      if (context) {
        context.fillStyle = "rgba(14, 38, 31, 0.96)";
        context.fillRect(24, 24, 1232, 372);
        context.fillStyle = "#a84a3b";
        context.fillRect(24, 24, 156, 372);
        context.fillStyle = "#e9c36d";
        context.fillRect(180, 24, 1076, 8);
        context.fillStyle = "#ffffff";
        context.font = '900 78px "S-Core Dream", sans-serif';
        context.textAlign = "center";
        context.fillText(String(selectedId).padStart(2, "0"), 102, 240);
        context.textAlign = "left";
        context.fillStyle = "#e9c36d";
        context.font = '700 36px "S-Core Dream", sans-serif';
        context.fillText(`유물 인식 완료  ·  ${selectedCase.category}`, 230, 115);
        context.fillStyle = "#ffffff";
        context.font = '900 86px "S-Core Dream", sans-serif';
        context.fillText(selectedCase.heritage, 230, 245);
        context.fillStyle = "rgba(255, 255, 255, 0.7)";
        context.font = '500 30px "S-Core Dream", sans-serif';
        context.fillText("AI & HISTORY · 근거로 확인하는 문화유산", 230, 322);
      }
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide });
      const labelGeometry = new THREE.PlaneGeometry(1.28, 0.42);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(0, 0.72, 0.12);
      disposables.push(labelTexture, labelMaterial, labelGeometry);

      anchor.group.add(...brackets, connector, pin, label);
      anchor.onTargetFound = () => setStatus("found");
      anchor.onTargetLost = () => setStatus("lost");

      await mindarThree.start();
      running.started = true;
      setStatus("scanning");
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    } catch (error) {
      stopAr("error");
      setErrorMessage(cameraErrorMessage(error));
    }
  }

  function openFallback() {
    stopAr("fallback");
    setErrorMessage("");
  }

  const statusCopy = {
    idle: "유산을 고른 뒤 카메라 AR을 시작하세요.",
    loading: "카메라와 인식 자료를 준비하고 있습니다…",
    scanning: `${selectedCase.heritage} 카드 전체가 네모 안에 들어오게 비춰 주세요.`,
    found: `${selectedCase.heritage} 카드를 찾았습니다!`,
    lost: "카드를 놓쳤습니다. 다시 네모 안에 맞춰 주세요.",
    error: errorMessage,
    fallback: "대체 체험 중입니다. 실제 수업에서는 카메라 인식 결과가 같은 위치에 나타납니다.",
  } as const;

  return (
    <div className="tracked-ar">
      {!heritageId && <div aria-label="AR로 볼 문화유산 선택" className="ar-target-picker" role="group">
        {heritageResearchCases.map((item) => (
          <button aria-pressed={selectedId === item.id} key={item.id} onClick={() => chooseTarget(item.id)} type="button">
            <img alt="" src={`${imageRoot}/${item.image}`} />
            <span>{item.heritage}</span>
          </button>
        ))}
      </div>}

      <section className="ar-control-bar">
        <div><span>선택한 표적 카드</span><strong>{selectedCase.heritage}</strong></div>
        <div>
          {status === "idle" || status === "error" || status === "fallback" ? <button className="button button--primary" onClick={startAr} type="button">카메라 AR 시작</button> : <button className="button button--outline" onClick={() => stopAr("idle")} type="button">카메라 끄기</button>}
          <button className="button button--outline" onClick={openFallback} type="button">카메라 없이 체험</button>
        </div>
      </section>

      <div className={status === "found" ? "ar-camera-stage is-found" : "ar-camera-stage"}>
        <div aria-label="카메라 AR 화면" className="ar-render-surface" ref={stageRef} />
        {status === "fallback" ? (
          <div className="ar-fallback-scene">
            <img alt={`${selectedCase.heritage} 대체 AR 체험`} src={`${imageRoot}/${selectedCase.image}`} />
            <div className="ar-fallback-marker">
              <span className="ar-fallback-marker__number">{String(selectedId).padStart(2, "0")}</span>
              <div>
                <span>유물 인식 완료 · {selectedCase.category}</span>
                <strong>{selectedCase.heritage}</strong>
                <small>AI &amp; HISTORY · 근거로 확인하는 문화유산</small>
              </div>
            </div>
          </div>
        ) : status === "idle" || status === "error" ? (
          <div className="ar-camera-placeholder">
            <img alt={`${selectedCase.heritage} 표적 카드`} src={`${imageRoot}/${selectedCase.image}`} />
            <div><span>인식할 카드</span><strong>{selectedCase.heritage}</strong><small>다른 화면이나 인쇄된 카드를 카메라에 비추세요.</small></div>
          </div>
        ) : null}
        <div className="ar-scan-frame" aria-hidden="true"><i /><i /><i /><i /></div>
        <p className={`ar-status ar-status--${status}`} role="status">{statusCopy[status]}</p>
      </div>

      {status === "found" || status === "fallback" ? (
        <section className="ar-learning-card" aria-live="polite">
          <span>카드 인식 뒤 확인하는 역사 정보</span>
          <h3>{selectedCase.heritage}</h3>
          <div><strong>{explanation ? '우리 모둠이 확인한 근거' : '자료로 확인'}</strong><p>{explanation || confirmedFact?.text}</p></div>
          <div className="is-caution"><strong>아직 단정하지 않기</strong><p>{caution || cautionFact?.text}</p></div>
          <p className="ar-talk-prompt">모둠 질문: 확인된 사실과 아직 모르는 점은 무엇이 다른가요?</p>
        </section>
      ) : null}

      <p className="ar-privacy-note">카메라 권한은 ‘AR 시작’을 눌렀을 때만 요청합니다. 영상과 사진은 서버에 저장되지 않습니다.</p>
    </div>
  );
}
