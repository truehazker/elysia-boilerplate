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
  .use(openapi({
    documentation: {
      info: {
        title: "Elysia Boilerplate",
        version: "0.1.0",
        description: "A simple boilerplate service for Elysia"
      },
      servers: [
        {
          url: `http://${config.SERVER_HOSTNAME}:${config.SERVER_PORT}`,
          description: "Local development server",
        },
      ],
    }
  }))
  .use(users)
  .listen(config.SERVER_PORT, ({ development, hostname, port }) => {
    log.info(
      `🦊 Elysia is running at ${hostname}:${port} ${development ? "🚧 in development mode!🚧" : ""}`,
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
  