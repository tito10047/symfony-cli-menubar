import St from 'gi://St';
import { PopupBaseMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js';

/**
 * Returns a non-interactive, visually distinct section divider row.
 * The label text is uppercased unconditionally.
 * Pass `options.onRefresh` to include a refresh button with hover effect and cursor change.
 */
export function createSectionHeader(
    text: string,
    options?: { onRefresh?: () => void }
): InstanceType<typeof PopupBaseMenuItem> {
    const header = new PopupBaseMenuItem({ reactive: false });
    const label = new St.Label({
        text: text.toUpperCase(),
        style: 'font-size: 11px; font-weight: bold; color: rgba(255, 255, 255, 0.4); padding-top: 5px; padding-bottom: 2px;',
        x_expand: true,
    });
    label.clutter_text.ellipsize = 0;
    header.add_child(label);

    if (options?.onRefresh) {
        const btn = new St.Button({
            label: '↺',
            reactive: true,
            track_hover: true,
            style: 'font-size: 14px; color: rgba(255,255,255,0.5); padding: 0 4px;',
        });

        btn.connect('notify::hover', () => {
            if (btn.hover) {
                btn.set_style('font-size: 14px; color: rgba(255,255,255,0.9); padding: 0 4px;');
            } else {
                btn.set_style('font-size: 14px; color: rgba(255,255,255,0.5); padding: 0 4px;');
            }
        });

        btn.connect('clicked', options.onRefresh);
        header.add_child(btn);
    }

    return header;
}
