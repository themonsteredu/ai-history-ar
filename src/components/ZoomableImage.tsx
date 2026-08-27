import { useEffect, useState } from "react";

interface ZoomableImageProps {
  alt: string;
  caption?: string;
  className?: string;
  src: string;
  title: string;
}

export function ZoomableImage({ alt, caption, className, src, title }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openViewer() {
    setZoom(1);
    setOpen(true);
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`${title} 사진 크게 보기`}
        className={className ? `zoomable-image ${className}` : "zoomable-image"}
        onClick={openViewer}
        type="button"
      >
        <img alt={alt} src={src} />
        <span aria-hidden="true">＋ 크게 보기</span>
      </button>

      {open ? (
        <div
          aria-label={`${title} 사진 확대 보기`}
          aria-modal="true"
          className="heritage-image-viewer"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          role="dialog"
        >
          <div className="heritage-image-viewer__panel">
            <header>
              <div><span>{caption ?? "문화유산 사진"}</span><strong>{title}</strong></div>
              <div className="heritage-image-viewer__controls" role="group" aria-label="사진 확대 조절">
                <button aria-label="사진 축소" disabled={zoom <= 1} onClick={() => setZoom((current) => Math.max(1, current - 0.25))} type="button">−</button>
                <output aria-live="polite">{Math.round(zoom * 100)}%</output>
                <button aria-label="사진 확대" disabled={zoom >= 3} onClick={() => setZoom((current) => Math.min(3, current + 0.25))} type="button">＋</button>
                <button onClick={() => setZoom(1)} type="button">원래 크기</button>
                <button className="heritage-image-viewer__close" onClick={() => setOpen(false)} type="button">닫기 ×</button>
              </div>
            </header>
            <div className="heritage-image-viewer__canvas">
              <div className="heritage-image-viewer__stage" style={{ height: `${zoom * 100}%`, width: `${zoom * 100}%` }}>
                <img alt={`${title} 확대 사진`} draggable="false" src={src} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
