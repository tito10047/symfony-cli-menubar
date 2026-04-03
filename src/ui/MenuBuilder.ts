import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { SymfonyCliManager } from '../core/SymfonyCliManager';
import { LoggerInterface } from '../core/interfaces/LoggerInterface';
import { PhpVersion } from '../core/commands/PhpListCommand';
import { PhpInfo } from '../core/dto/PhpInfo';
import { SymfonyServer } from '../core/commands/ServerListCommand';
import { SymfonyProxy } from '../core/commands/ProxyStatusCommand';
import { ExtensionRef, MenuData } from './types';

const SYMFONY_DOCS_URL = 'https://symfony.com/download';

export class MenuBuilder {
    private _logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this._logger = logger;
    }

    buildMenu(
        menu: any,
        data: MenuData,
        cliManager: SymfonyCliManager,
        extension: ExtensionRef
    ): void {
        menu.removeAll();

        this._buildHeader(menu);
        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        if (!data.cliAvailable) {
            this._buildCliErrorState(menu);
        } else {
            this._buildPhpSection(menu, data.phpVersions, data.phpInfoMap);
            menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this._buildServersSection(menu, data.servers, data.proxyStatus.proxies, cliManager);
        }

        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._buildFooter(menu, extension);
    }

    private _buildHeader(menu: any): void {
        const item = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });

        const box = new St.BoxLayout({
            style_class: 'symfony-header-box',
            x_expand: true,
        });

        const title = new St.Label({
            text: 'Symfony CLI',
            style: 'font-weight: bold; font-size: 1.1em;',
            y_align: Clutter.ActorAlign.CENTER,
        });

        const spacer = new St.Widget({ x_expand: true });

        const linkButton = new St.Button({ style_class: 'icon-button' });
        const linkIcon = new St.Icon({
            icon_name: 'external-link-symbolic',
            icon_size: 16,
        });
        linkButton.set_child(linkIcon);
        linkButton.connect('clicked', () => {
            this._logger.info('Link to repo');
        });

        box.add_child(title);
        box.add_child(spacer);
        box.add_child(linkButton);
        item.add_child(box);

        menu.addMenuItem(item);
    }

    private _buildCliErrorState(menu: any): void {
        const errorItem = new PopupMenu.PopupMenuItem('⚠  Symfony CLI nebolo nájdené', {
            reactive: false,
        });
        errorItem.label.add_style_class('cli-error-item');
        menu.addMenuItem(errorItem);

        const installItem = new PopupMenu.PopupMenuItem('Kliknite pre návod na inštaláciu');
        installItem.connect('activate', () => {
            try {
                Gio.AppInfo.launch_default_for_uri(SYMFONY_DOCS_URL, null);
            } catch (e) {
                this._logger.error(`Failed to open docs URL: ${e}`);
            }
        });
        menu.addMenuItem(installItem);
    }

    private _buildPhpSection(
        menu: any,
        versions: PhpVersion[],
        phpInfoMap: Map<string, PhpInfo>
    ): void {
        for (const phpVersion of versions) {
            const label = phpVersion.isDefault
                ? `php ${phpVersion.version} (default)`
                : `php ${phpVersion.version}`;

            const item = new PopupMenu.PopupSubMenuMenuItem(label);

            const info = phpInfoMap.get(phpVersion.version);
            if (info) {
                const iniText = info.phpIniPath
                    ? `php.ini: ${info.phpIniPath}`
                    : 'php.ini: (nenájdené)';
                const iniItem = new PopupMenu.PopupMenuItem(iniText, { reactive: false });
                iniItem.label.add_style_class('small-gray-text');
                item.menu.addMenuItem(iniItem);

                const modulesText = this._buildModulesString(info);
                item.menu.addMenuItem(
                    new PopupMenu.PopupMenuItem(modulesText, { reactive: false })
                );
            }

            menu.addMenuItem(item);
        }
    }

    private _buildModulesString(info: PhpInfo): string {
        const modules: string[] = [];
        modules.push(`APCu [${info.hasApcu ? 'ok' : '—'}]`);
        modules.push(`Xdebug [${info.hasXdebug ? 'ok' : '—'}]`);
        modules.push(`Opcache [${info.hasOpcache ? 'ok' : '—'}]`);
        return `Moduly: ${modules.join(', ')}`;
    }

    private _buildServersSection(
        menu: any,
        servers: SymfonyServer[],
        proxies: SymfonyProxy[],
        cliManager: SymfonyCliManager
    ): void {
        const favoriteServers = servers.filter(s =>
            proxies.some(p => p.directory === s.directory)
        );
        const otherServers = servers.filter(s =>
            !proxies.some(p => p.directory === s.directory)
        );

        // Favorites section title
        const favTitleItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
        const favTitle = new St.Label({
            text: 'OBĽÚBENÉ SERVERY',
            style_class: 'section-title',
        });
        favTitleItem.add_child(favTitle);
        menu.addMenuItem(favTitleItem);

        if (favoriteServers.length === 0) {
            const emptyItem = new PopupMenu.PopupMenuItem('(žiadne)', { reactive: false });
            emptyItem.label.add_style_class('small-gray-text');
            menu.addMenuItem(emptyItem);
        } else {
            for (const server of favoriteServers) {
                const proxy = proxies.find(p => p.directory === server.directory);
                const domainName = proxy?.domain ?? server.directory.split('/').pop() ?? server.directory;
                menu.addMenuItem(this._buildServerItem(server, domainName, cliManager));
            }
        }

        // Other servers sub-menu
        const othersItem = new PopupMenu.PopupSubMenuMenuItem('OSTATNÉ SERVERY');

        if (otherServers.length === 0) {
            const emptyItem = new PopupMenu.PopupMenuItem('(žiadne)', { reactive: false });
            emptyItem.label.add_style_class('small-gray-text');
            othersItem.menu.addMenuItem(emptyItem);
        } else {
            for (const server of otherServers) {
                const domainName = server.directory.split('/').pop() ?? server.directory;
                othersItem.menu.addMenuItem(this._buildServerItem(server, domainName, cliManager));
            }
        }

        menu.addMenuItem(othersItem);
    }

    private _buildServerItem(
        server: SymfonyServer,
        domainName: string,
        cliManager: SymfonyCliManager
    ): any {
        const statusDot = server.isRunning ? '● ' : '○ ';
        const item = new PopupMenu.PopupSubMenuMenuItem(`${statusDot}${domainName}`);

        // Port label aligned to the right
        const portLabel = new St.Label({
            text: `:${server.port}`,
            style_class: 'small-gray-text',
            x_align: Clutter.ActorAlign.END,
            y_align: Clutter.ActorAlign.CENTER,
        });
        item.add_child(portLabel);

        this._buildServerDetail(item.menu, server, domainName, cliManager);

        return item;
    }

    private _buildServerDetail(
        subMenu: any,
        server: SymfonyServer,
        domainName: string,
        cliManager: SymfonyCliManager
    ): void {
        // Domain title
        const titleItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
        const titleLabel = new St.Label({
            text: domainName,
            style: 'font-weight: bold;',
        });
        titleItem.add_child(titleLabel);
        subMenu.addMenuItem(titleItem);

        // Status line
        const statusItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
        const statusText = server.isRunning
            ? `Beží na porte ${server.port}`
            : 'Zastavený';
        const statusLabel = new St.Label({
            text: statusText,
            style_class: server.isRunning ? 'green-text' : 'red-text',
        });
        statusItem.add_child(statusLabel);
        subMenu.addMenuItem(statusItem);

        subMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Stop / Start server
        const toggleItem = new PopupMenu.PopupMenuItem(
            server.isRunning ? 'Zastaviť server' : 'Spustiť server'
        );
        toggleItem.connect('activate', () => {
            const commandName = server.isRunning ? 'server:stop' : 'server:start';
            cliManager.runCommand(commandName, [`--dir=${server.directory}`]).catch(e => {
                this._logger.error(`${commandName} failed: ${e}`);
            });
        });
        subMenu.addMenuItem(toggleItem);

        subMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Open in browser
        if (server.isRunning && server.url) {
            const openItem = new PopupMenu.PopupMenuItem('Otvoriť v prehliadači');
            openItem.connect('activate', () => {
                try {
                    Gio.AppInfo.launch_default_for_uri(server.url, null);
                } catch (e) {
                    this._logger.error(`Failed to open browser: ${e}`);
                }
            });
            subMenu.addMenuItem(openItem);
        }

        // Copy URL
        if (server.url) {
            const copyUrlItem = new PopupMenu.PopupMenuItem('Kopírovať URL');
            copyUrlItem.connect('activate', () => {
                St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, server.url);
                this._logger.info(`Copied URL: ${server.url}`);
            });
            subMenu.addMenuItem(copyUrlItem);
        }

        subMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Show logs
        const logsItem = new PopupMenu.PopupMenuItem('Zobraziť logy');
        logsItem.connect('activate', () => {
            cliManager.runCommand<string>('open:log', [server.directory])
                .then(cmd => {
                    try {
                        GLib.spawn_command_line_async(`bash -c "${cmd}"`);
                    } catch (e) {
                        this._logger.error(`Failed to open logs: ${e}`);
                    }
                })
                .catch(e => this._logger.error(`open:log failed: ${e}`));
        });
        subMenu.addMenuItem(logsItem);

        subMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Project path
        const pathItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
        const pathLabel = new St.Label({
            text: server.directory,
            style_class: 'small-gray-text',
        });
        pathItem.add_child(pathLabel);
        subMenu.addMenuItem(pathItem);

        // Action buttons row: [Copy path] [File manager] [Terminal]
        const actionsItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
        const actionsBox = new St.BoxLayout({ spacing: 8 });

        const copyPathBtn = this._makeTextButton('Kopírovať cestu', () => {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, server.directory);
            this._logger.info(`Copied path: ${server.directory}`);
        });

        const folderBtn = this._makeTextButton('Priečinok', () => {
            try {
                Gio.AppInfo.launch_default_for_uri(`file://${server.directory}`, null);
            } catch (e) {
                this._logger.error(`Failed to open file manager: ${e}`);
            }
        });

        const terminalBtn = this._makeTextButton('Terminál', () => {
            try {
                // Uses default terminal; can be extended with GSettings terminal-command later
                GLib.spawn_command_line_async(`bash -c "cd '${server.directory}' && bash"`);
            } catch (e) {
                this._logger.error(`Failed to open terminal: ${e}`);
            }
        });

        actionsBox.add_child(copyPathBtn);
        actionsBox.add_child(folderBtn);
        actionsBox.add_child(terminalBtn);
        actionsItem.add_child(actionsBox);
        subMenu.addMenuItem(actionsItem);
    }

    private _makeTextButton(label: string, onClick: () => void): St.Button {
        const btn = new St.Button({
            label,
            style_class: 'button small-gray-text',
            x_expand: false,
        });
        btn.connect('clicked', onClick);
        return btn;
    }

    private _buildFooter(menu: any, extension: ExtensionRef): void {
        const settingsItem = new PopupMenu.PopupMenuItem('Nastavenia');
        settingsItem.connect('activate', () => {
            try {
                extension.openPreferences();
            } catch (e) {
                this._logger.error(`Failed to open preferences: ${e}`);
            }
        });
        menu.addMenuItem(settingsItem);

        const aboutItem = new PopupMenu.PopupMenuItem('O aplikácii');
        aboutItem.connect('activate', () => {
            this._logger.info('About: Symfony CLI Menubar - GNOME Shell Extension');
        });
        menu.addMenuItem(aboutItem);

        const quitItem = new PopupMenu.PopupMenuItem('Ukončiť');
        quitItem.connect('activate', () => {
            this._logger.info('Quit requested by user');
        });
        menu.addMenuItem(quitItem);
    }
}
