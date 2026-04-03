import { PhpVersion } from '../core/commands/PhpListCommand';
import { PhpInfo } from '../core/dto/PhpInfo';
import { SymfonyServer } from '../core/commands/ServerListCommand';
import { ProxyStatus } from '../core/commands/ProxyStatusCommand';

export interface ExtensionRef {
    openPreferences(): void;
    path: string;
}

export interface MenuData {
    phpVersions: PhpVersion[];
    phpInfoMap: Map<string, PhpInfo>;
    servers: SymfonyServer[];
    proxyStatus: ProxyStatus;
    cliAvailable: boolean;
}
