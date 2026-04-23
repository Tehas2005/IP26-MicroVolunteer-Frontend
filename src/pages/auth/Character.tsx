import { useEffect, useRef, useState } from 'react';

type AuthMode = 'login' | 'register';

interface CharactersProps {
  mode: AuthMode;
  compact?: boolean;
}

export default function Characters({ mode, compact }: CharactersProps) {
  const t = useRef(0);
  const rafRef = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [, forceRender] = useState(0);
  const [cursor, setCursor] = useState({ x: 150, y: 170 });

  useEffect(() => {
    function animate() {
      t.current += 0.02;
      forceRender(t.current);
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setCursor({
        x: (clientX - rect.left) * (300 / rect.width),
        y: (clientY - rect.top) * (340 / rect.height),
      });
    }
    window.addEventListener('mousemove', onMove as EventListener);
    window.addEventListener('touchmove', onMove as EventListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener('mousemove', onMove as EventListener);
      window.removeEventListener('touchmove', onMove as EventListener);
    };
  }, []);

  function getPupilOffset(eyeX: number, eyeY: number) {
    const dx = cursor.x - eyeX;
    const dy = cursor.y - eyeY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const d = Math.min(dist, 40) / 40;
    return { px: (dx / dist) * 2.2 * d, py: (dy / dist) * 2.2 * d };
  }

  const bob = (offset: number, amp = 4) => Math.sin(t.current + offset) * amp;
  const sway = (offset: number, amp = 2) =>
    Math.sin(t.current * 0.7 + offset) * amp;

  if (compact) {
    const oX = 10 + sway(0),
      oY = 60 + bob(0, 3);
    const pX = 65 + sway(1),
      pY = 10 + bob(1, 2);
    const bX = 130 + sway(2),
      bY = 30 + bob(2, 4);
    const yX = 185 + sway(3, 2),
      yY = 55 + bob(3, 4);

    const oE1 = getPupilOffset(oX + 18, oY + 28);
    const oE2 = getPupilOffset(oX + 38, oY + 28);
    const pE1 = getPupilOffset(pX + 18, pY + 38);
    const pE2 = getPupilOffset(pX + 34, pY + 38);
    const bE1 = getPupilOffset(bX + 11, bY + 28);
    const bE2 = getPupilOffset(bX + 24, bY + 28);
    const yE1 = getPupilOffset(yX + 9, yY + 18);
    const yE2 = getPupilOffset(yX + 20, yY + 18);

    return (
      <svg
        ref={svgRef}
        viewBox="0 0 240 110"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <g transform={`translate(${oX},${oY})`}>
          <ellipse cx="28" cy="30" rx="28" ry="27" fill="#F97316" />
          <circle cx="18" cy="26" r="4" fill="#1a1a1a" />
          <circle cx="38" cy="26" r="4" fill="#1a1a1a" />
          <circle cx={18 + oE1.px} cy={26 + oE1.py} r="1.5" fill="white" />
          <circle cx={38 + oE2.px} cy={26 + oE2.py} r="1.5" fill="white" />
          <path
            d="M18 35 Q28 42 38 35"
            stroke="#1a1a1a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g transform={`translate(${pX},${pY})`}>
          <rect width="46" height="90" rx="10" fill="#7C3AED" />
          <circle cx="15" cy="38" r="5" fill="#1a1a1a" />
          <circle cx="31" cy="38" r="5" fill="#1a1a1a" />
          <circle cx={15 + pE1.px} cy={38 + pE1.py} r="2" fill="white" />
          <circle cx={31 + pE2.px} cy={38 + pE2.py} r="2" fill="white" />
          <path
            d={mode === 'login' ? 'M12 50 Q23 58 34 50' : 'M12 52 Q23 46 34 52'}
            stroke="#1a1a1a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g transform={`translate(${bX},${bY})`}>
          <rect width="34" height="75" rx="8" fill="#1a1a1a" />
          <circle cx="11" cy="28" r="4" fill="white" />
          <circle cx="23" cy="28" r="4" fill="white" />
          <circle cx={11 + bE1.px} cy={28 + bE1.py} r="1.5" fill="#1a1a1a" />
          <circle cx={23 + bE2.px} cy={28 + bE2.py} r="1.5" fill="#1a1a1a" />
          <path
            d="M9 38 Q17 43 25 38"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g transform={`translate(${yX},${yY})`}>
          <rect width="30" height="52" rx="7" fill="#EAB308" />
          <circle cx="9" cy="18" r="4" fill="#1a1a1a" />
          <circle cx="21" cy="18" r="4" fill="#1a1a1a" />
          <circle cx={9 + yE1.px} cy={18 + yE1.py} r="1.5" fill="white" />
          <circle cx={21 + yE2.px} cy={18 + yE2.py} r="1.5" fill="white" />
          <ellipse cx="15" cy="28" rx="5" ry="3" fill="#ca8a04" />
          <path d="M10 28 L15 32 L20 28" fill="#b45309" />
        </g>
      </svg>
    );
  }

  const oX = 40 + sway(0),
    oY = 200 + bob(0, 5);
  const pX = 90 + sway(1),
    pY = 60 + bob(1, 3);
  const bX = 155 + sway(2),
    bY = 110 + bob(2, 6);
  const yX = 198 + sway(3, 3),
    yY = 190 + bob(3, 7);

  const oE1 = getPupilOffset(oX + 32, oY + 48);
  const oE2 = getPupilOffset(oX + 68, oY + 48);
  const pE1 = getPupilOffset(pX + 26, pY + 65);
  const pE2 = getPupilOffset(pX + 52, pY + 65);
  const bE1 = getPupilOffset(bX + 18, bY + 48);
  const bE2 = getPupilOffset(bX + 40, bY + 48);
  const yE1 = getPupilOffset(yX + 16, yY + 32);
  const yE2 = getPupilOffset(yX + 34, yY + 32);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 340"
      width="100%"
      height="100%"
      style={{ display: 'block' }}
    >
      <g transform={`translate(${oX},${oY})`}>
        <ellipse cx="50" cy="55" rx="52" ry="50" fill="#F97316" />
        <circle cx="32" cy="48" r="5" fill="#1a1a1a" />
        <circle cx="68" cy="48" r="5" fill="#1a1a1a" />
        <circle cx={32 + oE1.px} cy={48 + oE1.py} r="2" fill="white" />
        <circle cx={68 + oE2.px} cy={48 + oE2.py} r="2" fill="white" />
        <path
          d="M35 62 Q50 74 65 62"
          stroke="#1a1a1a"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="24" cy="56" rx="7" ry="4" fill="#fb923c" opacity="0.6" />
        <ellipse cx="76" cy="56" rx="7" ry="4" fill="#fb923c" opacity="0.6" />
      </g>
      <g transform={`translate(${pX},${pY})`}>
        <rect width="78" height="160" rx="16" fill="#7C3AED" />
        <circle cx="26" cy="65" r="7" fill="#1a1a1a" />
        <circle cx="52" cy="65" r="7" fill="#1a1a1a" />
        <circle cx={26 + pE1.px} cy={65 + pE1.py} r="3" fill="white" />
        <circle cx={52 + pE2.px} cy={65 + pE2.py} r="3" fill="white" />
        <path
          d={mode === 'login' ? 'M22 82 Q39 94 56 82' : 'M22 85 Q39 78 56 85'}
          stroke="#1a1a1a"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <g transform={`translate(${bX},${bY})`}>
        <rect width="58" height="130" rx="12" fill="#1a1a1a" />
        <circle cx="18" cy="48" r="5" fill="white" />
        <circle cx="40" cy="48" r="5" fill="white" />
        <circle cx={18 + bE1.px} cy={48 + bE1.py} r="2" fill="#1a1a1a" />
        <circle cx={40 + bE2.px} cy={48 + bE2.py} r="2" fill="#1a1a1a" />
        <path
          d="M16 64 Q29 70 42 64"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <g transform={`translate(${yX},${yY})`}>
        <rect width="50" height="90" rx="10" fill="#EAB308" />
        <circle cx="16" cy="32" r="5" fill="#1a1a1a" />
        <circle cx="34" cy="32" r="5" fill="#1a1a1a" />
        <circle cx={16 + yE1.px} cy={32 + yE1.py} r="2" fill="white" />
        <circle cx={34 + yE2.px} cy={32 + yE2.py} r="2" fill="white" />
        <ellipse cx="25" cy="46" rx="7" ry="4" fill="#ca8a04" />
        <path d="M18 46 L25 50 L32 46" fill="#b45309" />
      </g>
      <circle
        cx={20 + Math.sin(t.current * 0.5) * 5}
        cy={80 + Math.cos(t.current * 0.4) * 5}
        r="5"
        fill="#7C3AED"
        opacity="0.3"
      />
      <circle
        cx={260 + Math.sin(t.current * 0.6 + 1) * 4}
        cy={150 + Math.cos(t.current * 0.5) * 6}
        r="4"
        fill="#F97316"
        opacity="0.4"
      />
      <circle
        cx={140 + Math.sin(t.current * 0.3 + 2) * 6}
        cy={30 + Math.cos(t.current * 0.4 + 1) * 4}
        r="3"
        fill="#EAB308"
        opacity="0.5"
      />
    </svg>
  );
}
