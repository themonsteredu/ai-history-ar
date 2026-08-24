import { useEffect, useRef, useState } from "react";
import { heritageResearchCases } from "../content/three-kingdoms/webActivities";

const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;
const targetFile = `${import.meta.env.BASE_URL}ar/three-kingdoms-targets.mind`;

type ArStatus = "idle" | "loading" | "scanning" | "found" | "lost" | "error" | "fallback";

interface RunningAr {
  started: boolean;
  stop: () => void;
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

export default function TrackedHeritageAr() {
  const [selectedId, setSelectedId] = useState(1);
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
      const running: RunningAr = { started: false, stop: () => mindarThree.stop(), renderer };
      runningRef.current = running;

      const anchor = mindarThree.addAnchor(selectedId - 1);
      const ringGeometry = new THREE.RingGeometry(0.38, 0.48, 48);
      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xf0c66e, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.z = 0.05;

      const markerGeometry = new THREE.ConeGeometry(0.11, 0.28, 4);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xb53b31, transparent: true, opacity: 0.95 });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, 0.05, 0.22);
      marker.rotation.x = Math.PI / 2;

      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 1024;
      labelCanvas.height = 320;
      const context = labelCanvas.getContext("2d");
      if (context) {
        context.fillStyle = "rgba(17, 39, 32, 0.92)";
        context.fillRect(12, 12, 1000, 296);
        context.fillStyle = "#f0c66e";
        context.font = '700 44px "S-Core Dream", sans-serif';
        context.fillText(`${selectedCase.category} 문화유산`, 62, 94);
        context.fillStyle = "#ffffff";
        context.font = '900 78px "S-Core Dream", sans-serif';
        context.fillText(selectedCase.heritage, 62, 210);
      }
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.36), labelMaterial);
      label.position.set(0, 0.76, 0.12);

      anchor.group.add(ring, marker, label);
      anchor.onTargetFound = () => setStatus("found");
      anchor.onTargetLost = () => setStatus("lost");

      await mindarThree.start();
      running.started = true;
      setStatus("scanning");
      renderer.setAnimationLoop(() => {
        ring.rotation.z += 0.012;
        marker.rotation.z -= 0.015;
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
      <div aria-label="AR로 볼 문화유산 선택" className="ar-target-picker" role="group">
        {heritageResearchCases.map((item) => (
          <button aria-pressed={selectedId === item.id} key={item.id} onClick={() => chooseTarget(item.id)} type="button">
            <img alt="" src={`${imageRoot}/${item.image}`} />
            <span>{item.heritage}</span>
          </button>
        ))}
      </div>

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
            <div className="ar-fallback-marker"><i /><strong>{selectedCase.heritage}</strong><span>AR 핵심 지점</span></div>
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
          <div><strong>자료로 확인</strong><p>{confirmedFact?.text}</p></div>
          <div className="is-caution"><strong>아직 단정하지 않기</strong><p>{cautionFact?.text}</p></div>
          <p className="ar-talk-prompt">모둠 질문: 확인된 사실과 아직 모르는 점은 무엇이 다른가요?</p>
        </section>
      ) : null}

      <p className="ar-privacy-note">카메라 권한은 ‘AR 시작’을 눌렀을 때만 요청합니다. 영상과 사진은 서버에 저장되지 않습니다.</p>
    </div>
  );
}
