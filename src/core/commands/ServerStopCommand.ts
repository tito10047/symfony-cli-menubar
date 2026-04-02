import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export class ServerStopCommand implements SymfonyCommandInterface<string> {
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'server:stop';
    }

    async execute(args: string[] = []): Promise<string> {
        const commandArgs = ['server:stop', ...args];
        return await this.processRunner.run(commandArgs);
    }
}
