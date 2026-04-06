import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';
import { LoggerInterface } from '../interfaces/LoggerInterface';

export interface SymfonyServer {
    directory: string;
    port: number;
    url: string;
    domain?: string;
    isRunning: boolean;
    pid?: number;
    phpVersion?: string;
}

interface SymfonyCliServer {
    dir: string;
    port: number;
    scheme: string;
    host: string;
    isRunning: boolean;
    pid?: number;
    php?: string;
}

export class ServerListCommand implements SymfonyCommandInterface<SymfonyServer[]> {
    private logger?: LoggerInterface;

    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'server:list';
    }

    setLogger(logger: LoggerInterface): void {
        this.logger = logger;
    }

    async execute(args: string[] = []): Promise<SymfonyServer[]> {
        const commandName = this.getName();
        this.logger?.info(`Executing command ${commandName}`);

        try {
            const commandArgs = ['server:list', '--no-ansi', ...args];
            const output = await this.processRunner.run(commandArgs);

            if (!output || output.trim() === '') {
                this.logger?.warn(`No servers found (empty output) for ${commandName}`);
            }

            const servers: SymfonyServer[] = [];
            const lines = output.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('+') || trimmed.startsWith('-') ||
                    trimmed.includes('Directory') || !trimmed.includes('|')) {
                    continue;
                }

                const columns = trimmed.split('|')
                    .map(c => c.trim())
                    .filter(c => c !== '');

                if (columns.length < 2) continue;

                const directory = columns[0];
                const portStr = columns[1];
                const domain = columns.length >= 3 && columns[2] ? columns[2] : undefined;

                let port = 8000;
                let isRunning = false;

                if (portStr.toLowerCase() === 'not running') {
                    isRunning = false;
                } else {
                    const p = parseInt(portStr, 10);
                    if (!isNaN(p)) {
                        port = p;
                        isRunning = true;
                    }
                }

                // URL
                const url = isRunning
                    ? (domain ? `https://${domain}` : `https://127.0.0.1:${port}`)
                    : '';

                servers.push({
                    directory,
                    port,
                    url,
                    domain,
                    isRunning
                });
            }

            if (servers.length === 0 && output.trim() !== '') {
                this.logger?.warn(`No servers found in output of ${commandName}`);
            }

            return servers;
        } catch (error) {
            this.logger?.error(`Command ${commandName} failed`, error);
            throw error;
        }
    }
}
