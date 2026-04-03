import { OpenLogCommand } from '../../../src/core/commands/OpenLogCommand';
import { NodeProcessRunner } from '../../helpers/NodeProcessRunner';
import * as os from 'os';

describe('OpenLogCommand Integration', () => {
    const isIntegrationEnabled = process.env.RUN_INTEGRATION === '1';

    if (!isIntegrationEnabled) {
        it('skipped integration tests', () => {});
        return;
    }

    it('should prepare log command for a real directory', async () => {
        const runner = new NodeProcessRunner();
        const command = new OpenLogCommand(runner);
        
        // Use a real directory like the home directory or temp
        const realPath = os.homedir();
        const result = await command.execute([realPath]);

        expect(result).toBe(`symfony server:log --dir=${realPath}`);
    });
});
