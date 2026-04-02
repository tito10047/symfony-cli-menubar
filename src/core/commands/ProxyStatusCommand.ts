import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export interface SymfonyProxy {
    domain: string;
    directory: string;
}

export interface ProxyStatus {
    isRunning: boolean;
    proxies: SymfonyProxy[];
}

export class ProxyStatusCommand implements SymfonyCommandInterface<ProxyStatus> {
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'proxy:status';
    }

    async execute(args: string[] = []): Promise<ProxyStatus> {
        const commandArgs = ['proxy:status', '--no-ansi', ...args];
        const output = await this.processRunner.run(commandArgs);
        
        const lines = output.split('\n');
        let isRunning = false;
        
        // Check first few lines for status
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const line = lines[i].toLowerCase();
            if (line.includes('listening') || line.includes('proxy is running')) {
                isRunning = true;
                break;
            }
        }

        const proxies: SymfonyProxy[] = [];
        
        const domainRegex = /([a-zA-Z0-9.\-]+\.wip)/;
        const pathRegex = /([~/][^\s|│]+)/;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('+') || trimmed.startsWith('-') ||
                trimmed.startsWith('┌') || trimmed.startsWith('└') || trimmed.startsWith('├') ||
                trimmed.includes('Domain') || trimmed.includes('Directory')) {
                continue;
            }

            const domainMatch = trimmed.match(domainRegex);
            if (!domainMatch) continue;

            const domain = domainMatch[1];
            const pathMatch = trimmed.match(pathRegex);
            const directory = pathMatch ? pathMatch[1] : '';

            if (!proxies.find(p => p.domain === domain)) {
                proxies.push({ domain, directory });
            }
        }

        return { isRunning, proxies };
    }
}
