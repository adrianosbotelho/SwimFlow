import React, { useState } from 'react'
import { Level } from './LevelBadge'

interface LevelSelectorProps {
  currentLevel: Level
  onLevelChange: (newLevel: Level, reason?: string) => void
  disabled?: boolean
  showReason?: boolean
  className?: string
}

const levelOptions: { value: Level; label: string; description: string }[] = [
  {
    value: 'iniciante',
    label: 'Iniciante',
    description: 'Aprendendo os fundamentos da natação'
  },
  {
    value: 'intermediario',
    label: 'Intermediário',
    description: 'Domina técnicas básicas, desenvolvendo resistência'
  },
  {
    value: 'avancado',
    label: 'Avançado',
    description: 'Técnica refinada e alta performance'
  }
]

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentLevel,
  onLevelChange,
  disabled = false,
  showReason = true,
  className = ''
}) => {
  const [selectedLevel, setSelectedLevel] = useState<Level>(currentLevel)
  const [reason, setReason] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleLevelChange = (newLevel: Level) => {
    setSelectedLevel(newLevel)
    if (!showReason) {
      onLevelChange(newLevel)
      setIsOpen(false)
    }
  }

  const handleConfirm = () => {
    onLevelChange(selectedLevel, reason)
    setReason('')
    setIsOpen(false)
  }

  const handleCancel = () => {
    setSelectedLevel(currentLevel)
    setReason('')
    setIsOpen(false)
  }

  const currentLevelConfig = levelOptions.find(opt => opt.value === currentLevel)
  const hasChanges = selectedLevel !== currentLevel

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-4 py-2 text-left
          bg-white border border-gray-300 rounded-lg shadow-sm
          hover:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
        `}
      >
        <div>
          <div className="font-medium text-gray-900">
            {currentLevelConfig?.label}
          </div>
          <div className="text-sm text-gray-500">
            {currentLevelConfig?.description}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Alterar Nível do Aluno
            </h3>
            
            <div className="space-y-2 mb-4">
              {levelOptions.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-start p-3 rounded-lg border cursor-pointer
                    transition-colors duration-200
                    ${selectedLevel === option.value
                      ? 'border-ocean-500 bg-ocean-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="level"
                    value={option.value}
                    checked={selectedLevel === option.value}
                    onChange={() => handleLevelChange(option.value)}
                    className="mt-1 text-ocean-600 focus:ring-ocean-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {showReason && hasChanges && (
              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da mudança (opcional)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva o motivo da mudança de nível..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900 bg-white"
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!hasChanges}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-ocean-500
                  ${hasChanges
                    ? 'bg-ocean-600 hover:bg-ocean-700'
                    : 'bg-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Confirmar Mudança
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LevelSelector