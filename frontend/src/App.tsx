import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-ocean-800 mb-4">
            SwimFlow
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sistema de Gestão de Natação
          </p>
          <div className="card max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Bem-vindo ao SwimFlow
            </h2>
            <p className="text-gray-600">
              Sistema em desenvolvimento. A infraestrutura base foi configurada com sucesso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App