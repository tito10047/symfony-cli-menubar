#!/bin/bash

# Zastaví skript, ak nastane akákoľvek chyba (okrem tých, ktoré ošetríme)
set -e

echo "--- 🛠️ Symfony Menubar: Wayland Build & Install ---"

# 1. Kompilácia
echo "📦 Spúšťam build..."
npm run build

# 2. Získanie UUID z metadata.json
UUID=$(grep -Po '"uuid": "\K[^"]*' metadata.json)

if [ -z "$UUID" ]; then
    echo "❌ Chyba: Nepodarilo sa nájsť UUID v metadata.json!"
    exit 1
fi

echo "🔄 Balím extenziu pre GNOME cache reset..."

# 3. Príprava dočasného priečinka
TMP_DIR="/tmp/symfony-ext-build"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

# 4. Bezpečné kopírovanie (nespadne, ak nejaký súbor/zložka chýba)
cp dist/extension.js "$TMP_DIR/"
cp metadata.json "$TMP_DIR/"

if [ -f "stylesheet.css" ]; then
    cp stylesheet.css "$TMP_DIR/"
fi

if [ -d "schemas" ]; then
    cp -r schemas "$TMP_DIR/"
    echo "⚙️ Kompilujem schémy..."
    glib-compile-schemas "$TMP_DIR/schemas/"
fi

# 5. Vytvorenie ZIP archívu
cd "$TMP_DIR"
zip -q -r "../$UUID.zip" .
cd - > /dev/null

# 6. Oficiálna inštalácia cez D-Bus (Toto donúti Wayland vymazať cache!)
echo "🚀 Inštalujem do GNOME Shell..."
gnome-extensions install --force "/tmp/$UUID.zip"

# --- Sekcia pre automatické odhlásenie (Wayland Fix) ---

echo ""
echo "⚠️ Inštalácia dokončená. Pre prejavenie zmien je nutné odhlásenie."
echo "🚀 Vypínam programy a odhlasujem o 3 sekundy..."

# Poslanie systémovej notifikácie (voliteľné, ale profesionálne)
if command -v notify-send > /dev/null; then
    notify-send "Symfony Menubar" "Inštalácia hotová. Systém sa o 3 sekundy odhlási!" --icon=dialog-warning
fi

# Čakanie 3 sekundy
sleep 3

# Príkaz na okamžité odhlásenie z GNOME session
# --no-prompt spôsobí, že sa nezobrazí potvrdzovacie okno GNOME "Naozaj sa chcete odhlásiť?"
gnome-session-quit --logout --no-prompt