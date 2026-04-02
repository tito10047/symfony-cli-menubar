import { SymfonyCliManager } from '../../src/core/SymfonyCliManager';
import { SymfonyCommandInterface } from '../../src/core/interfaces/SymfonyCommandInterface';

describe('SymfonyCliManager', () => {
    let manager: SymfonyCliManager;

    beforeEach(() => {
        manager = new SymfonyCliManager();
    });

    it('should register and run a command', async () => {
        const mockCommand: jest.Mocked<SymfonyCommandInterface<string>> = {
            getName: jest.fn().mockReturnValue('test:command'),
            execute: jest.fn().mockResolvedValue('command result'),
        };

        manager.registerCommand(mockCommand);
        const result = await manager.runCommand('test:command');

        expect(result).toBe('command result');
        expect(mockCommand.execute).toHaveBeenCalled();
    });

    it('should throw error when command is not registered', async () => {
        await expect(manager.runCommand('unknown:command'))
            .rejects.toThrow('Command unknown:command not found');
    });

    it('should pass arguments to command', async () => {
        const mockCommand: jest.Mocked<SymfonyCommandInterface<string>> = {
            getName: jest.fn().mockReturnValue('test:args'),
            execute: jest.fn().mockImplementation((args?: string[]) => {
                return Promise.resolve(`result with ${args?.join(',')}`);
            }),
        };

        manager.registerCommand(mockCommand);
        const result = await manager.runCommand('test:args', ['arg1', 'arg2']);

        expect(result).toBe('result with arg1,arg2');
        expect(mockCommand.execute).toHaveBeenCalledWith(['arg1', 'arg2']);
    });
});
