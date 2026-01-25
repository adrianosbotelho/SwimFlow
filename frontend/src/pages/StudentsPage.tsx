import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StudentList } from '../components/StudentList'
import { StudentForm } from '../components/StudentForm'
import type { Student } from '../types/student'

export const StudentsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAddStudent = () => {
    setEditingStudent(null)
    setShowForm(true)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setShowForm(true)
  }

  const handleViewStudent = (studentId: string) => {
    // TODO: Navigate to student detail page
    console.log('View student:', studentId)
  }

  const handleDeleteStudent = async (student: Student) => {
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1); // Force refresh of student list
      } else {
        const result = await response.json();
        alert(result.error || 'Erro ao excluir aluno');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Erro ao excluir aluno');
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false)
    setEditingStudent(null)
    setRefreshKey(prev => prev + 1) // Force refresh of student list
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingStudent(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Alunos</h1>
            <p className="text-gray-600 mt-1">Gerencie os alunos cadastrados no sistema</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Novo Aluno</span>
          </button>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleFormCancel()
                }
              }}
            >
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <StudentForm
                  student={editingStudent}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Student List */}
        <StudentList
          key={refreshKey}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
          onViewStudent={handleViewStudent}
        />
      </div>
    </div>
  )
}