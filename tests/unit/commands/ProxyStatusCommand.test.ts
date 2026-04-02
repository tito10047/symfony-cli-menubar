import { ProxyStatusCommand } from '../../../src/core/commands/ProxyStatusCommand';
import { ProcessRunnerInterface } from '../../../src/core/interfaces/ProcessRunnerInterface';

describe('ProxyStatusCommand', () => {
    let mockProcessRunner: jest.Mocked<ProcessRunnerInterface>;
    let command: ProxyStatusCommand;

    beforeEach(() => {
        mockProcessRunner = {
            run: jest.fn(),
        };
        command = new ProxyStatusCommand(mockProcessRunner);
    });

    it('should have the correct name', () => {
        expect(command.getName()).toBe('proxy:status');
    });

    it('should parse proxy status output', async () => {
        const mockOutput = `
The local proxy is running

┌────────────────┬──────────────────────────────────────┐
│ Domain         │ Directory                            │
├────────────────┼──────────────────────────────────────┤
│ my-project.wip │ /home/user/projects/my-project       │
│ another.wip    │ /home/user/projects/another          │
└────────────────┴──────────────────────────────────────┘
`;
        mockProcessRunner.run.mockResolvedValue(mockOutput);

        const result = await command.execute();

        expect(mockProcessRunner.run).toHaveBeenCalledWith(['proxy:status', '--no-ansi']);
        expect(result.isRunning).toBe(true);
        expect(result.proxies).toHaveLength(2);
        
        expect(result.proxies[0]).toEqual({
            domain: "my-project.wip",
            directory: "/home/user/projects/my-project"
        });

        expect(result.proxies[1]).toEqual({
            domain: "another.wip",
            directory: "/home/user/projects/another"
        });
    });

    it('should handle proxy not running', async () => {
        const mockOutput = "The local proxy is not running";
        mockProcessRunner.run.mockResolvedValue(mockOutput);

        const result = await command.execute();

        expect(result.isRunning).toBe(false);
        expect(result.proxies).toHaveLength(0);
    });
});
