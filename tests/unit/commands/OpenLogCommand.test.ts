import { OpenLogCommand } from '../../../src/core/commands/OpenLogCommand';
import { ProcessRunnerInterface } from '../../../src/core/interfaces/ProcessRunnerInterface';
import { LoggerInterface } from '../../../src/core/interfaces/LoggerInterface';

describe('OpenLogCommand', () => {
    let mockProcessRunner: jest.Mocked<ProcessRunnerInterface>;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let command: OpenLogCommand;

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
        command = new OpenLogCommand(mockProcessRunner);
        command.setLogger(mockLogger);
    });

    it('should have the correct name', () => {
        expect(command.getName()).toBe('open:log');
    });

    it('should return symfony server:log command with project directory', async () => {
        const projectPath = '/home/user/my-project';
        const result = await command.execute([projectPath]);

        expect(result).toBe(`symfony server:log --dir=${projectPath}`);
    });

    it('should throw error if project directory is missing', async () => {
        await expect(command.execute([])).rejects.toThrow('Project directory is required');
    });
});
