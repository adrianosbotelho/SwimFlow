import React from 'react'

export type Level = 'iniciante' | 'intermediario' | 'avancado'

interface LevelBadgeProps {
  level: Level
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const levelConfig = {
  iniciante: {
    label: 'Iniciante',
    gradient: 'from-amber-400 to-orange-500',
    textColor: 'text-white',
    shadowColor: 'shadow-amber-200 dark:shadow-amber-900/50',
    icon: '🌱'
  },
  intermediario: {
    label: 'Intermediário',
    gradient: 'from-blue-500 to-blue-600',
    textColor: 'text-white',
    shadowColor: 'shadow-blue-200 dark:shadow-blue-900/50',
    icon: '🏊‍♂️'
  },
  avancado: {
    label: 'Avançado',
    gradient: 'from-green-500 to-teal-600',
    textColor: 'text-white',
    shadowColor: 'shadow-green-200 dark:shadow-green-900/50',
    icon: '🏆'
  }
}

const sizeConfig = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2'
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
        inline-flex items-center rounded-full font-semibold
        bg-gradient-to-r ${config.gradient} ${config.textColor} ${config.shadowColor}
        ${sizeClasses}
        shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105
        ${className}
      `}
    >
      <span className="text-xs">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}

export default LevelBadge