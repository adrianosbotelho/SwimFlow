import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Class, CreateClassData, UpdateClassData } from '../types/class'
import type { Pool } from '../types/pool'

interface Professor {
  id: string
  name: string
  email: string
}

interface ClassFormProps {
  class?: Class
  professors: Professor[]
  pools: Pool[]
  onSubmit: (data: CreateClassData | UpdateClassData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
}

export const ClassForm: React.FC<ClassFormProps> = ({
  class: classData,
  professors,
  pools,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    professorId: '',
    poolId: '',
    maxCapacity: ''
  })

  const [schedules, setSchedules] = useState<{
    dayOfWeek: number
    startTime: string
    endTime: string
  }[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        professorId: classData.professorId || '',
        poolId: classData.poolId || '',
        maxCapacity: classData.maxCapacity?.toString() || ''
      })

      if (classData.schedules) {
        setSchedules(classData.schedules.map(schedule => ({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime.slice(0, 5), // Remove seconds
          endTime: schedule.endTime.slice(0, 5) // Remove seconds
        })))
      }
    }
  }, [classData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!formData.professorId) {
      newErrors.professorId = 'Professor é obrigatório'
    }

    if (!formData.poolId) {
      newErrors.poolId = 'Piscina é obrigatória'
    }

    if (!formData.maxCapacity.trim()) {
      newErrors.maxCapacity = 'Capacidade máxima é obrigatória'
    } else {
      const capacity = parseInt(formData.maxCapacity)
      if (isNaN(capacity) || capacity < 1) {
        newErrors.maxCapacity = 'Capacidade deve ser um número maior que 0'
      } else {
        const selectedPool = pools.find(p => p.id === formData.poolId)
        if (selectedPool && capacity > selectedPool.capacity) {
          newErrors.maxCapacity = `Capacidade não pode exceder a capacidade da piscina (${selectedPool.capacity})`
        }
      }
    }

    if (schedules.length === 0) {
      newErrors.schedules = 'Pelo menos um horário é obrigatório'
    } else {
      schedules.forEach((schedule, index) => {
        if (!schedule.startTime || !schedule.endTime) {
          newErrors[`schedule_${index}`] = 'Horário de início e fim são obrigatórios'
        } else if (schedule.startTime >= schedule.endTime) {
          newErrors[`schedule_${index}`] = 'Horário de início deve ser anterior ao horário de fim'
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const submitData: CreateClassData | UpdateClassData = {
        name: formData.name.trim(),
        professorId: formData.professorId,
        poolId: formData.poolId,
        maxCapacity: parseInt(formData.maxCapacity),
        schedules: schedules.map(schedule => ({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime
        }))
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting class form:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addSchedule = () => {
    setSchedules(prev => [...prev, {
      dayOfWeek: 1, // Monday
      startTime: '08:00',
      endTime: '09:00'
    }])
  }

  const removeSchedule = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index))
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`schedule_${index}`]
      return newErrors
    })
  }

  const updateSchedule = (index: number, field: string, value: string | number) => {
    setSchedules(prev => prev.map((schedule, i) => 
      i === index ? { ...schedule, [field]: value } : schedule
    ))
    
    // Clear error when user starts typing
    if (errors[`schedule_${index}`]) {
      setErrors(prev => ({ ...prev, [`schedule_${index}`]: '' }))
    }
  }

  const selectedPool = pools.find(p => p.id === formData.poolId)

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {classData ? 'Editar Turma' : 'Nova Turma'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Turma *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: Natação Iniciante - Manhã"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Professor and Pool */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="professorId" className="block text-sm font-medium text-gray-700 mb-2">
              Professor *
            </label>
            <select
              id="professorId"
              value={formData.professorId}
              onChange={(e) => handleInputChange('professorId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
                errors.professorId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Selecione um professor</option>
              {professors.map(professor => (
                <option key={professor.id} value={professor.id}>
                  {professor.name}
                </option>
              ))}
            </select>
            {errors.professorId && (
              <p className="mt-1 text-sm text-red-600">{errors.professorId}</p>
            )}
          </div>

          <div>
            <label htmlFor="poolId" className="block text-sm font-medium text-gray-700 mb-2">
              Piscina *
            </label>
            <select
              id="poolId"
              value={formData.poolId}
              onChange={(e) => handleInputChange('poolId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
                errors.poolId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Selecione uma piscina</option>
              {pools.map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.name} (Cap: {pool.capacity})
                </option>
              ))}
            </select>
            {errors.poolId && (
              <p className="mt-1 text-sm text-red-600">{errors.poolId}</p>
            )}
          </div>
        </div>

        {/* Max Capacity */}
        <div>
          <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700 mb-2">
            Capacidade Máxima *
            {selectedPool && (
              <span className="text-sm text-gray-500 ml-2">
                (Máximo: {selectedPool.capacity} da piscina)
              </span>
            )}
          </label>
          <input
            type="number"
            id="maxCapacity"
            min="1"
            max={selectedPool?.capacity}
            value={formData.maxCapacity}
            onChange={(e) => handleInputChange('maxCapacity', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
              errors.maxCapacity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: 20"
            disabled={isLoading}
          />
          {errors.maxCapacity && (
            <p className="mt-1 text-sm text-red-600">{errors.maxCapacity}</p>
          )}
        </div>

        {/* Schedules */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Horários *
            </label>
            <button
              type="button"
              onClick={addSchedule}
              className="px-3 py-1 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-1"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Adicionar</span>
            </button>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-2">Nenhum horário adicionado</p>
              <button
                type="button"
                onClick={addSchedule}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                disabled={isLoading}
              >
                Adicionar Primeiro Horário
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(e) => updateSchedule(index, 'dayOfWeek', parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                    disabled={isLoading}
                  >
                    {dayNames.map((day, dayIndex) => (
                      <option key={dayIndex} value={dayIndex}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                    disabled={isLoading}
                  />

                  <span className="text-gray-500">até</span>

                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                    disabled={isLoading}
                  />

                  <button
                    type="button"
                    onClick={() => removeSchedule(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.schedules && (
            <p className="mt-1 text-sm text-red-600">{errors.schedules}</p>
          )}
          
          {Object.keys(errors).some(key => key.startsWith('schedule_')) && (
            <p className="mt-1 text-sm text-red-600">
              Verifique os horários marcados com erro
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            disabled={isLoading}
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{classData ? 'Atualizar' : 'Criar'} Turma</span>
          </button>
        </div>
      </form>
    </motion.div>
  )
}