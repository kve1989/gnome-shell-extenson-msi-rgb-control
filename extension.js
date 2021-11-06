/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * https://www.codeproject.com/Articles/5271677/How-to-Create-A-GNOME-Extension
 */

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, GLib, Gio, St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = ExtensionUtils.getCurrentExtension();

const _ = ExtensionUtils.gettext;

const models = ["GE63", "GE73", "GE75", "GS63", "GS73", "GS75", "GX63", "GT63", "GL63", "GS65"];
const presets = ["aqua", "chakra", "default", "disco", "drain", "freeway", "rainbow-split", "roulette"];

const colors = [
    { name: "white", hex: "ffffff" },
    { name: "black", hex: "000000" },
    { name: "red", hex: "ff0000" },
    { name: "orange", hex: "ffa500" },
    { name: "yellow", hex: "ffff00" },
    { name: "green", hex: "008000" },
    { name: "blue", hex: "0000ff" },
    { name: "purple", hex: "4b0082" },
    { name: "pink", hex: "ee82ee" }
];

const command = "msi-perkeyrgb --model GS65";

function run_command(command) {
    // https://gjs.guide/guides/gio/subprocesses.html#synchronous-execution
    // https://gjs-docs.gnome.org/glib20~2.66.1/glib.spawn_command_line_sync
    try {
        let [, stdout, stderr, status] = GLib.spawn_command_line_sync(command);

        if (status !== 0) {
            if (stderr instanceof Uint8Array) {
                stderr = ByteArray.toString(stderr);
            }
            //throw new Error(stderr);
            return stderr;
        }

        if (stdout instanceof Uint8Array) {
            stdout = ByteArray.toString(stdout);
        }

        return stdout;
    } catch (e) {
        return e.toString();
    }
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        this.add_child(new St.Icon({
            gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/msi.svg'),
            style_class: 'system-status-icon',
        }));

        let presetsMenu = new PopupMenu.PopupSubMenuMenuItem('Presets');
        this.menu.addMenuItem(presetsMenu);
        for (let preset of presets) {
            let presetItem = new PopupMenu.PopupMenuItem(preset);
            presetItem.connect('activate', () => {
                run_command(command + ' -p ' + preset);
            });
            presetsMenu.menu.addMenuItem(presetItem);
        }

        let colorsMenu = new PopupMenu.PopupSubMenuMenuItem('Colors');
        this.menu.addMenuItem(colorsMenu);
        for (let color of colors) {
            let colorItem = new PopupMenu.PopupMenuItem(color.name[0].toUpperCase() + color.name.slice(1));
            colorItem.connect('activate', () => {
                run_command(command + ' -s ' + color.hex);
            });
            colorsMenu.menu.addMenuItem(colorItem);
        }
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
