import GObject from 'gi://GObject';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { ServerMenuItemType } from './ServerMenuItem.js';

const FavoriteServersGroup = GObject.registerClass(
    class FavoriteServersGroup extends PopupMenu.PopupSubMenuMenuItem {
        declare _serverMap: Map<string, ServerMenuItemType>;

        _init() {
            super._init('📁 Other servers');
            this._serverMap = new Map();
        }

        /**
         * Registers a pre-created ServerMenuItem under `directory` as the
         * canonical key (matches SymfonyServer.directory), and appends it to the submenu.
         */
        addServer(directory: string, item: ServerMenuItemType): void {
            this._serverMap.set(directory, item);
            this.menu.addMenuItem(item);
        }

        getServer(directory: string): ServerMenuItemType | undefined {
            return this._serverMap.get(directory);
        }

        removeServer(directory: string): void {
            const item = this._serverMap.get(directory);
            if (!item) return;
            item.destroy();
            this._serverMap.delete(directory);
        }

        /** Destroys all child items and clears the internal map. */
        clear(): void {
            this.menu.removeAll();
            this._serverMap.clear();
        }

        get serverCount(): number {
            return this._serverMap.size;
        }
    }
);

export { FavoriteServersGroup };
export type FavoriteServersGroupType = InstanceType<typeof FavoriteServersGroup>;
