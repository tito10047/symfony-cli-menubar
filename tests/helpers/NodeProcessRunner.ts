import { execFile } from 'child_process';
import { ProcessRunnerInterface } from '../../src/core/interfaces/ProcessRunnerInterface';

/**
 * NodeProcessRunner implements ProcessRunnerInterface using Node.js child_process.
 * Used exclusively for integration tests running in Node environment.
 */
export class NodeProcessRunner implements ProcessRunnerInterface {
    private readonly binaryPath: string;

    constructor(binaryPath: string = 'symfony') {
        this.binaryPath = binaryPath;
    }

    async run(command: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            execFile(this.binaryPath, command, (error, stdout, stderr) => {
                if (error) {
                    // Even if there is an error, we might want the stdout if it's a JSON output
                    if (stdout) {
                        resolve(stdout);
                        return;
                    }
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }
}
