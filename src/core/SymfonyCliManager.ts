import { SymfonyCommandInterface } from './interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from './interfaces/ProcessRunnerInterface';
import { VersionCommand } from './commands/VersionCommand';
import { ServerListCommand } from './commands/ServerListCommand';
import { PhpListCommand } from './commands/PhpListCommand';
import { ProxyStatusCommand } from './commands/ProxyStatusCommand';
import { ServerStartCommand } from './commands/ServerStartCommand';
import { ServerStopCommand } from './commands/ServerStopCommand';
import { ProxyStartCommand } from './commands/ProxyStartCommand';
import { ProxyStopCommand } from './commands/ProxyStopCommand';
import { ProxyDomainDetachCommand } from './commands/ProxyDomainDetachCommand';
import { WhichSymfonyCommand } from './commands/WhichSymfonyCommand';

export class SymfonyCliManager {
    private commands: Map<string, SymfonyCommandInterface<any>> = new Map();

    constructor(processRunner: ProcessRunnerInterface) {
        this.registerCommand(new VersionCommand(processRunner));
        this.registerCommand(new ServerListCommand(processRunner));
        this.registerCommand(new PhpListCommand(processRunner));
        this.registerCommand(new ProxyStatusCommand(processRunner));
        this.registerCommand(new ServerStartCommand(processRunner));
        this.registerCommand(new ServerStopCommand(processRunner));
        this.registerCommand(new ProxyStartCommand(processRunner));
        this.registerCommand(new ProxyStopCommand(processRunner));
        this.registerCommand(new ProxyDomainDetachCommand(processRunner));
        this.registerCommand(new WhichSymfonyCommand(processRunner));
    }

    registerCommand(command: SymfonyCommandInterface<any>): void {
        this.commands.set(command.getName(), command);
    }

    async runCommand<T>(commandName: string, args?: string[]): Promise<T> {
        const command = this.commands.get(commandName);
        if (!command) {
            throw new Error(`Command ${commandName} not found`);
        }

        return await command.execute(args);
    }
}
