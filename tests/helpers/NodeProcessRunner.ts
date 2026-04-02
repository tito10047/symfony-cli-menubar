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
        let binary = this.binaryPath;
        let args = command;

        // If the first argument is an absolute path, use it as binary
        if (command.length > 0 && command[0].startsWith('/')) {
            binary = command[0];
            args = command.slice(1);
        }

        const isDebug = process.env.DEBUG === '1';
        if (isDebug) {
            process.stderr.write(`\n[DEBUG] Running command: ${binary} ${args.join(' ')}\n`);
        }

        return new Promise((resolve, reject) => {
            execFile(binary, args, (error, stdout, stderr) => {
                if (isDebug && stdout) process.stderr.write(`[DEBUG] STDOUT:\n${stdout}\n`);
                if (isDebug && stderr) process.stderr.write(`[DEBUG] STDERR:\n${stderr}\n`);

                if (error) {
                    // Direct write to stderr to bypass Jest's log capture for maximum visibility
                    process.stderr.write(`\n--- SYMFONY CLI ERROR ---\n`);
                    process.stderr.write(`Command: ${binary} ${args.join(' ')}\n`);
                    process.stderr.write(`Exit Code: ${error.code}\n`);
                    if (stderr) process.stderr.write(`STDERR:\n${stderr}\n`);
                    if (stdout) process.stderr.write(`STDOUT:\n${stdout}\n`);
                    process.stderr.write(`--- END SYMFONY CLI ERROR ---\n\n`);

                    // Always reject on error, include stderr/stdout in the message
                    reject(new Error(`Command failed with code ${error.code}: ${stderr || stdout || error.message}`));
                    return;
                }
                resolve(stdout);
            });
        });
    }
}
