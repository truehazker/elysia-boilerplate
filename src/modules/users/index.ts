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
      const user = await UsersService.create(body);
      if (!user) {
        throw status(409, {
          message: 'User could not be created due to a conflict',
        } satisfies UsersModel.createError);
      }
      log.info(`Created user ${user.name}`);
      return user;
    },
    {
      body: 'users.createRequest',
      response: {
        200: 'users.createResponse',
        409: 'users.createError',
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
      const users = await UsersService.get(query);
      log.info(`Got users ${users.total}`);
      return users;
    },
    {
      query: 'users.getQuery',
      response: {
        200: 'users.getResponse',
      },
      detail: {
        summary: 'Get all users',
        description: 'Get all users from the database with name and surname.',
      },
    },
  );
