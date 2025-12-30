# 🃏 Texas Hold'em Poker

Echtzeit Multiplayer Texas Hold'em Poker Spiel mit TypeScript und Supabase.

<img width="1164" height="810" alt="image" src="https://github.com/user-attachments/assets/cce23b99-64b6-491c-8d9d-83a37d9dad79" />

<img width="1386" height="865" alt="image" src="https://github.com/user-attachments/assets/06f7d71b-65f2-4809-aad6-5d1e081a48ff" />

## 🎮 Features

- **Echtzeit-Multiplayer**: Sofortige Synchronisation aller Aktionen
- **6-9 Spieler**: Pro Tisch
- **Visuelles Design**: 3D-Karten, Animationen, Sound-Effekte
- **Spielgeld**: Jeder startet mit 1.000 Chips

## 🛠️ Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | Vite + React + TypeScript |
| Backend | Supabase (Realtime + PostgreSQL) |
| Styling | CSS (Dark Theme, Glassmorphism) |

## 🚀 Lokale Entwicklung

1.  **Dependencies installieren**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Erstelle eine Datei namens `.env.local` im Hauptverzeichnis des Projekts und füge deine Supabase-Zugangsdaten ein:
    ```bash
    VITE_SUPABASE_URL=deine_supabase_url
    VITE_SUPABASE_ANON_KEY=dein_supabase_anon_key
    ```
    *(Siehe [.env.example](./.env.example) für eine Vorlage)*

3.  **Entwicklungsserver starten**:
    ```bash
    npm run dev
    ```

Öffne [http://localhost:5173](http://localhost:5173) im Browser.

## 📄 Dokumentation

- [Implementierungsplan](./plan.md)
- [Changelog](./changelog.md)

---

## 🚀 Deployment & Setup

### 1. Supabase (Backend)

Dieses Projekt nutzt **Supabase Realtime Broadcast** für die schnelle Kommunikation zwischen Spielern.

1.  Erstelle ein neues Projekt auf [Supabase](https://supabase.com).
2.  Du benötigst **keine** Datenbank-Tabellen für diese Version, da die Kommunikation rein über WebSocket-Channels ("Broadcast") läuft.
3.  Hole dir deine API-Keys unter **Project Settings > API**:
    *   Project URL
    *   `anon` public key

### 2. Vercel (Hosting & Deployment)

Das Frontend ist für das Hosting auf **Vercel** optimiert.

1.  **Repository verbinden**: Importiere dieses Repository in Vercel.
2.  **Environment Variables**: Füge in den Vercel-Projekteinstellungen hinzu:
    *   `VITE_SUPABASE_URL`: Deine Supabase Project URL
    *   `VITE_SUPABASE_ANON_KEY`: Dein Supabase Anon Key
3.  **Deploy**: Vercel erkennt automatisch `npm run build` und deployed die App.

---

## ⚠️ Rechtliche Hinweise & Haftungsausschluss

**WICHTIGER HINWEIS (Disclaimer)**

Dieses Projekt dient ausschließlich als **Demonstration** für die Nutzung von Vercel und Supabase im Kontext von "Vibecoding".
Es ist **nicht** für den produktiven Einsatz oder für Echtgeld-Glücksspiel gedacht.
*   **Nutzung auf eigene Gefahr.**
*   Bitte beachte stets Sicherheitsaspekte (z.B. Row Level Security, Validierung), bevor du Code in Produktion nimmst.
*   Der Ersteller übernimmt keine Haftung für Schäden oder Datenverlust.

## 📄 Lizenz

Dieses Projekt ist unter der **MIT Lizenz** veröffentlicht. Siehe [LICENSE](./LICENSE) Datei für Details.

