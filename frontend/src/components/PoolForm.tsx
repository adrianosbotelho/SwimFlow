import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Pool, CreatePoolData, UpdatePoolData } from '../types/pool'

interface PoolFormProps {
  pool?: Pool
  onSubmit: (data: CreatePoolData | UpdatePoolData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
}

export const PoolForm: React.FC<PoolFormProps> = ({
  pool,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    length: '',
    lanes: '',
    temperature: '',
    description: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (pool) {
      setFormData({
        name: pool.name || '',
        capacity: pool.capacity?.toString() || '',
        length: pool.length?.toString() || '',
        lanes: pool.lanes?.toString() || '',
        temperature: pool.temperature?.toString() || '',
        description: pool.description || ''
      })
    }
  }, [pool])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!formData.capacity.trim()) {
      newErrors.capacity = 'Capacidade é obrigatória'
    } else {
      const capacity = parseInt(formData.capacity)
      if (isNaN(capacity) || capacity < 1) {
        newErrors.capacity = 'Capacidade deve ser um número maior que 0'
      }
    }

    if (formData.length && formData.length.trim()) {
      const length = parseFloat(formData.length)
      if (isNaN(length) || length <= 0) {
        newErrors.length = 'Comprimento deve ser um número positivo'
      }
    }

    if (formData.lanes && formData.lanes.trim()) {
      const lanes = parseInt(formData.lanes)
      if (isNaN(lanes) || lanes < 1) {
        newErrors.lanes = 'Número de raias deve ser um número maior que 0'
      }
    }

    if (formData.temperature && formData.temperature.trim()) {
      const temperature = parseFloat(formData.temperature)
      if (isNaN(temperature) || temperature < 0 || temperature > 50) {
        newErrors.temperature = 'Temperatura deve estar entre 0 e 50°C'
      }
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
      const submitData: CreatePoolData | UpdatePoolData = {
        name: formData.name.trim(),
        capacity: parseInt(formData.capacity),
        ...(formData.length.trim() && { length: parseFloat(formData.length) }),
        ...(formData.lanes.trim() && { lanes: parseInt(formData.lanes) }),
        ...(formData.temperature.trim() && { temperature: parseFloat(formData.temperature) }),
        ...(formData.description.trim() && { description: formData.description.trim() })
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting pool form:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {pool ? 'Editar Piscina' : 'Nova Piscina'}
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
            Nome da Piscina *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: Piscina Principal"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
            Capacidade (pessoas) *
          </label>
          <input
            type="number"
            id="capacity"
            min="1"
            value={formData.capacity}
            onChange={(e) => handleInputChange('capacity', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
              errors.capacity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: 50"
            disabled={isLoading}
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
          )}
        </div>

        {/* Length and Lanes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
              Comprimento (metros)
            </label>
            <input
              type="number"
              id="length"
              min="0"
              step="0.1"
              value={formData.length}
              onChange={(e) => handleInputChange('length', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
                errors.length ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 25"
              disabled={isLoading}
            />
            {errors.length && (
              <p className="mt-1 text-sm text-red-600">{errors.length}</p>
            )}
          </div>

          <div>
            <label htmlFor="lanes" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Raias
            </label>
            <input
              type="number"
              id="lanes"
              min="1"
              value={formData.lanes}
              onChange={(e) => handleInputChange('lanes', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
                errors.lanes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 8"
              disabled={isLoading}
            />
            {errors.lanes && (
              <p className="mt-1 text-sm text-red-600">{errors.lanes}</p>
            )}
          </div>
        </div>

        {/* Temperature */}
        <div>
          <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
            Temperatura (°C)
          </label>
          <input
            type="number"
            id="temperature"
            min="0"
            max="50"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => handleInputChange('temperature', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent ${
              errors.temperature ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: 28.5"
            disabled={isLoading}
          />
          {errors.temperature && (
            <p className="mt-1 text-sm text-red-600">{errors.temperature}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            placeholder="Descrição adicional da piscina..."
            disabled={isLoading}
          />
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
            <span>{pool ? 'Atualizar' : 'Criar'} Piscina</span>
          </button>
        </div>
      </form>
    </motion.div>
  )
}