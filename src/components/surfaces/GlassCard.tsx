import { forwardRef } from 'react'
import { motion, type MotionProps } from 'framer-motion'

type Variant = 'default' | 'elevated' | 'subtle' | 'accent'

interface GlassCardProps extends MotionProps {
  variant?: Variant
  accentColor?: string
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  default: {
    background: 'rgba(13, 17, 23, 0.72)',
    backdropFilter: 'blur(14px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  elevated: {
    background: 'rgba(19, 24, 34, 0.88)',
    backdropFilter: 'blur(20px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  subtle: {
    background: 'rgba(13, 17, 23, 0.4)',
    backdropFilter: 'blur(8px) saturate(140%)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  accent: {
    background: 'rgba(13, 17, 23, 0.72)',
    backdropFilter: 'blur(14px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'default', accentColor, className = '', children, style, ...motionProps }, ref) => {
    const base = variantStyles[variant]
    const accentBorder = accentColor
      ? { border: `1px solid ${accentColor}33`, boxShadow: `0 0 20px ${accentColor}18, ${base.boxShadow}` }
      : {}

    return (
      <motion.div
        ref={ref}
        className={`relative overflow-hidden rounded-[var(--radius-widget)] ${className}`}
        style={{ ...base, ...accentBorder, ...style }}
        {...motionProps}
      >
        {/* Inner top highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'
