import React from 'react'
import { motion } from 'framer-motion'
import type { Class } from '../types/class'

interface ClassCardProps {
  class: Class
  onEdit?: (classData: Class) => void
  onDelete?: (classData: Class) => void
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
  onDelete,
  onViewDetails,
  compact = false
}) => {
  const formatTime = (timeString: string) => {
    // Handle both ISO timestamp and time string formats
    let date: Date;
    
    if (timeString.includes('T')) {
      // It's an ISO timestamp, extract the time part directly from UTC
      date = new Date(timeString);
      // Get UTC hours and minutes to avoid timezone conversion
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else {
      // It's a time string like "07:00", format it directly
      return timeString;
    }
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center text-white">
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

          {/* Schedules with Professors */}
          {!compact && classData.schedules && classData.schedules.length > 0 && (
            <div className="mb-3">
              <div className="space-y-2">
                {classData.schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {dayNames[schedule.dayOfWeek]} {formatTime(schedule.startTime)}-{formatTime(schedule.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {schedule.professor && (
                        <>
                          <div className="w-6 h-6 flex-shrink-0">
                            {schedule.professor.profileImage ? (
                              <img
                                src={getProfileImageUrl(schedule.professor.profileImage)}
                                alt={schedule.professor.name}
                                className="w-full h-full rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  target.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div 
                              className={`${schedule.professor.profileImage ? 'hidden' : ''} w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-semibold`}
                            >
                              {schedule.professor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            {schedule.professor.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
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
                <div className="text-lg font-semibold text-blue-600">
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
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Editar turma"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`Tem certeza que deseja excluir a turma ${classData.name}?`)) {
                      onDelete(classData)
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Excluir turma"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails?.(classData.id)
                }}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
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