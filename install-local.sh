#!/bin/bash

# Zastaví skript, ak nastane akákoľvek chyba
set -e

echo "--- 🛠️  Symfony Menubar: Senior Build & DevKit Install ---"

# 1. Kompilácia projektu
echo "📦 Spúšťam build (esbuild)..."
npm run build

# 2. Získanie UUID z metadata.json
# Používame grep, aby sme nemuseli inštalovať ďalšie nástroje
UUID=$(grep -Po '"uuid": "\K[^"]*' metadata.json)

if [ -z "$UUID" ]; then
    echo "❌ Chyba: Nepodarilo sa nájsť UUID v metadata.json!"
    exit 1
fi

# 3. Definícia cieľového priečinka
# Musí to byť presne UUID z metadata.json
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

echo "📂 Inštalujem do: $INSTALL_DIR"

# 4. Príprava priečinka (vymažeme starý, vytvoríme nový)
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# 5. Kopírovanie potrebných súborov
cp dist/extension.js "$INSTALL_DIR/"
cp metadata.json "$INSTALL_DIR/"
cp stylesheet.css "$INSTALL_DIR/"
cp -r schemas "$INSTALL_DIR/"

# 6. Kompilácia GSettings schém (kritické pre nastavenia)
echo "⚙️  Kompilujem schémy..."
glib-compile-schemas "$INSTALL_DIR/schemas/"

# 7. Spustenie testovacieho prostredia
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Vypnutie a zapnutie (tzv. soft reload)
gnome-extensions disable "$UUID" 2>/dev/null || true
gnome-extensions enable "$UUID"