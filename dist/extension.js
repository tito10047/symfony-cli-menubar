// src/extension.ts
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

// src/ui/Indicator.ts
import GObject from "gi://GObject";
import St from "gi://St";
import { Button } from "resource:///org/gnome/shell/ui/panelMenu.js";
import {
  PopupMenuItem,
  PopupSeparatorMenuItem,
  PopupBaseMenuItem
} from "resource:///org/gnome/shell/ui/popupMenu.js";
var Indicator = GObject.registerClass(
  class Indicator2 extends Button {
    _init() {
      super._init(0, "Symfony Menubar", false);
      this.add_child(new St.Label({ text: "SF", y_expand: true }));
      const menu = this.menu;
      menu.addMenuItem(new PopupMenuItem("PHP 8.2 (default) | Opcache: ok"));
      menu.addMenuItem(new PopupSeparatorMenuItem());
      const serversHeader = new PopupBaseMenuItem({ reactive: false });
      serversHeader.add_child(new St.Label({ text: "OB\u013D\xDABEN\xC9 SERVERY" }));
      menu.addMenuItem(serversHeader);
      menu.addMenuItem(new PopupMenuItem("\u{1F7E2} moj-super-projekt (8000)"));
      menu.addMenuItem(new PopupMenuItem("\u{1F534} stary-projekt (vypnut\xFD)"));
      menu.addMenuItem(new PopupSeparatorMenuItem());
      const proxyHeader = new PopupBaseMenuItem({ reactive: false });
      proxyHeader.add_child(new St.Label({ text: "PROXY" }));
      menu.addMenuItem(proxyHeader);
      menu.addMenuItem(new PopupMenuItem("\u{1F7E2} Proxy be\u017E\xED: port 7080"));
    }
  }
);

// src/extension.ts
var SymfonyMenubarExtension = class extends Extension {
  _indicator = null;
  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }
  disable() {
    this._indicator?.destroy();
    this._indicator = null;
  }
};
export {
  SymfonyMenubarExtension as default
};
