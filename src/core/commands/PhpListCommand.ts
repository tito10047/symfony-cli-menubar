import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';
import { LoggerInterface } from '../interfaces/LoggerInterface';

export interface PhpVersion {
    version: string;
    path: string;
    isDefault: boolean;
}

export class PhpListCommand implements SymfonyCommandInterface<PhpVersion[]> {
    private logger?: LoggerInterface;

    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'local:php:list';
    }

    setLogger(logger: LoggerInterface): void {
        this.logger = logger;
    }

    async execute(args: string[] = []): Promise<PhpVersion[]> {
        const commandName = this.getName();
        this.logger?.info(`Executing command ${commandName}`);

        try {
            const commandArgs = ['local:php:list', '--no-ansi', ...args];
            const output = await this.processRunner.run(commandArgs);

            if (!output || output.trim() === '') {
                this.logger?.warn(`No PHP versions found (empty output) for ${commandName}`);
            }

            const versions: PhpVersion[] = [];
            const lines = output.split('\n');
            
            const versionRegex = /(\d+\.\d+(?:\.\d+)?)/;
            const pathRegex = /(\/[^\s│|]+)/;

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('─') || trimmed.startsWith('┌') ||
                    trimmed.startsWith('└') || trimmed.startsWith('├') || trimmed.includes('Version')) {
                    continue;
                }

                const versionMatch = trimmed.match(versionRegex);
                if (!versionMatch) continue;

                const version = versionMatch[1];
                const isDefault = trimmed.toLowerCase().includes('default') ||
                                  trimmed.includes('*') ||
                                  trimmed.includes('⭐');

                const pathMatch = trimmed.match(pathRegex);
                const path = pathMatch ? pathMatch[1] : '';

                if (!versions.find(v => v.version === version)) {
                    versions.push({
                        version,
                        path,
                        isDefault
                    });
                }
            }

            if (versions.length === 0 && output.trim() !== '') {
                this.logger?.warn(`No PHP versions found in output of ${commandName}`);
            }

            return versions;
        } catch (error) {
            this.logger?.error(`Command ${commandName} failed`, error);
            throw error;
        }
    }
}
