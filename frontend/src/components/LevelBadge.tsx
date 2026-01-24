import React from 'react'

export type Level = 'iniciante' | 'intermediario' | 'avancado'

interface LevelBadgeProps {
  level: Level
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const levelConfig = {
  iniciante: {
    label: 'Iniciante',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200'
  },
  intermediario: {
    label: 'Intermediário',
    bgColor: 'bg-ocean-100',
    textColor: 'text-ocean-800',
    borderColor: 'border-ocean-200'
  },
  avancado: {
    label: 'Avançado',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-200'
  }
}

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ 
  level, 
  size = 'md', 
  className = '' 
}) => {
  const config = levelConfig[level]
  const sizeClasses = sizeConfig[size]

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses}
        ${className}
      `}
    >
      {config.label}
    </span>
  )
}

export default LevelBadge