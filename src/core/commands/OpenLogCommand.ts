import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';
import { LoggerInterface } from '../interfaces/LoggerInterface';

export class OpenLogCommand implements SymfonyCommandInterface<string> {
    private logger?: LoggerInterface;

    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'open:log';
    }

    setLogger(logger: LoggerInterface): void {
        this.logger = logger;
    }

    async execute(args: string[] = []): Promise<string> {
        try {
            if (!args || args.length === 0) {
                throw new Error('Project directory is required');
            }

            const projectPath = args[0];
            this.logger?.info(`Preparing log command for project: ${projectPath}`);

            return `symfony server:log --dir=${projectPath}`;
        } catch (error) {
            this.logger?.error(`Command ${this.getName()} failed: ${error}`);
            throw error;
        }
    }
}
