export interface SymfonyCommandInterface<T> {
    getName(): string;
    execute(args?: string[]): Promise<T>;
}
