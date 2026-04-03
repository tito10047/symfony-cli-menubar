import { NodeProcessRunner } from '../../helpers/NodeProcessRunner';
import { PhpInfoCommand } from '../../../src/core/commands/PhpInfoCommand';
import { execSync } from 'child_process';

describe('PhpInfoCommand Integration', () => {
    const isIntegrationEnabled = process.env.RUN_INTEGRATION === '1';

    if (!isIntegrationEnabled) {
        it('skipped integration tests', () => {});
        return;
    }

    let phpPath: string | null = null;

    beforeAll(() => {
        try {
            phpPath = execSync('which php').toString().trim();
        } catch (error) {
            console.warn('⚠️ PHP was not found in PATH. Skipping PhpInfoCommand integration tests.');
        }
    });

    it('should fetch real PHP info', async () => {
        if (!phpPath) {
            console.warn('⚠️ Skipping real PHP test because binary was not found.');
            return;
        }

        const runner = new NodeProcessRunner(phpPath); // Binary is passed to the constructor
        const command = new PhpInfoCommand(runner);

        const result = await command.execute();

        expect(result).toBeDefined();
        expect(typeof result.phpIniPath).toBe('string');
        expect(result.phpIniPath.length).toBeGreaterThan(0);
        expect(typeof result.hasXdebug).toBe('boolean');
        expect(typeof result.hasApcu).toBe('boolean');
        expect(typeof result.hasOpcache).toBe('boolean');
    });
});
