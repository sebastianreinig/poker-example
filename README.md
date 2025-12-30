# 🃏 Texas Hold'em Poker

Echtzeit Multiplayer Texas Hold'em Poker Spiel mit TypeScript und Supabase.

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

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:5173](http://localhost:5173) im Browser.

## 📄 Dokumentation

- [Implementierungsplan](./plan.md)
- [Changelog](./changelog.md)

---

## 🚀 Coding in Antigravity Guide

### Der Initiale Prompt
Dies war der Prompt, der dieses Projekt gestartet hat:

> **Entwickle ein Texas Hold'em Poker Spiel.**
>
> **Prinzip:** Klassisches Texas Hold'em für 6-9 Spieler an einem Tisch.
> **Frontend:** TypeScript, React, Vite (Modernes, "Premium" UI mit Animationen).
> **Backend:** Supabase (für Echtzeit-Synchronisation via WebSockets/Broadcast, Datenbank und Edge Functions).
>
> **Anforderungen:**
> - Extrem schnelle Übertragung (Instant-Updates)
> - Visuell ansprechendes Design (Dark Mode, Glassmorphism, 3D-Karten)
> - Spielgeld-Währung
> - Einfacher Einstieg (Name eingeben & Joinen)
>
> Alternative falls Supabase nicht passt: Socket.io + Node.js (wurde aber zugunsten von Supabase verworfen).

## 🚀 Deployment & Setup

### 1. Supabase (Backend)

Dieses Projekt nutzt **Supabase Realtime Broadcast** für die schnelle Kommunikation zwischen Spielern.

1.  Erstelle ein neues Projekt auf [Supabase](https://supabase.com).
2.  Du benötigst **keine** Datenbank-Tabellen für diese Version, da die Kommunikation rein über WebSocket-Channels ("Broadcast") läuft.
3.  Hole dir deine API-Keys unter **Project Settings > API**:
    *   Project URL
    *   `anon` public key

> [!NOTE]
> Die ursprünglich geplante SQL-Struktur wird in dieser Version noch nicht aktiv genutzt, ist aber für zukünftige Persistenz vorbereitet.

### 2. Rechtliche Hinweise & Haftungsausschluss

**⚠️ WICHTIGER HINWEIS (Disclaimer)**

Dieses Projekt dient ausschließlich als **Demonstration** für die Nutzung von Vercel und Supabase im Kontext von "Vibecoding".
Es ist **nicht** für den produktiven Einsatz oder für Echtgeld-Glücksspiel gedacht.
*   **Nutzung auf eigene Gefahr.**
*   Bitte beachte stets Sicherheitsaspekte (z.B. Row Level Security, Validierung), bevor du Code in Produktion nimmst.
*   Der Ersteller übernimmt keine Haftung für Schäden oder Datenverlust.

### 3. Lizenz

Dieses Projekt ist unter der **MIT Lizenz** veröffentlicht. Siehe [LICENSE](./LICENSE) Datei für Details.

### 2. Vercel (Hosting & Deployment)

Das Frontend ist für das Hosting auf **Vercel** optimiert.

1.  **Repository verbinden**: Importiere dieses Repository in Vercel.
2.  **Environment Variables**: Füge in den Vercel-Projekteinstellungen hinzu:
    *   `VITE_SUPABASE_URL`: Deine Supabase Project URL
    *   `VITE_SUPABASE_ANON_KEY`: Dein Supabase Anon Key
3.  **Deploy**: Vercel erkennt automatisch `npm run build` und deployed die App.

### 3. Rechtliche Hinweise & Haftungsausschluss

**⚠️ WICHTIGER HINWEIS (Disclaimer)**

Dieses Projekt dient ausschließlich als **Demonstration** für die Nutzung von Vercel und Supabase im Kontext von "Vibecoding".
Es ist **nicht** für den produktiven Einsatz oder für Echtgeld-Glücksspiel gedacht.
*   **Nutzung auf eigene Gefahr.**
*   Bitte beachte stets Sicherheitsaspekte (z.B. Row Level Security, Validierung), bevor du Code in Produktion nimmst.
*   Der Ersteller übernimmt keine Haftung für Schäden oder Datenverlust.

### 4. Lizenz

Dieses Projekt ist unter der **MIT Lizenz** veröffentlicht. Siehe [LICENSE](./LICENSE) Datei für Details.
