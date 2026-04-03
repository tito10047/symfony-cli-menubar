import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import { SymfonyCliManager } from '../core/SymfonyCliManager';
import { LoggerInterface } from '../core/interfaces/LoggerInterface';
import { PhpVersion } from '../core/commands/PhpListCommand';
import { PhpInfo } from '../core/dto/PhpInfo';
import { SymfonyServer } from '../core/commands/ServerListCommand';
import { ProxyStatus } from '../core/commands/ProxyStatusCommand';
import { MenuBuilder } from './MenuBuilder';
import { ExtensionRef, MenuData } from './types';

export const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        private _cliManager!: SymfonyCliManager;
        private _menuBuilder!: MenuBuilder;
        private _logger!: LoggerInterface;
        private _extension!: ExtensionRef;
        private _timerId: number | null = null;
        private _pendingRefresh: boolean = false;

        _init(
            cliManager: SymfonyCliManager,
            logger: LoggerInterface,
            extension: ExtensionRef
        ): void {
            super._init(0.0, 'Symfony CLI Menubar', false);

            this._cliManager = cliManager;
            this._logger = logger;
            this._extension = extension;
            this._menuBuilder = new MenuBuilder(logger);

            // Systray label
            const label = new St.Label({
                text: 'Sf',
                y_align: Clutter.ActorAlign.CENTER,
            });
            this.add_child(label);

            // Anti-flicker: execute pending refresh after menu closes
            this.menu.connect('open-state-changed', (_menu: any, isOpen: boolean) => {
                if (!isOpen && this._pendingRefresh) {
                    this._doRefresh();
                }
            });
        }

        startRefresh(intervalSeconds: number = 10): void {
            this._timerId = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                intervalSeconds,
                () => {
                    this._refresh();
                    return GLib.SOURCE_CONTINUE;
                }
            );
            // Immediate first refresh
            this._doRefresh();
        }

        stopRefresh(): void {
            if (this._timerId !== null) {
                GLib.source_remove(this._timerId);
                this._timerId = null;
            }
        }

        private _refresh(): void {
            if (this.menu.isOpen) {
                this._pendingRefresh = true;
                this._logger.info('Menu is open – deferring refresh');
                return;
            }
            this._doRefresh();
        }

        private _doRefresh(): void {
            this._pendingRefresh = false;
            this._fetchData()
                .then(data => {
                    this._menuBuilder.buildMenu(
                        this.menu,
                        data,
                        this._cliManager,
                        this._extension
                    );
                })
                .catch(e => {
                    this._logger.error(`Menu refresh failed: ${e}`);
                });
        }

        private async _fetchData(): Promise<MenuData> {
            const [phpResult, serverResult, proxyResult] = await Promise.allSettled([
                this._cliManager.runCommand<PhpVersion[]>('local:php:list'),
                this._cliManager.runCommand<SymfonyServer[]>('server:list'),
                this._cliManager.runCommand<ProxyStatus>('proxy:status'),
            ]);

            if (phpResult.status === 'rejected') {
                this._logger.warn(`local:php:list failed: ${phpResult.reason}`);
            }
            if (serverResult.status === 'rejected') {
                this._logger.warn(`server:list failed: ${serverResult.reason}`);
            }
            if (proxyResult.status === 'rejected') {
                this._logger.warn(`proxy:status failed: ${proxyResult.reason}`);
            }

            const phpVersions: PhpVersion[] =
                phpResult.status === 'fulfilled' ? phpResult.value : [];
            const servers: SymfonyServer[] =
                serverResult.status === 'fulfilled' ? serverResult.value : [];
            const proxyStatus: ProxyStatus =
                proxyResult.status === 'fulfilled'
                    ? proxyResult.value
                    : { isRunning: false, proxies: [] };

            // Fetch PHP info for each version in parallel; ignore individual failures
            const phpInfoMap = new Map<string, PhpInfo>();
            await Promise.allSettled(
                phpVersions
                    .filter(v => v.path)
                    .map(async v => {
                        const info = await this._cliManager.runCommand<PhpInfo>('php:info', [
                            v.path,
                        ]);
                        phpInfoMap.set(v.version, info);
                    })
            );

            const cliAvailable =
                phpVersions.length > 0 ||
                servers.length > 0 ||
                proxyStatus.proxies.length > 0;

            return { phpVersions, phpInfoMap, servers, proxyStatus, cliAvailable };
        }

        destroy(): void {
            this.stopRefresh();
            super.destroy();
        }
    }
);

export type IndicatorType = InstanceType<typeof Indicator>;
