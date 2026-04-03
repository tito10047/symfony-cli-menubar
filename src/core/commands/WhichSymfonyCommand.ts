import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';
import { WhichResponse } from '../dto/WhichResponse';
import { LoggerInterface } from '../interfaces/LoggerInterface';

export class WhichSymfonyCommand implements SymfonyCommandInterface<WhichResponse> {
    private logger?: LoggerInterface;

    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'which';
    }

    setLogger(logger: LoggerInterface): void {
        this.logger = logger;
    }

    async execute(args: string[] = []): Promise<WhichResponse> {
        const commandName = this.getName();
        this.logger?.info(`Executing command ${commandName}`);

        try {
            const output = await this.processRunner.run(['/usr/bin/which', 'symfony']);
            const path = output.trim();
            if (!path) {
                this.logger?.warn(`Command ${commandName} returned empty path`);
            }
            return { path };
        } catch (error) {
            this.logger?.error(`Command ${commandName} failed`, error);
            return { path: null };
        }
    }
}
