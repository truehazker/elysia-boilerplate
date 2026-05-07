import { asc, count } from 'drizzle-orm';
import db from '../../db';
import { users } from '../../db/schema/users';
import type { UsersModel } from './model';

export abstract class UsersService {
  static async create(
    body: UsersModel.createRequest,
  ): Promise<UsersModel.createResponse | null> {
    const [user] = await db
      .insert(users)
      .values(body)
      .onConflictDoNothing({ target: users.email })
      .returning();

    return user ?? null;
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
      .orderBy(asc(users.createdAt), asc(users.id))
      .limit(params.limit)
      .offset(params.offset);

    return {
      users: res,
      total: total?.count ?? 0,
    };
  }
}
