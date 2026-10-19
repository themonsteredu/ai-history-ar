import type { ReactNode } from 'react';

/** Hand-drawn learning illustrations (not photographs), so every tablet can show and tap them offline. */
const ink = '#3b2f28', bronze = '#8a6a43', bronzeLight = '#b8935e', stone = '#c9c0b0', stoneDark = '#a59c8c', wood = '#9c6b45', paper = '#efe3c8';

const drawings: Record<number, ReactNode> = {
  1: <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round">
    <rect x="120" y="190" width="160" height="80" rx="4" fill={stone} />
    <path d="M120 190 L140 175 H260 L280 190 Z" fill={stoneDark} />
    <path d="M135 210 H265 M135 250 H265" stroke={stoneDark} fill="none" />
    <rect x="165" y="60" width="70" height="118" rx="6" fill={bronze} />
    <ellipse cx="200" cy="60" rx="35" ry="9" fill="#5b4a38" />
    <path d="M165 98 H235 M165 138 H235" stroke={bronzeLight} strokeWidth="5" />
    <rect x="300" y="70" width="14" height="140" fill={wood} />
    <path d="M300 90 h8 M300 110 h8 M300 130 h8 M300 150 h8 M300 170 h8 M300 190 h8" stroke={paper} strokeWidth="2" />
    <path d="M60 40 l-6 14 M85 30 l-6 14 M110 44 l-6 14 M330 34 l-6 14 M355 46 l-6 14" stroke="#6f8fb0" strokeWidth="3" strokeLinecap="round" />
  </g>,
  2: <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round">
    <rect x="40" y="200" width="220" height="16" fill={wood} />
    <rect x="50" y="100" width="12" height="100" fill={wood} /><rect x="120" y="140" width="12" height="60" fill={wood} />
    <path d="M30 60 Q30 100 56 100 Q82 100 82 60 Z" fill={bronze} /><ellipse cx="56" cy="60" rx="26" ry="7" fill="#5b4a38" />
    <path d="M100 110 Q100 140 126 140 Q152 140 152 110 Z" fill={bronze} /><ellipse cx="126" cy="110" rx="26" ry="7" fill="#5b4a38" />
    <path d="M82 92 Q92 96 100 116 M152 132 Q166 138 176 150" stroke="#6f8fb0" strokeWidth="4" fill="none" />
    <rect x="176" y="80" width="40" height="120" rx="4" fill={bronzeLight} />
    <rect x="192" y="40" width="8" height="60" fill={wood} />
    <rect x="270" y="70" width="110" height="146" rx="4" fill={wood} />
    <rect x="282" y="84" width="86" height="34" fill={paper} />
    <circle cx="300" cy="101" r="10" fill="#c49744" /><rect x="318" y="92" width="18" height="18" fill="#a94b36" /><circle cx="352" cy="101" r="10" fill="#56615d" />
    <circle cx="300" cy="150" r="9" fill={paper} /><path d="M291 182 Q300 162 309 182 Z" fill={paper} />
    <circle cx="350" cy="150" r="9" fill={paper} /><path d="M341 182 Q350 162 359 182 Z" fill={paper} />
    <path d="M216 100 H270" stroke={ink} strokeDasharray="6 5" fill="none" />
  </g>,
  3: <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" fill="none">
    <rect x="60" y="230" width="280" height="30" rx="3" fill={stone} />
    <path d="M70 245 H330" stroke="#6f8fb0" strokeWidth="3" />
    <rect x="110" y="150" width="14" height="80" fill={bronze} /><rect x="276" y="150" width="14" height="80" fill={bronze} />
    <circle cx="200" cy="140" r="86" stroke={bronze} strokeWidth="10" />
    <ellipse cx="200" cy="150" rx="96" ry="30" stroke={bronzeLight} strokeWidth="8" transform="rotate(-20 200 150)" />
    <path d="M130 200 L270 80" stroke={ink} strokeWidth="9" strokeLinecap="round" />
    <circle cx="270" cy="80" r="8" fill={paper} />
    <path d="M335 40 l4 9 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#c49744" stroke="none" />
  </g>,
  4: <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M150 230 L130 270 M250 230 L270 270 M200 236 V272" stroke={bronze} strokeWidth="9" strokeLinecap="round" />
    <rect x="110" y="266" width="180" height="12" rx="3" fill={stone} />
    <path d="M80 110 Q80 240 200 240 Q320 240 320 110 Z" fill={bronze} />
    <ellipse cx="200" cy="110" rx="120" ry="34" fill="#e9dcc0" />
    <g stroke={bronze} strokeWidth="1.5" fill="none">
      <path d="M110 108 Q200 140 290 108 M98 112 Q200 152 302 112 M126 104 Q200 126 274 104" />
      <path d="M140 84 Q150 110 146 140 M170 78 Q176 110 172 144 M200 76 V146 M230 78 Q224 110 228 144 M260 84 Q250 110 254 140" />
    </g>
    <path d="M200 110 L262 84" stroke={ink} strokeWidth="5" strokeLinecap="round" />
    <path d="M200 110 L150 128" stroke="#56615d" strokeWidth="4" strokeOpacity=".45" strokeLinecap="round" />
    <circle cx="350" cy="44" r="18" fill="#e7b74a" stroke="none" />
  </g>,
  5: <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" fill="none">
    <path d="M140 270 L170 220 M260 270 L230 220" stroke={wood} strokeWidth="12" strokeLinecap="round" />
    <rect x="110" y="266" width="180" height="14" rx="3" fill={stone} />
    <circle cx="200" cy="140" r="92" stroke={bronze} strokeWidth="9" />
    <ellipse cx="200" cy="140" rx="92" ry="26" stroke={bronzeLight} strokeWidth="7" />
    <ellipse cx="200" cy="140" rx="92" ry="30" stroke={bronzeLight} strokeWidth="6" transform="rotate(-24 200 140)" />
    <ellipse cx="200" cy="140" rx="30" ry="92" stroke={bronze} strokeWidth="6" />
    <circle cx="200" cy="140" r="64" stroke={bronzeLight} strokeWidth="4" strokeDasharray="5 6" />
    <circle cx="200" cy="140" r="20" fill="#6f8fb0" />
    <path d="M108 140 H292" stroke={ink} strokeWidth="3" />
  </g>,
  6: <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M60 60 L196 76 V262 L60 246 Z" fill={paper} /><path d="M340 60 L204 76 V262 L340 246 Z" fill={paper} />
    <path d="M196 76 Q200 70 204 76 V262 Q200 268 196 262 Z" fill="#c9b78f" />
    <g stroke="#6b5a48" strokeWidth="2">
      <path d="M90 100 V220 M112 103 V222 M134 105 V224 M156 108 V227" />
      <path d="M240 108 V227 M262 105 V224 M284 103 V222 M306 100 V220" />
    </g>
    <rect x="300" y="64" width="26" height="70" fill="#f4ecd8" />
    <text x="313" y="82" textAnchor="middle" fontSize="13" fill={ink} stroke="none" fontFamily="serif">農</text>
    <text x="313" y="98" textAnchor="middle" fontSize="13" fill={ink} stroke="none" fontFamily="serif">事</text>
    <text x="313" y="114" textAnchor="middle" fontSize="13" fill={ink} stroke="none" fontFamily="serif">直</text>
    <text x="313" y="130" textAnchor="middle" fontSize="13" fill={ink} stroke="none" fontFamily="serif">說</text>
    <path d="M30 280 Q36 230 34 200 M34 228 Q20 214 18 196 M34 220 Q48 204 52 190 M370 280 Q364 230 366 200 M366 228 Q380 214 382 196 M366 220 Q352 204 348 190" stroke="#5d7d3f" strokeWidth="3" fill="none" />
    <ellipse cx="18" cy="192" rx="5" ry="9" fill="#d6b24f" /><ellipse cx="52" cy="186" rx="5" ry="9" fill="#d6b24f" />
    <ellipse cx="382" cy="192" rx="5" ry="9" fill="#d6b24f" /><ellipse cx="348" cy="186" rx="5" ry="9" fill="#d6b24f" />
  </g>,
};

export function ArtifactArt({ id, title }: { id: number; title?: string }) {
  return <svg className="oc-art" viewBox="0 0 400 300" role="img" aria-label={title ? `${title} 학습용 그림` : '유물 학습용 그림'} preserveAspectRatio="xMidYMid meet">
    <rect width="400" height="300" fill="#f6efe1" />
    {drawings[id] || <text x="200" y="155" textAnchor="middle" fontSize="18" fill="#8a7f72">유물을 골라 주세요</text>}
  </svg>;
}
