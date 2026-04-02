import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export class ProxyDomainDetachCommand implements SymfonyCommandInterface<string> {
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'proxy:domain:detach';
    }

    async execute(args: string[] = []): Promise<string> {
        const commandArgs = ['proxy:domain:detach', '--no-ansi', ...args];
        return await this.processRunner.run(commandArgs);
    }
}
