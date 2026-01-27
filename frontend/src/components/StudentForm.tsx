import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { studentService } from '../services/studentService'
import classService from '../services/classService'
import type { Student, CreateStudentData, UpdateStudentData, Level } from '../types/student'
import type { Class } from '../types/class'

interface StudentFormProps {
  student?: Student | null
  onSubmit: (student: Student) => void
  onCancel: () => void
}

type FormData = {
  name: string
  email: string
  phone: string
  birthDate: string
  level: Level
  objectives: string
  medicalNotes: string
  classIds: string[]
}

const levelOptions: { value: Level; label: string }[] = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' }
]

export const StudentForm: React.FC<StudentFormProps> = ({
  student,
  onSubmit,
  onCancel
}) => {
  const [submitLoading, setSubmitLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!student

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FormData>({
    defaultValues: {
      name: student?.name || '',
      email: student?.email || '',
      phone: student?.phone || '',
      birthDate: student?.birthDate ? student.birthDate.split('T')[0] : '',
      level: student?.level || 'iniciante',
      objectives: student?.objectives || '',
      medicalNotes: student?.medicalNotes || '',
      classIds: []
    }
  })

  // Load classes and student's current classes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingClasses(true)
        const classesData = await classService.listClasses()
        setClasses(classesData)

        // If editing, load student's current classes
        if (student?.id) {
          const studentData = await studentService.getStudent(student.id)
          const currentClassIds = studentData.classStudents?.map(cs => cs.classId) || []
          setSelectedClassIds(currentClassIds)
        }
      } catch (error) {
        console.error('Error loading classes:', error)
      } finally {
        setLoadingClasses(false)
      }
    }

    loadData()
  }, [student?.id])

  // Handle class selection
  const handleClassToggle = (classId: string) => {
    setSelectedClassIds(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId)
      } else {
        return [...prev, classId]
      }
    })
  }

  const selectAllClasses = () => {
    setSelectedClassIds(classes.map(c => c.id))
  }

  const clearAllClasses = () => {
    setSelectedClassIds([])
  }

  // Handle image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.')
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.')
        return
      }

      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Get current profile image URL
  const getCurrentImageUrl = () => {
    if (imagePreview) return imagePreview
    if (student?.profileImage) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      return student.profileImage.startsWith('http') 
        ? student.profileImage 
        : `${baseUrl}${student.profileImage}`
    }
    return null
  }

  // Form submission
  const onFormSubmit = async (data: FormData) => {
    try {
      setSubmitLoading(true)

      const studentData: CreateStudentData | UpdateStudentData = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        birthDate: data.birthDate,
        level: data.level,
        objectives: data.objectives,
        medicalNotes: data.medicalNotes || undefined
      }

      let savedStudent: Student

      if (isEditing) {
        savedStudent = await studentService.updateStudent(student.id, studentData)
      } else {
        savedStudent = await studentService.createStudent(studentData as CreateStudentData)
      }

      // Upload image if selected
      if (imageFile) {
        setUploadingImage(true)
        try {
          savedStudent = await studentService.uploadProfileImage(savedStudent.id, imageFile)
        } catch (imageError) {
          console.error('Error uploading image:', imageError)
          // Continue even if image upload fails
        } finally {
          setUploadingImage(false)
        }
      }

      // Manage class enrollments
      try {
        // Get current enrollments if editing
        let currentClassIds: string[] = []
        if (isEditing) {
          const currentStudent = await studentService.getStudent(savedStudent.id)
          currentClassIds = currentStudent.classStudents?.map(cs => cs.classId) || []
        }

        // Add new enrollments
        const classesToAdd = selectedClassIds.filter(classId => !currentClassIds.includes(classId))
        for (const classId of classesToAdd) {
          try {
            await classService.addStudent(classId, savedStudent.id)
          } catch (error) {
            console.warn(`Failed to add student to class ${classId}:`, error)
          }
        }

        // Remove old enrollments
        const classesToRemove = currentClassIds.filter(classId => !selectedClassIds.includes(classId))
        for (const classId of classesToRemove) {
          try {
            await classService.removeStudent(classId, savedStudent.id)
          } catch (error) {
            console.warn(`Failed to remove student from class ${classId}:`, error)
          }
        }
      } catch (error) {
        console.error('Error managing class enrollments:', error)
        // Continue even if class management fails
      }

      onSubmit(savedStudent)
    } catch (error: any) {
      console.error('Error saving student:', error)
      alert(error.response?.data?.error || 'Erro ao salvar aluno')
    } finally {
      setSubmitLoading(false)
    }
  }

  const currentImageUrl = getCurrentImageUrl()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto"
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Editar Aluno' : 'Novo Aluno'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
        {/* Profile Image */}
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean-400 to-teal-400 text-white text-2xl font-semibold">
                  {watch('name')?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                {currentImageUrl ? 'Alterar foto' : 'Adicionar foto'}
              </button>
              {currentImageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remover
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, GIF ou WebP. Máximo 5MB.
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo *
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'Nome é obrigatório',
                minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
              })}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900 bg-white ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Digite o nome completo"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de nascimento *
            </label>
            <input
              type="date"
              {...register('birthDate', { 
                required: 'Data de nascimento é obrigatória',
                validate: (value) => {
                  const date = new Date(value)
                  const today = new Date()
                  return date <= today || 'Data não pode ser no futuro'
                }
              })}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900 bg-white ${
                errors.birthDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900 bg-white ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900 bg-white"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível *
            </label>
            <select
              {...register('level', { required: 'Nível é obrigatório' })}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900 bg-white ${
                errors.level ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {levelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.level && (
              <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
            )}
          </div>
        </div>

        {/* Objectives */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Objetivos *
          </label>
          <textarea
            {...register('objectives', { 
              required: 'Objetivos são obrigatórios',
              maxLength: { value: 1000, message: 'Máximo 1000 caracteres' }
            })}
            rows={3}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900 bg-white ${
              errors.objectives ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Descreva os objetivos do aluno com a natação..."
          />
          {errors.objectives && (
            <p className="mt-1 text-sm text-red-600">{errors.objectives.message}</p>
          )}
        </div>

        {/* Medical Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações médicas
          </label>
          <textarea
            {...register('medicalNotes', {
              maxLength: { value: 2000, message: 'Máximo 2000 caracteres' }
            })}
            rows={3}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900 bg-white ${
              errors.medicalNotes ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Alguma condição médica, alergia ou restrição importante..."
          />
          {errors.medicalNotes && (
            <p className="mt-1 text-sm text-red-600">{errors.medicalNotes.message}</p>
          )}
        </div>

        {/* Class Enrollment */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Turmas ({selectedClassIds.length} selecionadas)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllClasses}
                disabled={loadingClasses || classes.length === 0}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium disabled:text-gray-400"
              >
                Selecionar todas
              </button>
              <button
                type="button"
                onClick={clearAllClasses}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Limpar seleção
              </button>
            </div>
          </div>

          {loadingClasses ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ocean-500"></div>
              <span className="ml-2 text-gray-600">Carregando turmas...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma turma disponível
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {classes.map((classItem) => (
                <label
                  key={classItem.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedClassIds.includes(classItem.id)
                      ? 'bg-ocean-50 border-ocean-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } border`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClassIds.includes(classItem.id)}
                    onChange={() => handleClassToggle(classItem.id)}
                    className="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {classItem.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {classItem.pool?.name} • {classItem._count?.students || 0}/{classItem.maxCapacity} alunos
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Opcional: Selecione as turmas que o aluno irá frequentar. Você pode alterar isso depois.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitLoading || uploadingImage}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitLoading || uploadingImage}
            className="btn-primary flex items-center space-x-2"
          >
            {(submitLoading || uploadingImage) && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {uploadingImage ? 'Enviando imagem...' : submitLoading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar aluno'}
            </span>
          </button>
        </div>
      </form>
    </motion.div>
  )
}