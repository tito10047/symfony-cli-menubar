import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { PopupImageMenuItem, PopupMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { SymfonyProxy } from '../../core/commands/ProxyStatusCommand.js';

const RUNNING_COLOR = '#4ade80';
const STOPPED_COLOR = '#888888';

interface ProxyMenuItemParams {
    onStart: () => void;
    onStop: () => void;
    onRestart: () => void;
    onOpenBrowser: () => void;
}

const ProxyMenuItem = GObject.registerClass(
    class ProxyMenuItem extends PopupMenu.PopupSubMenuMenuItem {
        declare _dot: InstanceType<typeof St.Icon>;
        declare _startItem: InstanceType<typeof PopupImageMenuItem>;
        declare _stopItem: InstanceType<typeof PopupImageMenuItem>;
        declare _restartItem: InstanceType<typeof PopupImageMenuItem>;
        declare _openBrowserItem: InstanceType<typeof PopupImageMenuItem>;
        declare _domainItems: InstanceType<typeof PopupMenuItem>[];

        _init(params: ProxyMenuItemParams) {
            super._init('Proxy: stopped');

            this._domainItems = [];

            // Status dot — inserted directly before the label.
            this._dot = new St.Icon({
                icon_name: 'media-record-symbolic',
                icon_size: 10,
                style: `color: ${STOPPED_COLOR}; margin-right: 6px;`,
                y_align: Clutter.ActorAlign.CENTER,
            });
            const labelIdx = this.get_children().indexOf(this.label);
            this.insert_child_at_index(this._dot, labelIdx !== -1 ? labelIdx : 1);

            this._startItem       = new PopupImageMenuItem('Start', 'media-playback-start-symbolic');
            this._stopItem        = new PopupImageMenuItem('Stop', 'media-playback-stop-symbolic');
            this._restartItem     = new PopupImageMenuItem('Restart', 'view-refresh-symbolic');
            this._openBrowserItem = new PopupImageMenuItem('Open in browser', 'web-browser-symbolic');

            this._startItem.connect('activate', () => params.onStart());
            this._stopItem.connect('activate', () => params.onStop());
            this._restartItem.connect('activate', () => params.onRestart());
            this._openBrowserItem.connect('activate', () => params.onOpenBrowser());

            this.menu.addMenuItem(this._startItem);
            this.menu.addMenuItem(this._stopItem);
            this.menu.addMenuItem(this._restartItem);
            this.menu.addMenuItem(this._openBrowserItem);

            // Initial state: stopped
            this._stopItem.visible    = false;
            this._restartItem.visible = false;
            this._openBrowserItem.visible = false;
        }

        /**
         * Updates dot color, label, domain list rows, and action visibility.
         */
        updateStatus(isRunning: boolean, proxies: SymfonyProxy[]): void {
            this._dot.set_style(`color: ${isRunning ? RUNNING_COLOR : STOPPED_COLOR}; margin-right: 6px;`);
            this.label.set_text(isRunning ? 'Proxy: running' : 'Proxy: stopped');

            // Remove old domain rows
            for (const item of this._domainItems) {
                item.destroy();
            }
            this._domainItems = [];

            // Insert domain rows above the action items when running
            // if (isRunning && proxies.length > 0) {
            //     for (const proxy of proxies) {
            //         const row = new PopupMenuItem(proxy.domain, { reactive: false });
            //         row.label.set_style('color: rgba(255,255,255,0.6); font-size: 0.9em;');
            //         this.menu.addMenuItem(row, 0);
            //         this._domainItems.push(row);
            //     }
            // }

            this._startItem.visible       = !isRunning;
            this._stopItem.visible        = isRunning;
            this._restartItem.visible     = isRunning;
            this._openBrowserItem.visible = isRunning;
        }
    }
);

export { ProxyMenuItem };
export type ProxyMenuItemType = InstanceType<typeof ProxyMenuItem>;
