import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export class VersionCommand implements SymfonyCommandInterface<string> {
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'version';
    }

    async execute(args: string[] = []): Promise<string> {
        const commandArgs = ['version', '--no-ansi', ...args];
        const output = await this.processRunner.run(commandArgs);

        const match = output.match(/Symfony CLI (?:version|v)?\s*(\d+\.\d+\.\d+)/i);
        if (match) {
            return match[1];
        }

        return output.trim();
    }
}
