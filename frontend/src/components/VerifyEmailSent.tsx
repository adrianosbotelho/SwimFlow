import React, { useState } from 'react'
import { motion } from 'framer-motion'
import authService from '../services/authService'

interface VerifyEmailSentProps {
  email: string
  onBackToLogin: () => void
}

export const VerifyEmailSent: React.FC<VerifyEmailSentProps> = ({ email, onBackToLogin }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleResend = async () => {
    try {
      setIsLoading(true)
      const response = await authService.resendVerification(email)
      setMessage(response.message || 'Email reenviado.')
    } catch {
      setMessage('Nao foi possivel reenviar o email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6"
      >
        <div className="card text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirme seu email</h2>
          <p className="text-gray-600 mb-6">
            Enviamos um link de confirmacao para <strong>{email}</strong>. Verifique sua caixa de entrada.
          </p>

          {message && <p className="text-sm text-gray-500 mb-4">{message}</p>}

          <button
            onClick={handleResend}
            className="btn-secondary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Reenviando...' : 'Reenviar email'}
          </button>

          <button
            onClick={onBackToLogin}
            className="btn-primary w-full mt-3"
          >
            Voltar para login
          </button>
        </div>
      </motion.div>
    </div>
  )
}
