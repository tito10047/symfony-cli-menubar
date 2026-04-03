#!/bin/bash
set -e

echo "--- 🛠️  Symfony Menubar: Build, Install & Debug ---"

# 1. Build project
echo "Building project..."
npm run build

# 2. Get UUID from metadata.json
UUID=$(grep -Po '"uuid": "\K[^"]*' metadata.json)
if [ -z "$UUID" ]; then
    echo "❌ Error: Could not find UUID in metadata.json"
    exit 1
fi

INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

# 3. Inštalácia súborov
echo "Installing to: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp dist/extension.js "$INSTALL_DIR/"
cp metadata.json "$INSTALL_DIR/"
cp stylesheet.css "$INSTALL_DIR/"
cp -r schemas "$INSTALL_DIR/"

# 4. Kompilácia schém
echo "Compiling schemas..."
glib-compile-schemas "$INSTALL_DIR/schemas/"

# 5. Spustenie Nested Shellu
echo -e "\n-------------------------------------------------------"
echo -e "🚀 OTVÁRAM TESTOVACIE OKNO (Nested GNOME Shell)"
echo -e "-------------------------------------------------------"
echo -e "Poznámka: Ak sa lišta neobjaví hneď, v novom okne ju zapni."
echo -e "Zavretím tohto okna (alebo Ctrl+C) ukončíš testovanie.\n"

# Spustíme Nested Shell. Príkaz 'dbus-run-session' zabezpečí izolované prostredie.
# Beží v popredí, aby si videl prípadné pády priamo v tomto termináli.
# Spustíme Mutter ako vnorený Wayland kompozitor, ktorý v sebe spustí gnome-shell
dbus-run-session -- mutter --wayland --nested --gnome-shell