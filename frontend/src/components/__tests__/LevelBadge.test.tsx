import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LevelBadge from '../LevelBadge'

describe('LevelBadge', () => {
  it('renders iniciante level correctly', () => {
    render(<LevelBadge level="iniciante" />)
    
    expect(screen.getByText('Iniciante')).toBeInTheDocument()
    const badge = screen.getByText('Iniciante').parentElement as HTMLElement
    expect(badge).toHaveClass('bg-gradient-to-r', 'from-amber-400', 'to-orange-500', 'text-white')
  })

  it('renders intermediario level correctly', () => {
    render(<LevelBadge level="intermediario" />)
    
    expect(screen.getByText('Intermediário')).toBeInTheDocument()
    const badge = screen.getByText('Intermediário').parentElement as HTMLElement
    expect(badge).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white')
  })

  it('renders avancado level correctly', () => {
    render(<LevelBadge level="avancado" />)
    
    expect(screen.getByText('Avançado')).toBeInTheDocument()
    const badge = screen.getByText('Avançado').parentElement as HTMLElement
    expect(badge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600', 'text-white')
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<LevelBadge level="iniciante" size="sm" />)
    let badge = screen.getByText('Iniciante').parentElement as HTMLElement
    expect(badge).toHaveClass('px-3', 'py-1.5', 'text-xs')

    rerender(<LevelBadge level="iniciante" size="md" />)
    badge = screen.getByText('Iniciante').parentElement as HTMLElement
    expect(badge).toHaveClass('px-4', 'py-2', 'text-sm')

    rerender(<LevelBadge level="iniciante" size="lg" />)
    badge = screen.getByText('Iniciante').parentElement as HTMLElement
    expect(badge).toHaveClass('px-5', 'py-2.5', 'text-base')
  })

  it('applies custom className', () => {
    render(<LevelBadge level="iniciante" className="custom-class" />)
    
    const badge = screen.getByText('Iniciante').parentElement as HTMLElement
    expect(badge).toHaveClass('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(<LevelBadge level="intermediario" />)
    
    const badge = screen.getByText('Intermediário').parentElement as HTMLElement
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'font-semibold')
  })
})
