import { SymfonyCommandInterface } from './interfaces/SymfonyCommandInterface';

export class SymfonyCliManager {
    private commands: Map<string, SymfonyCommandInterface<any>> = new Map();

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
