import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';
import { LoggerInterface } from '../interfaces/LoggerInterface';
import { PhpInfo } from '../dto/PhpInfo';

export class PhpInfoCommand implements SymfonyCommandInterface<PhpInfo> {
    private logger?: LoggerInterface;

    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'php:info';
    }

    setLogger(logger: LoggerInterface): void {
        this.logger = logger;
    }

    async execute(args: string[] = []): Promise<PhpInfo> {
        const commandName = this.getName();
        
        // Use the first argument if provided, otherwise assume the runner is already configured with the correct binary
        const runArgsIni = args.length > 0 ? [args[0], '--ini'] : ['--ini'];
        const runArgsM = args.length > 0 ? [args[0], '-m'] : ['-m'];

        const phpLabel = args.length > 0 ? ` for PHP: ${args[0]}` : '';
        this.logger?.info(`Executing command ${commandName}${phpLabel}`);

        try {
            const iniOutput = await this.processRunner.run(runArgsIni);
            const modulesOutput = await this.processRunner.run(runArgsM);

            const phpIniPath = this.parseIniPath(iniOutput);
            const modules = modulesOutput.toLowerCase();

            return {
                phpIniPath,
                hasXdebug: modules.includes('xdebug'),
                hasApcu: modules.includes('apcu'),
                hasOpcache: modules.includes('opcache')
            };
        } catch (error) {
            this.logger?.error(`Command ${commandName} failed`, error);
            throw error;
        }
    }

    private parseIniPath(output: string): string {
        const loadedMatch = output.match(/Loaded Configuration File:\s+(.+)/);
        if (loadedMatch && loadedMatch[1].trim() !== '(none)') {
            return loadedMatch[1].trim();
        }

        const pathMatch = output.match(/Configuration File \(php\.ini\) Path:\s+(.+)/);
        if (pathMatch) {
            return pathMatch[1].trim();
        }

        return '';
    }
}
