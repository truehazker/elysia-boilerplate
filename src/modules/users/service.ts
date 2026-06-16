import { asc, gt } from 'drizzle-orm';
import db from '../../db';
import { users } from '../../db/schema/users';
import type { UsersModel } from './model';

// Cursor is the last row's UUIDv7 id — monotonic, so it doubles as the sort key.
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
    const res = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
      })
      .from(users)
      .where(params.cursor ? gt(users.id, params.cursor) : undefined)
      .orderBy(asc(users.id))
      .limit(params.limit);

    const last = res.length === params.limit ? res.at(-1) : undefined;
    return {
      users: res,
      nextCursor: last?.id ?? null,
    };
  }
}
