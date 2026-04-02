import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export class ProxyStartCommand implements SymfonyCommandInterface<string> {
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'proxy:start';
    }

    async execute(args: string[] = []): Promise<string> {
        const commandArgs = ['proxy:start', '--no-ansi', ...args];
        return await this.processRunner.run(commandArgs);
    }
}
