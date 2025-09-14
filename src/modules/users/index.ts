import { Elysia } from 'elysia'

import { UsersService } from '@/modules/users/service'
import { log } from '@/modules/common/logger'
import { UsersModel } from '@/modules/users/model'

export const users = new Elysia({ prefix: '/users' })
  .use(log.into())
  .post(
    '/',
    async ({ body }) => {
      const user = await UsersService.create(body)
      log.info(`Created user ${user.name}`)
      return user;
    },
    {
      body: UsersModel.createRequest,
      response: {
        200: UsersModel.createResponse,
        422: UsersModel.createError,
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
      query: UsersModel.getQuery,
      response: {
        200: UsersModel.getResponse,
        422: UsersModel.getError,
      },
      detail: {
        summary: 'Get all users',
        description: 'Get all users from the database with name and surname.'
      }
    }
  )
