import db from "../../db";
import { users } from "../../db/schema/users";
import { status } from "elysia";
import type { UsersModel } from "./model";
import { count } from "drizzle-orm";


export abstract class UsersService {
  static async create(body: UsersModel.createRequest): Promise<UsersModel.createResponse> {
    const user = await handleDbOperation(
      () => db.insert(users)
        .values({ ...body })
        .returning(),
      "Failed to create user" satisfies UsersModel.createError
    );

    return user;
  }

  static async get(params: UsersModel.getQuery): Promise<UsersModel.getResponse> {
    const [total] = await db.select({ count: count() }).from(users);

    const res = await db.select({
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
      total: total?.count ?? 0
    };
  }
}

const createErrorResponse = (message: string, statusCode: number = 422) => {
  throw status(statusCode, { message });
};

const handleDbOperation = async <T>(
  operation: () => Promise<T[]>,
  errorMessage: string
): Promise<T> => {
  const result = await operation();
  if (!result || result.length === 0) {
    createErrorResponse(errorMessage);
  }
  return result[0]!; // Non-null assertion since we check for empty array above
};