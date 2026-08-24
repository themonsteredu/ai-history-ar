import type { EraId } from "../types/curriculum";

interface EraArtworkProps {
  eraId: EraId;
  compact?: boolean;
}

export function EraArtwork({ eraId, compact = false }: EraArtworkProps) {
  return (
    <div
      aria-hidden="true"
      className={`era-artwork era-artwork--${eraId}${compact ? " era-artwork--compact" : ""}`}
    >
      <div className="era-artwork__sun" />
      <div className="era-artwork__line era-artwork__line--one" />
      <div className="era-artwork__line era-artwork__line--two" />
      <div className="era-artwork__object">
        <span />
        <span />
        <span />
      </div>
      <div className="era-artwork__stamp">{eraId === "three-kingdoms" ? "三國" : "朝鮮"}</div>
    </div>
  );
}
