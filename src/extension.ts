import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Indicator, IndicatorType } from './ui/Indicator.js';

export default class SymfonyMenubarExtension extends Extension {
    private _indicator: IndicatorType | null = null;

    enable(): void {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable(): void {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
