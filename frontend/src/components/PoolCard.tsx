import React from 'react'
import { motion } from 'framer-motion'
import type { Pool } from '../types/pool'

interface PoolCardProps {
  pool: Pool
  onEdit?: (pool: Pool) => void
  onViewDetails?: (poolId: string) => void
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

export const PoolCard: React.FC<PoolCardProps> = ({
  pool,
  onEdit,
  onViewDetails,
  compact = false
}) => {
  const totalStudents = pool.classes?.reduce((sum, cls) => sum + (cls._count?.students || 0), 0) || 0

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`card cursor-pointer ${compact ? 'p-4' : 'p-6'}`}
      onClick={() => onViewDetails?.(pool.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Pool Icon and Name */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ocean-400 to-teal-400 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
                {pool.name}
              </h3>
              <p className="text-sm text-gray-600">
                Capacidade: {pool.capacity} pessoas
              </p>
            </div>
          </div>

          {/* Pool Details */}
          {!compact && (
            <div className="space-y-2 mb-4">
              {pool.length && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3z" />
                  </svg>
                  Comprimento: {pool.length}m
                </div>
              )}
              
              {pool.lanes && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Raias: {pool.lanes}
                </div>
              )}
              
              {pool.temperature && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Temperatura: {pool.temperature}°C
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-ocean-600">
                  {pool.classes?.length || 0}
                </div>
                <div className="text-xs text-gray-500">Turmas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-teal-600">
                  {totalStudents}
                </div>
                <div className="text-xs text-gray-500">Alunos</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(pool)
                  }}
                  className="p-2 text-gray-400 hover:text-ocean-600 transition-colors"
                  title="Editar piscina"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails?.(pool.id)
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

          {/* Description */}
          {!compact && pool.description && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-2">
                {pool.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}