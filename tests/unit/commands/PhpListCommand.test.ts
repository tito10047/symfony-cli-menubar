import { PhpListCommand } from '../../../src/core/commands/PhpListCommand';
import { ProcessRunnerInterface } from '../../../src/core/interfaces/ProcessRunnerInterface';

describe('PhpListCommand', () => {
    let mockProcessRunner: jest.Mocked<ProcessRunnerInterface>;
    let command: PhpListCommand;

    beforeEach(() => {
        mockProcessRunner = {
            run: jest.fn(),
        };
        command = new PhpListCommand(mockProcessRunner);
    });

    it('should have the correct name', () => {
        expect(command.getName()).toBe('local:php:list');
    });

    it('should parse text output from symfony local:php:list', async () => {
        const mockOutput = `
┌─────────┬──────────────────────────────┬─────────┐
│ Version │ PHP CLI                      │ PHP-FPM │
├─────────┼──────────────────────────────┼─────────┤
│ 8.2.0   │ /usr/bin/php8.2              │         │
│ 8.1.0 * │ /usr/bin/php8.1              │         │
│ 7.4.33  │ /usr/local/bin/php7.4        │         │
└─────────┴──────────────────────────────┴─────────┘
`;
        mockProcessRunner.run.mockResolvedValue(mockOutput);

        const result = await command.execute();

        expect(mockProcessRunner.run).toHaveBeenCalledWith(['local:php:list', '--no-ansi']);
        expect(result).toHaveLength(3);
        
        expect(result[0]).toEqual({
            version: "8.2.0",
            path: "/usr/bin/php8.2",
            isDefault: false
        });

        expect(result[1]).toEqual({
            version: "8.1.0",
            path: "/usr/bin/php8.1",
            isDefault: true
        });

        expect(result[2]).toEqual({
            version: "7.4.33",
            path: "/usr/local/bin/php7.4",
            isDefault: false
        });
    });

    it('should handle different default indicators', async () => {
        const mockOutput = `
  8.2.0 (default)  /usr/bin/php8.2
  8.1.0 ⭐         /usr/bin/php8.1
`;
        mockProcessRunner.run.mockResolvedValue(mockOutput);

        const result = await command.execute();

        expect(result).toHaveLength(2);
        expect(result[0].isDefault).toBe(true);
        expect(result[1].isDefault).toBe(true);
    });
});
