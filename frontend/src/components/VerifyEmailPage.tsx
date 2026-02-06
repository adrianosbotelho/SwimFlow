import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import authService from '../services/authService'

interface VerifyEmailPageProps {
  token: string
  onBackToLogin: () => void
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ token, onBackToLogin }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token)
        setMessage(response.message || 'Email confirmado com sucesso.')
        setStatus('success')
      } catch (error: any) {
        setMessage(error.response?.data?.message || 'Token inválido ou expirado.')
        setStatus('error')
      }
    }

    verify()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6"
      >
        <div className="card text-center">
          {status === 'loading' && (
            <>
              <div className="loading-spinner w-10 h-10 mx-auto mb-4" />
              <p className="text-gray-600">Confirmando seu email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email confirmado</h2>
              <p className="text-gray-600 mb-6">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Não foi possível confirmar</h2>
              <p className="text-gray-600 mb-6">{message}</p>
            </>
          )}

          <button
            onClick={onBackToLogin}
            className="btn-primary w-full"
          >
            Voltar para login
          </button>
        </div>
      </motion.div>
    </div>
  )
}
