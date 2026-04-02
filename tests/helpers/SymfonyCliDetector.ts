import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * SymfonyCliDetector is a helper class for detecting the path to the 'symfony' CLI binary.
 * It's intended for use in integration tests running in Node.js.
 */
export class SymfonyCliDetector {
    /**
     * Detects the path to the 'symfony' CLI binary.
     * Returns null if not found.
     */
    static detect(): string | null {
        try {
            return execSync('which symfony', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        } catch (e) {
            const commonPaths = [
                join(homedir(), '.local/bin/symfony'),
                '/usr/local/bin/symfony',
                '/usr/bin/symfony',
                join(homedir(), '.symfony5/bin/symfony'),
                join(homedir(), '.symfony/bin/symfony'),
            ];
            for (const path of commonPaths) {
                if (existsSync(path)) {
                    return path;
                }
            }
        }
        return null;
    }
}
