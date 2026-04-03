import { PhpListCommand } from '../../../src/core/commands/PhpListCommand';
import { ProcessRunnerInterface } from '../../../src/core/interfaces/ProcessRunnerInterface';
import { LoggerInterface } from '../../../src/core/interfaces/LoggerInterface';

describe('PhpListCommand', () => {
    let mockProcessRunner: jest.Mocked<ProcessRunnerInterface>;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let command: PhpListCommand;

    beforeEach(() => {
        mockProcessRunner = {
            run: jest.fn(),
        };
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        command = new PhpListCommand(mockProcessRunner);
        command.setLogger(mockLogger);
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

    it('should log warning when no versions are found', async () => {
        mockProcessRunner.run.mockResolvedValue('');

        await command.execute();

        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('No PHP versions found'));
    });

    it('should log info when command starts', async () => {
        mockProcessRunner.run.mockResolvedValue('8.2 /usr/bin/php');

        await command.execute();

        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Executing command local:php:list'));
    });

    it('should log error and throw when process runner fails', async () => {
        const error = new Error('Process failed');
        mockProcessRunner.run.mockRejectedValue(error);

        await expect(command.execute()).rejects.toThrow('Process failed');
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining('Command local:php:list failed'),
            error
        );
    });
});
