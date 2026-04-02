import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export class ProxyStopCommand implements SymfonyCommandInterface<string> {
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'proxy:stop';
    }

    async execute(args: string[] = []): Promise<string> {
        const commandArgs = ['proxy:stop', '--no-ansi', ...args];
        return await this.processRunner.run(commandArgs);
    }
}
