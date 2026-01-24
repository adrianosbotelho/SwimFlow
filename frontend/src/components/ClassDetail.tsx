import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { Class } from '../types/class'
import { StudentCard } from './StudentCard'

interface ClassDetailProps {
  class: Class
  onEditClass?: (classData: Class) => void
  onAddStudent?: (classId: string) => void
  onRemoveStudent?: (classId: string, studentId: string) => void
  onEditStudent?: (student: any) => void
  onViewStudent?: (studentId: string) => void
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
}

export const ClassDetail: React.FC<ClassDetailProps> = ({
  class: classData,
  onEditClass,
  onAddStudent,
  onRemoveStudent,
  onEditStudent,
  onViewStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProfileImageUrl = (profileImage: string | null): string | undefined => {
    if (!profileImage) return undefined
    
    if (profileImage.startsWith('http')) return profileImage
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${baseUrl}${profileImage}`
  }

  const currentStudents = classData._count?.students || 0
  const capacityPercentage = (currentStudents / classData.maxCapacity) * 100

  // Filter students based on search term
  const filteredStudents = classData.students?.filter(classStudent =>
    classStudent.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Class Header */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-ocean-400 flex items-center justify-center text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
              <p className="text-gray-600">{classData.pool?.name}</p>
            </div>
          </div>

          {onEditClass && (
            <button
              onClick={() => onEditClass(classData)}
              className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Editar Turma</span>
            </button>
          )}
        </div>

        {/* Class Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Professor */}
          {classData.professor && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Professor</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0">
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
                    className={`${classData.professor.profileImage ? 'hidden' : ''} w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-semibold`}
                  >
                    {classData.professor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{classData.professor.name}</p>
                  <p className="text-sm text-gray-600">{classData.professor.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pool Info */}
          {classData.pool && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Piscina</h3>
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{classData.pool.name}</p>
                <p className="text-sm text-gray-600">Capacidade: {classData.pool.capacity} pessoas</p>
                {classData.pool.length && (
                  <p className="text-sm text-gray-600">Comprimento: {classData.pool.length}m</p>
                )}
                {classData.pool.lanes && (
                  <p className="text-sm text-gray-600">Raias: {classData.pool.lanes}</p>
                )}
              </div>
            </div>
          )}

          {/* Capacity */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Ocupação</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {currentStudents}/{classData.maxCapacity}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(capacityPercentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
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
          </div>
        </div>

        {/* Schedules */}
        {classData.schedules && classData.schedules.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Horários</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classData.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center space-x-3 p-3 bg-ocean-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-ocean-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {dayNames[schedule.dayOfWeek].slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dayNames[schedule.dayOfWeek]}</p>
                    <p className="text-sm text-gray-600">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Students Section */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Alunos ({filteredStudents.length})
          </h2>
          
          {onAddStudent && (
            <button
              onClick={() => onAddStudent(classData.id)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
              disabled={currentStudents >= classData.maxCapacity}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Adicionar Aluno</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar alunos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStudents.map((classStudent) => (
              <div key={classStudent.studentId} className="relative">
                <StudentCard
                  student={{
                    ...classStudent.student,
                    birthDate: classStudent.student.lastEvaluationDate || '',
                    objectives: '',
                    createdAt: classStudent.enrolledAt,
                    updatedAt: classStudent.enrolledAt
                  }}
                  onEdit={onEditStudent}
                  onViewDetails={onViewStudent}
                  compact={true}
                />
                
                {onRemoveStudent && (
                  <button
                    onClick={() => onRemoveStudent(classData.id, classStudent.studentId)}
                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    title="Remover da turma"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca.' 
                : 'Esta turma ainda não possui alunos matriculados.'
              }
            </p>
            {onAddStudent && !searchTerm && (
              <button
                onClick={() => onAddStudent(classData.id)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                disabled={currentStudents >= classData.maxCapacity}
              >
                Adicionar Primeiro Aluno
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}