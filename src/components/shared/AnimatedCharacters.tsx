import { useEffect, useRef, useState } from 'react'

export type CharacterMood = 'login' | 'register'

export interface AnimatedCharactersProps {
  mood: CharacterMood
  compact?: boolean
}

export function AnimatedCharacters({ mood, compact = false }: AnimatedCharactersProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const timeRef = useRef(0)
  const animationRef = useRef<number>(0)
  const [, setFrame] = useState(0)
  const [cursor, setCursor] = useState({ x: 150, y: 170 })

  useEffect(() => {
    function animate() {
      timeRef.current += 0.02
      setFrame((value) => value + 1)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [])

  useEffect(() => {
    function handleMove(event: MouseEvent | TouchEvent) {
      const svg = svgRef.current
      if (!svg) {
        return
      }

      const rect = svg.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        return
      }

      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

      setCursor({
        x: (clientX - rect.left) * (300 / rect.width),
        y: (clientY - rect.top) * (340 / rect.height),
      })
    }

    window.addEventListener('mousemove', handleMove as EventListener)
    window.addEventListener('touchmove', handleMove as EventListener, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMove as EventListener)
      window.removeEventListener('touchmove', handleMove as EventListener)
    }
  }, [])

  function getPupilOffset(eyeX: number, eyeY: number) {
    const dx = cursor.x - eyeX
    const dy = cursor.y - eyeY
    const distance = Math.sqrt(dx * dx + dy * dy) || 1
    const normalizedDistance = Math.min(distance, 40) / 40

    return {
      px: (dx / distance) * 2.2 * normalizedDistance,
      py: (dy / distance) * 2.2 * normalizedDistance,
    }
  }

  function bob(offset: number, amplitude = 4) {
    return Math.sin(timeRef.current + offset) * amplitude
  }

  function sway(offset: number, amplitude = 2) {
    return Math.sin(timeRef.current * 0.7 + offset) * amplitude
  }

  if (compact) {
    const orangeX = 10 + sway(0)
    const orangeY = 48 + bob(0, 3)
    const purpleX = 65 + sway(1)
    const purpleY = 6 + bob(1, 2)
    const blackX = 130 + sway(2)
    const blackY = 26 + bob(2, 4)
    const yellowX = 185 + sway(3, 2)
    const yellowY = 44 + bob(3, 4)

    const orangeEye1 = getPupilOffset(orangeX + 18, orangeY + 28)
    const orangeEye2 = getPupilOffset(orangeX + 38, orangeY + 28)
    const purpleEye1 = getPupilOffset(purpleX + 18, purpleY + 38)
    const purpleEye2 = getPupilOffset(purpleX + 34, purpleY + 38)
    const blackEye1 = getPupilOffset(blackX + 11, blackY + 28)
    const blackEye2 = getPupilOffset(blackX + 24, blackY + 28)
    const yellowEye1 = getPupilOffset(yellowX + 9, yellowY + 18)
    const yellowEye2 = getPupilOffset(yellowX + 20, yellowY + 18)

    return (
      <svg
        ref={svgRef}
        className="block h-full w-full"
        viewBox="0 0 240 124"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={`translate(${orangeX},${orangeY})`}>
          <ellipse cx="28" cy="30" rx="28" ry="27" fill="#F97316" />
          <circle cx="18" cy="26" r="4" fill="#1A1A1A" />
          <circle cx="38" cy="26" r="4" fill="#1A1A1A" />
          <circle cx={18 + orangeEye1.px} cy={26 + orangeEye1.py} r="1.5" fill="white" />
          <circle cx={38 + orangeEye2.px} cy={26 + orangeEye2.py} r="1.5" fill="white" />
          <path
            d="M18 35 Q28 42 38 35"
            fill="none"
            stroke="#1A1A1A"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </g>

        <g transform={`translate(${purpleX},${purpleY})`}>
          <rect width="46" height="90" rx="10" fill="#7B2FBE" />
          <circle cx="15" cy="38" r="5" fill="#1A1A1A" />
          <circle cx="31" cy="38" r="5" fill="#1A1A1A" />
          <circle cx={15 + purpleEye1.px} cy={38 + purpleEye1.py} r="2" fill="white" />
          <circle cx={31 + purpleEye2.px} cy={38 + purpleEye2.py} r="2" fill="white" />
          <path
            d={mood === 'login' ? 'M12 50 Q23 58 34 50' : 'M12 52 Q23 46 34 52'}
            fill="none"
            stroke="#1A1A1A"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </g>

        <g transform={`translate(${blackX},${blackY})`}>
          <rect width="34" height="75" rx="8" fill="#1A1A1A" />
          <circle cx="11" cy="28" r="4" fill="white" />
          <circle cx="23" cy="28" r="4" fill="white" />
          <circle cx={11 + blackEye1.px} cy={28 + blackEye1.py} r="1.5" fill="#1A1A1A" />
          <circle cx={23 + blackEye2.px} cy={28 + blackEye2.py} r="1.5" fill="#1A1A1A" />
          <path
            d="M9 38 Q17 43 25 38"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </g>

        <g transform={`translate(${yellowX},${yellowY})`}>
          <rect width="30" height="52" rx="7" fill="#F5A623" />
          <circle cx="9" cy="18" r="4" fill="#1A1A1A" />
          <circle cx="21" cy="18" r="4" fill="#1A1A1A" />
          <circle cx={9 + yellowEye1.px} cy={18 + yellowEye1.py} r="1.5" fill="white" />
          <circle cx={21 + yellowEye2.px} cy={18 + yellowEye2.py} r="1.5" fill="white" />
          <ellipse cx="15" cy="28" rx="5" ry="3" fill="#D97706" />
          <path d="M10 28 L15 32 L20 28" fill="#B45309" />
        </g>
      </svg>
    )
  }

  const orangeX = 40 + sway(0)
  const orangeY = 200 + bob(0, 5)
  const purpleX = 90 + sway(1)
  const purpleY = 60 + bob(1, 3)
  const blackX = 155 + sway(2)
  const blackY = 110 + bob(2, 6)
  const yellowX = 198 + sway(3, 3)
  const yellowY = 190 + bob(3, 7)

  const orangeEye1 = getPupilOffset(orangeX + 32, orangeY + 48)
  const orangeEye2 = getPupilOffset(orangeX + 68, orangeY + 48)
  const purpleEye1 = getPupilOffset(purpleX + 26, purpleY + 65)
  const purpleEye2 = getPupilOffset(purpleX + 52, purpleY + 65)
  const blackEye1 = getPupilOffset(blackX + 18, blackY + 48)
  const blackEye2 = getPupilOffset(blackX + 40, blackY + 48)
  const yellowEye1 = getPupilOffset(yellowX + 16, yellowY + 32)
  const yellowEye2 = getPupilOffset(yellowX + 34, yellowY + 32)

  return (
    <svg
      ref={svgRef}
      className="block h-full w-full"
      viewBox="0 0 300 340"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={`translate(${orangeX},${orangeY})`}>
        <ellipse cx="50" cy="55" rx="52" ry="50" fill="#F97316" />
        <circle cx="32" cy="48" r="5" fill="#1A1A1A" />
        <circle cx="68" cy="48" r="5" fill="#1A1A1A" />
        <circle cx={32 + orangeEye1.px} cy={48 + orangeEye1.py} r="2" fill="white" />
        <circle cx={68 + orangeEye2.px} cy={48 + orangeEye2.py} r="2" fill="white" />
        <path
          d="M35 62 Q50 74 65 62"
          fill="none"
          stroke="#1A1A1A"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <ellipse cx="24" cy="56" rx="7" ry="4" fill="#FB923C" opacity="0.6" />
        <ellipse cx="76" cy="56" rx="7" ry="4" fill="#FB923C" opacity="0.6" />
      </g>

      <g transform={`translate(${purpleX},${purpleY})`}>
        <rect width="78" height="160" rx="16" fill="#7B2FBE" />
        <circle cx="26" cy="65" r="7" fill="#1A1A1A" />
        <circle cx="52" cy="65" r="7" fill="#1A1A1A" />
        <circle cx={26 + purpleEye1.px} cy={65 + purpleEye1.py} r="3" fill="white" />
        <circle cx={52 + purpleEye2.px} cy={65 + purpleEye2.py} r="3" fill="white" />
        <path
          d={mood === 'login' ? 'M22 82 Q39 94 56 82' : 'M22 85 Q39 78 56 85'}
          fill="none"
          stroke="#1A1A1A"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </g>

      <g transform={`translate(${blackX},${blackY})`}>
        <rect width="58" height="130" rx="12" fill="#1A1A1A" />
        <circle cx="18" cy="48" r="5" fill="white" />
        <circle cx="40" cy="48" r="5" fill="white" />
        <circle cx={18 + blackEye1.px} cy={48 + blackEye1.py} r="2" fill="#1A1A1A" />
        <circle cx={40 + blackEye2.px} cy={48 + blackEye2.py} r="2" fill="#1A1A1A" />
        <path
          d="M16 64 Q29 70 42 64"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </g>

      <g transform={`translate(${yellowX},${yellowY})`}>
        <rect width="50" height="90" rx="10" fill="#F5A623" />
        <circle cx="16" cy="32" r="5" fill="#1A1A1A" />
        <circle cx="34" cy="32" r="5" fill="#1A1A1A" />
        <circle cx={16 + yellowEye1.px} cy={32 + yellowEye1.py} r="2" fill="white" />
        <circle cx={34 + yellowEye2.px} cy={32 + yellowEye2.py} r="2" fill="white" />
        <ellipse cx="25" cy="46" rx="7" ry="4" fill="#CA8A04" />
        <path d="M18 46 L25 50 L32 46" fill="#B45309" />
      </g>

      <circle
        cx={20 + Math.sin(timeRef.current * 0.5) * 5}
        cy={80 + Math.cos(timeRef.current * 0.4) * 5}
        fill="#7B2FBE"
        opacity="0.3"
        r="5"
      />
      <circle
        cx={260 + Math.sin(timeRef.current * 0.6 + 1) * 4}
        cy={150 + Math.cos(timeRef.current * 0.5) * 6}
        fill="#E8601A"
        opacity="0.4"
        r="4"
      />
      <circle
        cx={140 + Math.sin(timeRef.current * 0.3 + 2) * 6}
        cy={30 + Math.cos(timeRef.current * 0.4 + 1) * 4}
        fill="#F5A623"
        opacity="0.5"
        r="3"
      />
    </svg>
  )
}

export default AnimatedCharacters
