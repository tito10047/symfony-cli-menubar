import { ServerListCommand } from '../../../src/core/commands/ServerListCommand';
import { ProcessRunnerInterface } from '../../../src/core/interfaces/ProcessRunnerInterface';

describe('ServerListCommand', () => {
    let mockProcessRunner: jest.Mocked<ProcessRunnerInterface>;
    let command: ServerListCommand;

    beforeEach(() => {
        mockProcessRunner = {
            run: jest.fn(),
        };
        command = new ServerListCommand(mockProcessRunner);
    });

    it('should have the correct name', () => {
        expect(command.getName()).toBe('server:list');
    });

    it('should parse JSON output from symfony server:list', async () => {
        const mockJsonOutput = JSON.stringify([
            {
                "dir": "/home/user/project1",
                "port": 8000,
                "scheme": "http",
                "host": "127.0.0.1",
                "isRunning": true,
                "pid": 1234,
                "php": "8.2.0"
            },
            {
                "dir": "/home/user/project2",
                "port": 8001,
                "scheme": "https",
                "host": "localhost",
                "isRunning": false
            }
        ]);

        mockProcessRunner.run.mockResolvedValue(mockJsonOutput);

        const result = await command.execute();

        expect(mockProcessRunner.run).toHaveBeenCalledWith(['server:list', '--format=json']);
        expect(result).toHaveLength(2);
        
        expect(result[0]).toEqual({
            directory: "/home/user/project1",
            port: 8000,
            url: "http://127.0.0.1:8000",
            isRunning: true,
            pid: 1234,
            phpVersion: "8.2.0"
        });

        expect(result[1]).toEqual({
            directory: "/home/user/project2",
            port: 8001,
            url: "https://localhost:8001",
            isRunning: false,
            pid: undefined,
            phpVersion: undefined
        });
    });

    it('should return empty array on invalid JSON', async () => {
        mockProcessRunner.run.mockResolvedValue('invalid json');
        const result = await command.execute();
        expect(result).toEqual([]);
    });
});
