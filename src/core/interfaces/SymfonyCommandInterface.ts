import { LoggerInterface } from './LoggerInterface';

export interface SymfonyCommandInterface<T> {
    getName(): string;
    execute(args?: string[]): Promise<T>;
    setLogger(logger: LoggerInterface): void;
}
