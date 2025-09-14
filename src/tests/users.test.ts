import { describe, expect, it, beforeEach, mock } from 'bun:test'
import { UsersService } from '@/modules/users/service'
import { users } from '@/modules/users/index'

// Mock the UsersService
const mockUsersService = {
  create: mock(() => Promise.resolve({
    id: '0199477e-7aa7-7000-a65a-96e2efd46c10',
    name: 'John',
    surname: 'Doe',
    email: 'john.doe@example.com'
  })),
  get: mock(() => Promise.resolve({
    users: [
      {
        id: '0199477e-7aa7-7000-a65a-96e2efd46c10',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com'
      }
    ],
    total: 1
  }))
}

// Mock the service methods
Object.assign(UsersService, mockUsersService)

describe('Users Module', () => {
  beforeEach(() => {
    mockUsersService.create.mockClear()
    mockUsersService.get.mockClear()
  })

  describe('POST /users', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com'
      }

      const response = await users
        .handle(new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        }))
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData).toHaveProperty('id')
      expect(responseData).toHaveProperty('name', 'John')
      expect(responseData).toHaveProperty('surname', 'Doe')
      expect(responseData).toHaveProperty('email', 'john.doe@example.com')
      
      // Verify the service was called with correct data
      expect(mockUsersService.create).toHaveBeenCalledWith(userData)
    })

    it('should return validation error for missing required fields', async () => {
      const invalidUserData = {
        name: 'John'
        // missing surname and email
      }

      const response = await users
        .handle(new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidUserData)
        }))
      expect(response.status).toBe(422)

      expect(mockUsersService.create).not.toHaveBeenCalled()
    })
  })

  describe('GET /users', () => {
    it('should get all users successfully', async () => {
      const response = await users
        .handle(new Request('http://localhost/users'))
      expect(response.status).toBe(200)

      const responseData = await response.json() as any
      expect(responseData).toHaveProperty('users')
      expect(responseData).toHaveProperty('total')
      expect(Array.isArray(responseData.users)).toBe(true)
      expect(typeof responseData.total).toBe('number')

      expect(mockUsersService.get).toHaveBeenCalled()
    })
  })
})
