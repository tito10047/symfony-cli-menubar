// src/extension.ts
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

// src/ui/Indicator.ts
import GObject from "gi://GObject";
import { Button } from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import St from "gi://St";
import Clutter from "gi://Clutter";
import { PopupBaseMenuItem, PopupMenuItem, PopupSeparatorMenuItem } from "resource:///org/gnome/shell/ui/popupMenu.js";
function createSectionHeader(text) {
  const header = new PopupBaseMenuItem({ reactive: false });
  const label = new St.Label({
    text: text.toUpperCase(),
    style: "font-size: 11px; font-weight: bold; color: rgba(255, 255, 255, 0.4); padding-top: 5px; padding-bottom: 2px;"
  });
  label.clutter_text.ellipsize = 0;
  header.add_child(label);
  return header;
}
function createServerItem(name, port, isRunning, isOtherServer = false) {
  const serverMenu = new PopupMenu.PopupSubMenuMenuItem(name);
  serverMenu.label.set_x_expand(true);
  const dotColor = isRunning ? "#4ade80" : "#888888";
  const dotLabel = new St.Label({
    text: "\u25CF  ",
    style: `color: ${dotColor};`,
    // CSS farba, ktorú téma neprepíše
    y_align: Clutter.ActorAlign.CENTER
  });
  const labelIndex = serverMenu.get_children().indexOf(serverMenu.label);
  serverMenu.insert_child_at_index(dotLabel, labelIndex !== -1 ? labelIndex : 1);
  if (port) {
    const portLabel = new St.Label({
      text: `:${port}`,
      style: "color: rgba(255, 255, 255, 0.4); font-size: 12px; margin-right: 8px;",
      y_align: Clutter.ActorAlign.CENTER
    });
    const childrenCount = serverMenu.get_children().length;
    serverMenu.insert_child_at_index(portLabel, childrenCount - 1);
  }
  if (isRunning) {
    serverMenu.menu.addMenuItem(new PopupMenuItem("\u23F9\uFE0F Zastavi\u0165 server"));
    serverMenu.menu.addMenuItem(new PopupMenuItem("\u{1F310} Otvori\u0165 v prehliada\u010Di"));
  } else {
    serverMenu.menu.addMenuItem(new PopupMenuItem("\u25B6\uFE0F Spusti\u0165 server"));
  }
  serverMenu.menu.addMenuItem(new PopupSeparatorMenuItem());
  serverMenu.menu.addMenuItem(new PopupMenuItem("\u{1F4CB} Kop\xEDrova\u0165 URL"));
  serverMenu.menu.addMenuItem(new PopupMenuItem("\u{1F4C4} Zobrazi\u0165 logy"));
  if (isOtherServer) {
    serverMenu.menu.addMenuItem(new PopupSeparatorMenuItem());
    serverMenu.menu.addMenuItem(new PopupMenuItem("\u2B50 Prida\u0165 do ob\u013E\xFAben\xFDch"));
  }
  return serverMenu;
}
var Indicator = GObject.registerClass(
  class Indicator2 extends Button {
    _init() {
      super._init(0, "Symfony Menubar", false);
      const topLabel = new St.Label({
        text: "SF",
        y_align: Clutter.ActorAlign.CENTER
      });
      this.add_child(topLabel);
      const menu = this.menu;
      menu.addMenuItem(createSectionHeader("PHP"));
      const phpItem = new PopupBaseMenuItem({ reactive: false });
      const phpBox = new St.BoxLayout({ x_expand: true, y_align: Clutter.ActorAlign.CENTER });
      const phpDot = new St.Label({ text: "\u25CF  ", style: "color: #4ade80;" });
      const phpTitle = new St.Label({ text: "8.2" });
      phpTitle.set_x_expand(true);
      const opcacheBadge = new St.Label({
        text: "OPcache",
        style: "font-size: 10px; background-color: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-right: 8px;"
      });
      phpBox.add_child(phpDot);
      phpBox.add_child(phpTitle);
      phpBox.add_child(opcacheBadge);
      phpItem.add_child(phpBox);
      menu.addMenuItem(phpItem);
      menu.addMenuItem(new PopupSeparatorMenuItem());
      menu.addMenuItem(createSectionHeader("SERVERS"));
      menu.addMenuItem(createServerItem("moj-super-projekt", "8000", true, false));
      menu.addMenuItem(createServerItem("stary-projekt", "", false, false));
      menu.addMenuItem(new PopupSeparatorMenuItem());
      const serversSubMenu = new PopupMenu.PopupSubMenuMenuItem("\u{1F4C1} \u010Eal\u0161ie ob\u013E\xFAben\xE9 servery");
      for (let i = 1; i <= 30; i++) {
        const isRunning = i % 2 !== 0;
        const port = isRunning ? (8e3 + i).toString() : "";
        const item = createServerItem(`projekt-cislo-${i}`, port, isRunning, true);
        serversSubMenu.menu.addMenuItem(item);
      }
      menu.addMenuItem(serversSubMenu);
      menu.addMenuItem(new PopupSeparatorMenuItem());
      menu.addMenuItem(createSectionHeader("PROXY"));
      const proxySubMenu = new PopupMenu.PopupSubMenuMenuItem("Proxy be\u017E\xED: port 7080");
      const proxyDot = new St.Label({ text: "\u25CF  ", style: "color: #4ade80;" });
      const proxyLabelIdx = proxySubMenu.get_children().indexOf(proxySubMenu.label);
      proxySubMenu.insert_child_at_index(proxyDot, proxyLabelIdx !== -1 ? proxyLabelIdx : 1);
      const startProxyItem = new PopupMenuItem("\u25B6\uFE0F Zapn\xFA\u0165");
      proxySubMenu.menu.addMenuItem(startProxyItem);
      const stopProxyItem = new PopupMenuItem("\u23F9\uFE0F Vypn\xFA\u0165");
      proxySubMenu.menu.addMenuItem(stopProxyItem);
      const restartProxyItem = new PopupMenuItem("\u{1F504} Re\u0161tartova\u0165");
      proxySubMenu.menu.addMenuItem(restartProxyItem);
      const openBrowserItem = new PopupMenuItem("\u{1F310} Otvori\u0165 v prehliada\u010Di");
      proxySubMenu.menu.addMenuItem(openBrowserItem);
      menu.addMenuItem(proxySubMenu);
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
