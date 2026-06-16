import { Command } from 'commander';
import packageJson from '../package.json';

/**
 * CLI entrypoint and `bun build --compile` target. Commands are lazily
 * imported (literal specifiers) so `migrate` skips the route graph.
 */
export function buildProgram(): Command {
  const program = new Command();

  program
    .name('elysia-boilerplate')
    .description('Elysia boilerplate server CLI')
    .version(packageJson.version);

  program
    .command('serve')
    .description('Run the HTTP server (long-lived)')
    .action(async () => {
      const { serve } = await import('./commands/serve');
      await serve();
    });

  program
    .command('migrate')
    .description('Apply pending database migrations, then exit')
    .action(async () => {
      const { migrate } = await import('./commands/migrate');
      await migrate();
    });

  return program;
}

// Don't dispatch on import (keeps buildProgram testable).
if (import.meta.main) {
  buildProgram()
    .parseAsync()
    .catch(async (error) => {
      // Lazy import keeps `--help`/`--version` env-free.
      const { log } = await import('./common/logger');
      log.fatal({ err: error }, 'Command failed');
      process.exit(1);
    });
}

export type { App } from './app';
