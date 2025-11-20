import { count } from 'drizzle-orm';
import { status } from 'elysia';
import db from '../../db';
import { users } from '../../db/schema/users';
import type { UsersModel } from './model';

export abstract class UsersService {
  static async create(
    body: UsersModel.createRequest,
  ): Promise<UsersModel.createResponse> {
    const [user] = await db
      .insert(users)
      .values({ ...body })
      .returning();

    if (!user) {
      throw status(422, {
        message: 'Failed to create user' satisfies UsersModel.createError,
      });
    }

    return user;
  }

  static async get(
    params: UsersModel.getQuery,
  ): Promise<UsersModel.getResponse> {
    const [total] = await db.select({ count: count() }).from(users);

    const res = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
      })
      .from(users)
      .limit(params.limit)
      .offset(params.offset);

    return {
      users: res,
      total: total?.count ?? 0,
    };
  }
}
