import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export interface SymfonyServer {
    directory: string;
    port: number;
    url: string;
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
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'server:list';
    }

    async execute(args: string[] = []): Promise<SymfonyServer[]> {
        const commandArgs = ['server:list', '--no-ansi', ...args];
        const output = await this.processRunner.run(commandArgs);

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
            const url = isRunning ? `https://127.0.0.1:${port}` : '';

            servers.push({
                directory,
                port,
                url,
                isRunning
            });
        }

        return servers;
    }
}
