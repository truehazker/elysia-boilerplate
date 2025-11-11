import { Elysia } from 'elysia'

import { UsersService } from './service'
import { log } from '../../common/logger'
import { UsersModel, usersModelPlugin } from './model'


export const users = new Elysia({ prefix: '/users', tags: ['Users'] })
  .use(log.into())
  .use(usersModelPlugin)
  .post(
    '/',
    async ({ log, body }): Promise<UsersModel.createResponse> => {
      const user = await UsersService.create(body)
      log.info(`Created user ${user.name}`)
      return user;
    },
    {
      body: 'users.createRequest',
      response: {
        200: 'users.createResponse',
        422: 'users.createError',
      },
      detail: {
        summary: 'Create a new user',
        description: 'Create a new user in the database with name and surname.'
      }
    }
  )
  .get(
    '/',
    async ({ query }): Promise<UsersModel.getResponse> => {
      const users = await UsersService.get(query)
      return users;
    },
    {
      query: 'users.getQuery',
      response: {
        200: 'users.getResponse',
        422: 'users.getError',
      },
      detail: {
        summary: 'Get all users',
        description: 'Get all users from the database with name and surname.'
      }
    }
  )
