import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LevelBadge from '../LevelBadge'

describe('LevelBadge', () => {
  it('renders iniciante level correctly', () => {
    render(<LevelBadge level="iniciante" />)
    
    expect(screen.getByText('Iniciante')).toBeInTheDocument()
    const badge = screen.getByText('Iniciante')
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800')
  })

  it('renders intermediario level correctly', () => {
    render(<LevelBadge level="intermediario" />)
    
    expect(screen.getByText('Intermediário')).toBeInTheDocument()
    const badge = screen.getByText('Intermediário')
    expect(badge).toHaveClass('bg-ocean-100', 'text-ocean-800')
  })

  it('renders avancado level correctly', () => {
    render(<LevelBadge level="avancado" />)
    
    expect(screen.getByText('Avançado')).toBeInTheDocument()
    const badge = screen.getByText('Avançado')
    expect(badge).toHaveClass('bg-teal-100', 'text-teal-800')
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<LevelBadge level="iniciante" size="sm" />)
    let badge = screen.getByText('Iniciante')
    expect(badge).toHaveClass('px-2', 'py-1', 'text-xs')

    rerender(<LevelBadge level="iniciante" size="md" />)
    badge = screen.getByText('Iniciante')
    expect(badge).toHaveClass('px-3', 'py-1', 'text-sm')

    rerender(<LevelBadge level="iniciante" size="lg" />)
    badge = screen.getByText('Iniciante')
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base')
  })

  it('applies custom className', () => {
    render(<LevelBadge level="iniciante" className="custom-class" />)
    
    const badge = screen.getByText('Iniciante')
    expect(badge).toHaveClass('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(<LevelBadge level="intermediario" />)
    
    const badge = screen.getByText('Intermediário')
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'font-medium', 'border')
  })
})