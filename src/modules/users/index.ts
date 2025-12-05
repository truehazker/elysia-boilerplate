import { Elysia, status } from 'elysia';
import { log as logger } from 'src/common/logger';
import { type UsersModel, usersModelPlugin } from './model';
import { UsersService } from './service';

const log = logger.child({ name: 'users' });

export const users = new Elysia({ prefix: '/users', tags: ['Users'] })
  .use(usersModelPlugin)
  .post(
    '/',
    async ({ body }): Promise<UsersModel.createResponse> => {
      try {
        const user = await UsersService.create(body);
        log.info(`Created user ${user.name}`);
        return user;
      } catch {
        throw status(422, {
          message: 'Failed to create user' satisfies UsersModel.createError,
        });
      }
    },
    {
      body: 'users.createRequest',
      response: {
        200: 'users.createResponse',
        422: 'users.createError',
      },
      detail: {
        summary: 'Create a new user',
        description: 'Create a new user in the database with name and surname.',
      },
    },
  )
  .get(
    '/',
    async ({ query }): Promise<UsersModel.getResponse> => {
      try {
        const users = await UsersService.get(query);
        log.info(`Got users ${users.total}`);
        return users;
      } catch {
        throw status(422, {
          message: 'Failed to get users' satisfies UsersModel.getError,
        });
      }
    },
    {
      query: 'users.getQuery',
      response: {
        200: 'users.getResponse',
        422: 'users.getError',
      },
      detail: {
        summary: 'Get all users',
        description: 'Get all users from the database with name and surname.',
      },
    },
  );
