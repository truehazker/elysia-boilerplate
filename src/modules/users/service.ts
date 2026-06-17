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
    // Over-fetch one row to tell "full page, more to come" from "full page, last one"
    // without a second count query — the extra row is the proof a next page exists.
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
      })
      .from(users)
      .where(params.cursor ? gt(users.id, params.cursor) : undefined)
      .orderBy(asc(users.id))
      .limit(params.limit + 1);

    const hasNext = rows.length > params.limit;
    const res = hasNext ? rows.slice(0, params.limit) : rows;
    return {
      users: res,
      nextCursor: hasNext ? (res.at(-1)?.id ?? null) : null,
    };
  }
}
