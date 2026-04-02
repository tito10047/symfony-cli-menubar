import { WhichSymfonyCommand } from '../../../src/core/commands/WhichSymfonyCommand';
import { ProcessRunnerInterface } from '../../../src/core/interfaces/ProcessRunnerInterface';

describe('WhichSymfonyCommand', () => {
    let mockProcessRunner: jest.Mocked<ProcessRunnerInterface>;
    let command: WhichSymfonyCommand;

    beforeEach(() => {
        mockProcessRunner = {
            run: jest.fn(),
        };
        command = new WhichSymfonyCommand(mockProcessRunner);
    });

    it('should have the correct name', () => {
        expect(command.getName()).toBe('which');
    });

    it('should execute which symfony', async () => {
        const mockOutput = '/usr/local/bin/symfony\n';
        mockProcessRunner.run.mockResolvedValue(mockOutput);

        const result = await command.execute();

        expect(mockProcessRunner.run).toHaveBeenCalledWith(['/usr/bin/which', 'symfony']);
        expect(result).toBe('/usr/local/bin/symfony');
    });

    it('should return empty string if not found', async () => {
        mockProcessRunner.run.mockRejectedValue(new Error('not found'));

        const result = await command.execute();

        expect(result).toBe('');
    });
});
