import React from 'react'
import { motion } from 'framer-motion'
import type { Student } from '../types/student'
import LevelBadge from './LevelBadge'

interface StudentCardProps {
  student: Student
  onEdit?: (student: Student) => void
  onViewDetails?: (studentId: string) => void
  showLevel?: boolean
  showLastEvaluation?: boolean
  compact?: boolean
}

const levelLabels = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado'
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

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onEdit,
  onViewDetails,
  showLevel = true,
  showLastEvaluation = true,
  compact = false
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const getProfileImageUrl = (profileImage: string | null): string | undefined => {
    if (!profileImage) return undefined
    
    // If it's already a full URL, return as is
    if (profileImage.startsWith('http')) return profileImage
    
    // If it's a relative path, prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${baseUrl}${profileImage}`
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`card cursor-pointer ${compact ? 'p-4' : 'p-6'}`}
      onClick={() => onViewDetails?.(student.id)}
    >
      <div className="flex items-start space-x-4">
        {/* Profile Image */}
        <div className={`flex-shrink-0 ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}>
          {student.profileImage ? (
            <img
              src={getProfileImageUrl(student.profileImage)}
              alt={student.name}
              className="w-full h-full rounded-full object-cover border-2 border-ocean-200"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div 
            className={`${student.profileImage ? 'hidden' : ''} w-full h-full rounded-full bg-gradient-to-br from-ocean-400 to-teal-400 flex items-center justify-center text-white font-semibold ${compact ? 'text-sm' : 'text-lg'}`}
          >
            {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        </div>

        {/* Student Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-base' : 'text-lg'}`}>
                {student.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {getAge(student.birthDate)} anos
              </p>
              
              {showLevel && (
                <div className="mt-2">
                  <LevelBadge level={student.level} size={compact ? 'sm' : 'md'} />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 ml-4">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(student)
                  }}
                  className="p-2 text-gray-400 hover:text-ocean-600 transition-colors"
                  title="Editar aluno"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails?.(student.id)
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

          {/* Additional Info */}
          {!compact && (
            <div className="mt-3 space-y-1">
              {student.email && (
                <p className="text-sm text-gray-600 truncate">
                  📧 {student.email}
                </p>
              )}
              {student.phone && (
                <p className="text-sm text-gray-600">
                  📱 {student.phone}
                </p>
              )}
              {showLastEvaluation && (
                <p className="text-sm text-gray-600">
                  📊 Última avaliação: {formatDate(student.lastEvaluationDate)}
                </p>
              )}
            </div>
          )}

          {/* Classes */}
          {student.classStudents && student.classStudents.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {student.classStudents.slice(0, 2).map((classStudent) => (
                  <span
                    key={classStudent.classId}
                    className="inline-block px-2 py-1 text-xs bg-teal-100 text-teal-800 rounded-full"
                  >
                    {classStudent.class.name}
                  </span>
                ))}
                {student.classStudents.length > 2 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    +{student.classStudents.length - 2} mais
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}