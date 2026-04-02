export interface ProcessRunnerInterface {
    run(command: string[]): Promise<string>;
}
