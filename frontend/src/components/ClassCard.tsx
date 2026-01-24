import React from 'react'
import { motion } from 'framer-motion'
import type { Class } from '../types/class'

interface ClassCardProps {
  class: Class
  onEdit?: (classData: Class) => void
  onViewDetails?: (classId: string) => void
  compact?: boolean
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  hover: {
    y: -4,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const ClassCard: React.FC<ClassCardProps> = ({
  class: classData,
  onEdit,
  onViewDetails,
  compact = false
}) => {
  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProfileImageUrl = (profileImage: string | null): string | undefined => {
    if (!profileImage) return undefined
    
    // If it's already a full URL, return as is
    if (profileImage.startsWith('http')) return profileImage
    
    // If it's a relative path, prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${baseUrl}${profileImage}`
  }

  const currentStudents = classData._count?.students || 0
  const capacityPercentage = (currentStudents / classData.maxCapacity) * 100

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`card cursor-pointer ${compact ? 'p-4' : 'p-6'}`}
      onClick={() => onViewDetails?.(classData.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Class Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-ocean-400 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
                {classData.name}
              </h3>
              <p className="text-sm text-gray-600">
                {classData.pool?.name}
              </p>
            </div>
          </div>

          {/* Professor Info */}
          {classData.professor && (
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 flex-shrink-0">
                {classData.professor.profileImage ? (
                  <img
                    src={getProfileImageUrl(classData.professor.profileImage)}
                    alt={classData.professor.name}
                    className="w-full h-full rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div 
                  className={`${classData.professor.profileImage ? 'hidden' : ''} w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-semibold`}
                >
                  {classData.professor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {classData.professor.name}
                </p>
                <p className="text-xs text-gray-500">Professor</p>
              </div>
            </div>
          )}

          {/* Schedules */}
          {!compact && classData.schedules && classData.schedules.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {classData.schedules.map((schedule) => (
                  <span
                    key={schedule.id}
                    className="inline-block px-2 py-1 text-xs bg-ocean-100 text-ocean-800 rounded-full"
                  >
                    {dayNames[schedule.dayOfWeek]} {formatTime(schedule.startTime)}-{formatTime(schedule.endTime)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Capacity Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Ocupação</span>
              <span className="font-medium text-gray-900">
                {currentStudents}/{classData.maxCapacity}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  capacityPercentage >= 90 
                    ? 'bg-red-500' 
                    : capacityPercentage >= 70 
                    ? 'bg-amber-500' 
                    : 'bg-teal-500'
                }`}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-teal-600">
                  {currentStudents}
                </div>
                <div className="text-xs text-gray-500">Alunos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-ocean-600">
                  {Math.round(capacityPercentage)}%
                </div>
                <div className="text-xs text-gray-500">Ocupação</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(classData)
                  }}
                  className="p-2 text-gray-400 hover:text-ocean-600 transition-colors"
                  title="Editar turma"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails?.(classData.id)
                }}
                className="p-2 text-gray-400 hover:text-ocean-600 transition-colors"
                title="Ver detalhes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}