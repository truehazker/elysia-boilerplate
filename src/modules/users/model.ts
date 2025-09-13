import Elysia, { t } from "elysia";
import { userCreate, userSelect, userUpdate } from "@/db/schema/users";

export namespace UsersModel {
  // Create user
  export const createRequest = t.Omit(userCreate, ['id', 'createdAt', 'updatedAt'])
  export type createRequest = typeof createRequest.static

  export const createResponse = t.Omit(userSelect, ['createdAt', 'updatedAt'])
  export type createResponse = typeof createResponse.static
  
  export const createError = t.Literal('Failed to create user')
  export type createError = typeof createError.static

  // Get users
  export const getQuery = t.Object({
    limit: t.Number({ default: 100, minimum: 1, maximum: 100, examples: [100] }),
    offset: t.Number({ default: 0, minimum: 0, examples: [0] })
  })
  export type getQuery = typeof getQuery.static

  export const getResponse = t.Object({
    users: t.Array(t.Omit(userSelect, ['createdAt', 'updatedAt'])),
    total: t.Number()
  })
  export type getResponse = typeof getResponse.static

  export const getError = t.Literal('Failed to get users')
  export type getError = typeof getError.static
}
