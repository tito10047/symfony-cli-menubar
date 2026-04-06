import GLib from 'gi://GLib';
import { ProxyStatus } from '../dto/ProxyStatus.js';
import { LoggerInterface } from '../interfaces/LoggerInterface.js';

export interface ProxyPollingCallbacks {
    fetchProxyStatus: () => Promise<ProxyStatus>;
    onProxyStarted: (status: ProxyStatus) => void;
}

export class ProxyPollingService {
    private _tickTimerId: number | null = null;
    private _timeoutTimerId: number | null = null;
    private _callbacks: ProxyPollingCallbacks | null = null;

    constructor(
        private _getSettings: () => { pollInterval: number; startupTimeout: number },
        private _logger: LoggerInterface,
    ) {}

    startStartupPolling(callbacks: ProxyPollingCallbacks): void {
        this.cancel();
        const { pollInterval, startupTimeout } = this._getSettings();

        if (startupTimeout <= 0) {
            this._logger.info('Proxy startup polling disabled (timeout = 0)');
            return;
        }

        this._callbacks = callbacks;
        this._logger.info(`Starting proxy startup poll: interval=${pollInterval}s, timeout=${startupTimeout}s`);

        this._tickTimerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, pollInterval, () => {
            this._tick();
            return GLib.SOURCE_CONTINUE;
        });

        this._timeoutTimerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, startupTimeout, () => {
            this._logger.info('Proxy startup poll timeout — stopping');
            this.cancel();
            return GLib.SOURCE_REMOVE;
        });
    }

    cancel(): void {
        if (this._tickTimerId !== null) {
            GLib.Source.remove(this._tickTimerId);
            this._tickTimerId = null;
        }
        if (this._timeoutTimerId !== null) {
            GLib.Source.remove(this._timeoutTimerId);
            this._timeoutTimerId = null;
        }
        this._callbacks = null;
    }

    private _tick(): void {
        const cb = this._callbacks;
        if (!cb) return;

        cb.fetchProxyStatus()
            .then(status => {
                if (status.isRunning) {
                    this._logger.info('Proxy startup poll: proxy is now running');
                    this.cancel();
                    cb.onProxyStarted(status);
                }
            })
            .catch(err => this._logger.error('Proxy startup poll tick failed:', err));
    }
}
