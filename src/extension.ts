import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { ConsoleLogger } from './core/logging/ConsoleLogger';
import { GjsProcessRunner } from './core/GjsProcessRunner';
import { SymfonyCliManager } from './core/SymfonyCliManager';
import { Indicator, IndicatorType } from './ui/Indicator';

export default class SymfonyMenubarExtension extends Extension {
    private _indicator?: IndicatorType;

    enable(): void {
        try {
            const logger = new ConsoleLogger();
            const processRunner = new GjsProcessRunner(logger);
            const cliManager = new SymfonyCliManager(processRunner);
            cliManager.setLogger(logger);

            logger.info('Symfony Menubar Extension Enabled');

            this._indicator = new Indicator(cliManager, logger, this);
            Main.panel.addToStatusArea('symfony-menubar', this._indicator);
            this._indicator.startRefresh(10);
        } catch (e) {
            console.error(`[SymfonyMenubar] Failed to enable extension: ${e}`);
        }
    }

    disable(): void {
        try {
            this._indicator?.stopRefresh();
            this._indicator?.destroy();
            this._indicator = undefined;
            console.log('Symfony Menubar Disabled');
        } catch (e) {
            console.error(`[SymfonyMenubar] Error during disable: ${e}`);
        }
    }
}
