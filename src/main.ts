import { Elysia } from "elysia";
import { log } from "@/modules/common/logger";
import config from "./modules/common/config";
import openapi from "@elysiajs/openapi";
import { users } from "./modules/users";
import { fromTypes } from "@elysiajs/openapi/gen";
import db from "./db";

const app = new Elysia()
  .use(log.into({
    useLevel: config.LOG_LEVEL,
    autoLogging: false,
  }))
  .onError((ctx) => {
    log.error(ctx.error)
  })
  .onStart(() => {
    db.$client.connect().then(() => {
      log.info("Database connected")
    }).catch((err: Error) => {
      log.error(err, "Failed to connect to database");
      process.exit(1);
    })
  })
  .use(openapi({
    documentation: {
      info: {
        title: "Elysia Boilerplate",
        version: "0.0.0",
        description: "Elysia Boilerplate is a simple boilerplate for Elysia"
      },
    },
    references: fromTypes('src/main.ts')
  }))
  .use(users)
  .listen(config.SERVER_PORT, ({ development, hostname, port }) => {
    log.info(
      `🦊 Elysia is running at ${hostname}:${port} ${
        development ? "🚧 in development mode!🚧" : ""
      }`,
    )
  });

process.once("SIGINT", () => {
  log.info("SIGINT received, shutting down...");
  app.stop();
  db.$client.end();
  process.exit(0);
});

process.once("SIGTERM", () => {
  log.info("SIGTERM received, shutting down...");
  app.stop();
  db.$client.end();
  process.exit(0);
});
  