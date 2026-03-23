import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';
import { errorHandler } from '../middleware/error-handler';
import { users } from '../modules/users/index';
import { UsersService } from '../modules/users/service';

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
}

const mockUsersService = {
  create: mock<() => Promise<User | null>>(() =>
    Promise.resolve({
      id: '0199477e-7aa7-7000-a65a-96e2efd46c10',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
    }),
  ),
  get: mock(() =>
    Promise.resolve({
      users: [
        {
          id: '0199477e-7aa7-7000-a65a-96e2efd46c10',
          name: 'John',
          surname: 'Doe',
          email: 'john.doe@example.com',
        },
      ],
      total: 1,
    }),
  ),
};

Object.assign(UsersService, mockUsersService);

const app = new Elysia().use(errorHandler).use(users);

describe('Users Module', () => {
  beforeEach(() => {
    mockUsersService.create.mockClear();
    mockUsersService.get.mockClear();
  });

  describe('POST /users', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
      };

      const response = await app.handle(
        new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        }),
      );
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('name', 'John');
      expect(responseData).toHaveProperty('surname', 'Doe');
      expect(responseData).toHaveProperty('email', 'john.doe@example.com');

      expect(mockUsersService.create).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await app.handle(
        new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'John' }),
        }),
      );
      expect(response.status).toBe(400);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await app.handle(
        new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John',
            surname: 'Doe',
            email: 'not-an-email',
          }),
        }),
      );
      expect(response.status).toBe(400);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should return 409 on duplicate email', async () => {
      mockUsersService.create.mockResolvedValueOnce(null);

      const response = await app.handle(
        new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John',
            surname: 'Doe',
            email: 'dupe@example.com',
          }),
        }),
      );
      expect(response.status).toBe(409);

      const body = (await response.json()) as { message: string };
      expect(body.message).toBe('User could not be created due to a conflict');
    });

    it('should return 500 for unexpected errors', async () => {
      mockUsersService.create.mockRejectedValueOnce(
        new Error('connection lost'),
      );

      const response = await app.handle(
        new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John',
            surname: 'Doe',
            email: 'test@example.com',
          }),
        }),
      );
      expect(response.status).toBe(500);
    });
  });

  describe('GET /users', () => {
    it('should get all users successfully', async () => {
      const response = await app.handle(new Request('http://localhost/users'));
      expect(response.status).toBe(200);

      const responseData = (await response.json()) as {
        users: unknown[];
        total: number;
      };
      expect(responseData).toHaveProperty('users');
      expect(responseData).toHaveProperty('total');
      expect(Array.isArray(responseData.users)).toBe(true);
      expect(typeof responseData.total).toBe('number');

      expect(mockUsersService.get).toHaveBeenCalled();
    });
  });
});
