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

    it('should parse text output from symfony server:list', async () => {
        const mockOutput = `
+----------------------------+-------------+---------+
| Directory                  | Port        | Domains |
+----------------------------+-------------+---------+
| /home/user/project1        | 8000        |         |
| /home/user/project2        | Not running |         |
+----------------------------+-------------+---------+
`;

        mockProcessRunner.run.mockResolvedValue(mockOutput);

        const result = await command.execute();

        expect(mockProcessRunner.run).toHaveBeenCalledWith(['server:list', '--no-ansi']);
        expect(result).toHaveLength(2);
        
        expect(result[0]).toEqual({
            directory: "/home/user/project1",
            port: 8000,
            url: "https://127.0.0.1:8000",
            isRunning: true
        });

        expect(result[1]).toEqual({
            directory: "/home/user/project2",
            port: 8000,
            url: "",
            isRunning: false
        });
    });

    it('should return empty array on empty output', async () => {
        mockProcessRunner.run.mockResolvedValue('');
        const result = await command.execute();
        expect(result).toEqual([]);
    });
});
