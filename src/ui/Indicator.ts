import GObject from 'gi://GObject';
import St from 'gi://St';
import { Button } from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {
    PopupMenu,
    PopupMenuItem,
    PopupSeparatorMenuItem,
    PopupBaseMenuItem,
} from 'resource:///org/gnome/shell/ui/popupMenu.js';

export const Indicator = GObject.registerClass(
    class Indicator extends Button {
        _init() {
            super._init(0.0, 'Symfony Menubar', false);

            // Viditeľný text "SF" v hornom paneli
            this.add_child(new St.Label({ text: 'SF', y_expand: true }));

            const menu = this.menu as PopupMenu;

            // PHP info
            menu.addMenuItem(new PopupMenuItem('PHP 8.2 (default) | Opcache: ok'));

            menu.addMenuItem(new PopupSeparatorMenuItem());

            // Hlavička serverov – neklikateľná
            const serversHeader = new PopupBaseMenuItem({ reactive: false });
            serversHeader.add_child(new St.Label({ text: 'OBĽÚBENÉ SERVERY' }));
            menu.addMenuItem(serversHeader);

            menu.addMenuItem(new PopupMenuItem('🟢 moj-super-projekt (8000)'));
            menu.addMenuItem(new PopupMenuItem('🔴 stary-projekt (vypnutý)'));

            menu.addMenuItem(new PopupSeparatorMenuItem());

            // Hlavička proxy – neklikateľná
            const proxyHeader = new PopupBaseMenuItem({ reactive: false });
            proxyHeader.add_child(new St.Label({ text: 'PROXY' }));
            menu.addMenuItem(proxyHeader);

            menu.addMenuItem(new PopupMenuItem('🟢 Proxy beží: port 7080'));
        }
    }
);

export type IndicatorType = InstanceType<typeof Indicator>;
