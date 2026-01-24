import { StudentService } from '../studentService'

import { 
  createStudentSchema, 
  updateStudentSchema, 
  studentFiltersSchema,
  changeLevelSchema
} from '../studentService'

describe('StudentService Validation', () => {
  describe('createStudentSchema', () => {
    it('should validate correct student data', () => {
      const validData = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '(11) 99999-9999',
        birthDate: new Date('2000-01-01'),
        level: 'intermediario',
        objectives: 'Melhorar técnica de crawl',
        medicalNotes: 'Nenhuma restrição'
      }

      const { error } = createStudentSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    it('should reject invalid name', () => {
      const invalidData = {
        name: 'A', // Too short
        birthDate: new Date('2000-01-01'),
        level: 'intermediario',
        objectives: 'Test objectives'
      }

      const { error } = createStudentSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('length must be at least 2')
    })

    it('should reject future birth date', () => {
      const invalidData = {
        name: 'João Silva',
        birthDate: new Date('2030-01-01'), // Future date
        level: 'intermediario',
        objectives: 'Test objectives'
      }

      const { error } = createStudentSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('must be less than or equal to')
    })

    it('should reject invalid level', () => {
      const invalidData = {
        name: 'João Silva',
        birthDate: new Date('2000-01-01'),
        level: 'invalid_level',
        objectives: 'Test objectives'
      }

      const { error } = createStudentSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('must be one of')
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'João Silva',
        email: 'invalid-email',
        birthDate: new Date('2000-01-01'),
        level: 'intermediario',
        objectives: 'Test objectives'
      }

      const { error } = createStudentSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('must be a valid email')
    })

    it('should accept empty optional fields', () => {
      const validData = {
        name: 'João Silva',
        email: '',
        phone: '',
        birthDate: new Date('2000-01-01'),
        level: 'intermediario',
        objectives: 'Test objectives',
        medicalNotes: ''
      }

      const { error } = createStudentSchema.validate(validData)
      expect(error).toBeUndefined()
    })
  })

  describe('updateStudentSchema', () => {
    it('should validate partial update data', () => {
      const validData = {
        name: 'João Silva Updated',
        level: 'avancado'
      }

      const { error } = updateStudentSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    it('should allow empty update', () => {
      const { error } = updateStudentSchema.validate({})
      expect(error).toBeUndefined()
    })
  })

  describe('studentFiltersSchema', () => {
    it('should validate search filters', () => {
      const validFilters = {
        search: 'João',
        level: 'intermediario',
        page: 1,
        limit: 20
      }

      const { error } = studentFiltersSchema.validate(validFilters)
      expect(error).toBeUndefined()
    })

    it('should apply default values', () => {
      const { error, value } = studentFiltersSchema.validate({})
      expect(error).toBeUndefined()
      expect(value.page).toBe(1)
      expect(value.limit).toBe(20)
    })

    it('should reject invalid page number', () => {
      const invalidFilters = {
        page: 0 // Must be at least 1
      }

      const { error } = studentFiltersSchema.validate(invalidFilters)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('must be greater than or equal to 1')
    })

    it('should reject excessive limit', () => {
      const invalidFilters = {
        limit: 200 // Max is 100
      }

      const { error } = studentFiltersSchema.validate(invalidFilters)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('must be less than or equal to 100')
    })
  })

  describe('changeLevelSchema', () => {
    it('should validate level change data', () => {
      const validData = {
        newLevel: 'avancado',
        reason: 'Demonstrou excelente progresso técnico',
        changedBy: '123e4567-e89b-12d3-a456-426614174000'
      }

      const { error } = changeLevelSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    it('should require newLevel', () => {
      const invalidData = {
        reason: 'Some reason'
      }

      const { error } = changeLevelSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('required')
    })

    it('should reject invalid level', () => {
      const invalidData = {
        newLevel: 'expert' // Invalid level
      }

      const { error } = changeLevelSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('must be one of')
    })

    it('should accept optional fields', () => {
      const validData = {
        newLevel: 'intermediario'
      }

      const { error } = changeLevelSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    it('should reject invalid UUID for changedBy', () => {
      const invalidData = {
        newLevel: 'avancado',
        changedBy: 'invalid-uuid'
      }

      const { error } = changeLevelSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error?.details[0].message).toContain('must be a valid GUID')
    })
  })
})