import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';
import { LoggerInterface } from '../interfaces/LoggerInterface';

export class ProxyUrlCommand implements SymfonyCommandInterface<string> {
    private logger?: LoggerInterface;

    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'proxy:url';
    }

    setLogger(logger: LoggerInterface): void {
        this.logger = logger;
    }

    async execute(args: string[] = []): Promise<string> {
        const commandName = this.getName();
        this.logger?.info(`Executing command ${commandName}`);

        try {
            const commandArgs = ['proxy:url', '--no-ansi', ...args];
            const output = await this.processRunner.run(commandArgs);
            return output.trim();
        } catch (error) {
            this.logger?.error(`Command ${commandName} failed`, error);
            throw error;
        }
    }
}
