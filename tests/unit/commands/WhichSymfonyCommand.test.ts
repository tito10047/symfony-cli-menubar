import { WhichSymfonyCommand } from '../../../src/core/commands/WhichSymfonyCommand';
import { ProcessRunnerInterface } from '../../../src/core/interfaces/ProcessRunnerInterface';
import { LoggerInterface } from '../../../src/core/interfaces/LoggerInterface';

describe('WhichSymfonyCommand', () => {
    let mockProcessRunner: jest.Mocked<ProcessRunnerInterface>;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let command: WhichSymfonyCommand;

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
        command = new WhichSymfonyCommand(mockProcessRunner);
        command.setLogger(mockLogger);
    });

    it('should have the correct name', () => {
        expect(command.getName()).toBe('which');
    });

    it('should execute which symfony', async () => {
        const mockOutput = '/usr/local/bin/symfony\n';
        mockProcessRunner.run.mockResolvedValue(mockOutput);

        const result = await command.execute();

        expect(mockProcessRunner.run).toHaveBeenCalledWith(['/usr/bin/which', 'symfony']);
        expect(result).toEqual({ path: '/usr/local/bin/symfony' });
    });

    it('should return null path if not found', async () => {
        mockProcessRunner.run.mockRejectedValue(new Error('not found'));

        const result = await command.execute();

        expect(result).toEqual({ path: null });
    });
});
