import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export class ServerStartCommand implements SymfonyCommandInterface<string> {
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'server:start';
    }

    async execute(args: string[] = []): Promise<string> {
        const commandArgs = ['server:start', '-d', ...args];
        return await this.processRunner.run(commandArgs);
    }
}
