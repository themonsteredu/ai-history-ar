interface ExternalToolFrameProps {
  title: string;
  url: string;
  onClose: () => void;
}

export function ExternalToolFrame({ title, url, onClose }: ExternalToolFrameProps) {
  return (
    <section aria-label={`${title} 실행 화면`} className="external-tool-frame">
      <header>
        <div>
          <span>이 화면 안에서 실행 중</span>
          <strong>{title}</strong>
        </div>
        <div>
          <a href={url} rel="noreferrer" target="_blank">새 탭으로 열기 ↗</a>
          <button onClick={onClose} type="button">화면 닫기</button>
        </div>
      </header>
      <iframe
        allow="clipboard-read; clipboard-write; fullscreen"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        src={url}
        title={`${title} 외부 도구`}
      />
      <p>화면이 열리지 않으면 위의 ‘새 탭으로 열기’를 누르세요.</p>
    </section>
  );
}
