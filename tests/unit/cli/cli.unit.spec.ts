import { describe, expect, it } from 'bun:test';
import { CommanderError } from 'commander';
import { buildProgram } from 'src/cli';
import packageJson from '../../../package.json';

describe('CLI dispatcher', () => {
  it('registers the serve and migrate subcommands', () => {
    const names = buildProgram()
      .commands.map((c) => c.name())
      .sort();
    expect(names).toContain('serve');
    expect(names).toContain('migrate');
  });

  it('reports the package version', () => {
    expect(buildProgram().version()).toBe(packageJson.version);
  });

  it('rejects an unknown command instead of dispatching', async () => {
    const program = buildProgram().exitOverride();

    let error: unknown;
    try {
      await program.parseAsync(['definitely-not-a-command'], { from: 'user' });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(CommanderError);
    expect((error as CommanderError).code).toBe('commander.unknownCommand');
  });
});
