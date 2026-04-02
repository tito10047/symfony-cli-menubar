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
        const commandArgs = ['server:list', '--format=json', ...args];
        const output = await this.processRunner.run(commandArgs);

        try {
            const parsed = JSON.parse(output) as SymfonyCliServer[];
            return parsed.map((server) => ({
                directory: server.dir,
                port: server.port,
                url: `${server.scheme}://${server.host}:${server.port}`,
                isRunning: server.isRunning,
                pid: server.pid,
                phpVersion: server.php,
            }));
        } catch (e) {
            return [];
        }
    }
}
