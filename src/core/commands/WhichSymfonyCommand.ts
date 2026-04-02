import { SymfonyCommandInterface } from '../interfaces/SymfonyCommandInterface';
import { ProcessRunnerInterface } from '../interfaces/ProcessRunnerInterface';

export class WhichSymfonyCommand implements SymfonyCommandInterface<string> {
    constructor(private processRunner: ProcessRunnerInterface) {}

    getName(): string {
        return 'which';
    }

    async execute(args: string[] = []): Promise<string> {
        try {
            const output = await this.processRunner.run(['/usr/bin/which', 'symfony']);
            return output.trim();
        } catch (e) {
            return '';
        }
    }
}
