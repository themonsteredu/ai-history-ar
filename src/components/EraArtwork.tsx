import type { EraId } from "../types/curriculum";

interface EraArtworkProps {
  eraId: EraId;
  compact?: boolean;
}

export function EraArtwork({ eraId, compact = false }: EraArtworkProps) {
  return (
    <picture
      aria-hidden="true"
      className={`era-artwork era-artwork--${eraId}${compact ? " era-artwork--compact" : ""}`}
    >
      <img
        alt=""
        decoding="async"
        height="1536"
        loading={compact ? "eager" : "lazy"}
        src={`/images/${eraId}-cover.webp`}
        width="1536"
      />
    </picture>
  );
}
