import GObject from 'gi://GObject';
import {Button} from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import {PopupBaseMenuItem, PopupMenuItem, PopupSeparatorMenuItem} from 'resource:///org/gnome/shell/ui/popupMenu.js';

// --- POMOCNÉ FUNKCIE PRE MODERNÝ DIZAJN ---

function createSectionHeader(text) {
    const header = new PopupBaseMenuItem({ reactive: false });
    const label = new St.Label({
        text: text.toUpperCase(),
        style: 'font-size: 11px; font-weight: bold; color: rgba(255, 255, 255, 0.4); padding-top: 5px; padding-bottom: 2px;'
    });
    label.clutter_text.ellipsize = 0;
    header.add_child(label);
    return header;
}

// Pridaný parameter "isOtherServer" na určenie, či má mať tlačidlo "Pridať do obľúbených"
function createServerItem(name, port, isRunning, isOtherServer = false) {
    // 1. Vytvoríme submenu položku (čistý názov)
    const serverMenu = new PopupMenu.PopupSubMenuMenuItem(name);
    serverMenu.label.set_x_expand(true);

    // 2. OPRAVA SIVÝCH GULIČIEK: Vytvoríme nezávislý St.Label so silným inline CSS
    const dotColor = isRunning ? '#4ade80' : '#888888';
    const dotLabel = new St.Label({
        text: '●  ',
        style: `color: ${dotColor};`, // CSS farba, ktorú téma neprepíše
        y_align: Clutter.ActorAlign.CENTER
    });

    // Vložíme guličku tesne pred názov projektu
    const labelIndex = serverMenu.get_children().indexOf(serverMenu.label);
    serverMenu.insert_child_at_index(dotLabel, labelIndex !== -1 ? labelIndex : 1);

    // 3. Port zarovnaný doprava
    if (port) {
        const portLabel = new St.Label({
            text: `:${port}`,
            style: 'color: rgba(255, 255, 255, 0.4); font-size: 12px; margin-right: 8px;',
            y_align: Clutter.ActorAlign.CENTER
        });
        const childrenCount = serverMenu.get_children().length;
        serverMenu.insert_child_at_index(portLabel, childrenCount - 1);
    }

    // 4. Akcie pre 3. úroveň menu
    if (isRunning) {
        serverMenu.menu.addMenuItem(new PopupMenuItem('⏹️ Zastaviť server'));
        serverMenu.menu.addMenuItem(new PopupMenuItem('🌐 Otvoriť v prehliadači'));
    } else {
        serverMenu.menu.addMenuItem(new PopupMenuItem('▶️ Spustiť server'));
    }

    serverMenu.menu.addMenuItem(new PopupSeparatorMenuItem());
    serverMenu.menu.addMenuItem(new PopupMenuItem('📋 Kopírovať URL'));
    serverMenu.menu.addMenuItem(new PopupMenuItem('📄 Zobraziť logy'));

    // OPRAVA PRE OSTATNÉ SERVERY: Pridáme extra tlačidlo
    if (isOtherServer) {
        serverMenu.menu.addMenuItem(new PopupSeparatorMenuItem());
        serverMenu.menu.addMenuItem(new PopupMenuItem('⭐ Pridať do obľúbených'));
    }

    return serverMenu;
}

// --- HLAVNÁ TRIEDA ---

export const Indicator = GObject.registerClass(
    class Indicator extends Button {
        _init() {
            super._init(0.0, 'Symfony Menubar', false);

            // OPRAVA ZAROVNANIA "SF": explicitne povieme y_align CENTER
            const topLabel = new St.Label({
                text: 'SF',
                y_align: Clutter.ActorAlign.CENTER
            });
            this.add_child(topLabel);

            const menu = this.menu;

            // ==========================================
            // 1. SEKCIÁ: PHP
            // ==========================================
            menu.addMenuItem(createSectionHeader('PHP'));

            const phpItem = new PopupBaseMenuItem({reactive: false});
            const phpBox = new St.BoxLayout({x_expand: true, y_align: Clutter.ActorAlign.CENTER});

            // Fix pre PHP zelenú guličku
            const phpDot = new St.Label({ text: '●  ', style: 'color: #4ade80;' });
            const phpTitle = new St.Label({text: '8.2'});
            phpTitle.set_x_expand(true);

            const opcacheBadge = new St.Label({
                text: 'OPcache',
                style: 'font-size: 10px; background-color: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-right: 8px;'
            });

            phpBox.add_child(phpDot);
            phpBox.add_child(phpTitle);
            phpBox.add_child(opcacheBadge);
            phpItem.add_child(phpBox);

            menu.addMenuItem(phpItem);
            menu.addMenuItem(new PopupSeparatorMenuItem());

            // ==========================================
            // 2. SEKCIÁ: HLAVNÉ SERVERY
            // ==========================================
            menu.addMenuItem(createSectionHeader('SERVERS'));

            // Tieto sú hlavné = posledný parameter false (bez tlačidla obľúbených)
            menu.addMenuItem(createServerItem('moj-super-projekt', '8000', true, false));
            menu.addMenuItem(createServerItem('stary-projekt', '', false, false));
            menu.addMenuItem(new PopupSeparatorMenuItem());

            // ==========================================
            // 3. SEKCIÁ: OSTATNÉ SERVERY (Rozbaľovacie)
            // ==========================================
            const serversSubMenu = new PopupMenu.PopupSubMenuMenuItem('📁 Ďalšie obľúbené servery');

            for (let i = 1; i <= 30; i++) {
                const isRunning = i % 2 !== 0;
                const port = isRunning ? (8000 + i).toString() : '';

                // Posledný parameter true = vygeneruje na konci submenu tlačidlo "Pridať do obľúbených"
                const item = createServerItem(`projekt-cislo-${i}`, port, isRunning, true);
                serversSubMenu.menu.addMenuItem(item);
            }
            menu.addMenuItem(serversSubMenu);
            menu.addMenuItem(new PopupSeparatorMenuItem());

            // ==========================================
            // 4. SEKCIÁ: PROXY
            // ==========================================
            menu.addMenuItem(createSectionHeader('PROXY'));

            const proxySubMenu = new PopupMenu.PopupSubMenuMenuItem('Proxy beží: port 7080');

            // Fix pre zelenú guličku v Proxy
            const proxyDot = new St.Label({ text: '●  ', style: 'color: #4ade80;' });
            const proxyLabelIdx = proxySubMenu.get_children().indexOf(proxySubMenu.label);
            proxySubMenu.insert_child_at_index(proxyDot, proxyLabelIdx !== -1 ? proxyLabelIdx : 1);

            const startProxyItem = new PopupMenuItem('▶️ Zapnúť');
            proxySubMenu.menu.addMenuItem(startProxyItem);

            const stopProxyItem = new PopupMenuItem('⏹️ Vypnúť');
            proxySubMenu.menu.addMenuItem(stopProxyItem);

            const restartProxyItem = new PopupMenuItem('🔄 Reštartovať');
            proxySubMenu.menu.addMenuItem(restartProxyItem);

            const openBrowserItem = new PopupMenuItem('🌐 Otvoriť v prehliadači');
            proxySubMenu.menu.addMenuItem(openBrowserItem);

            menu.addMenuItem(proxySubMenu);
        }
    }
);

export type IndicatorType = InstanceType<typeof Indicator>;