# Texas Hold'em Poker - Implementierungsplan

Echtzeit Texas Hold'em Poker mit TypeScript Frontend und Supabase Backend.

---

## Architektur

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Vite + React + TS)"]
        UI[Poker Table UI]
        State[Game State Manager]
        RT[Realtime Client]
    end
    
    subgraph Supabase["Supabase Backend"]
        DB[(PostgreSQL)]
        Realtime[Realtime Broadcast]
        Edge[Edge Functions]
    end
    
    UI --> State
    State <--> RT
    RT <--> Realtime
    State --> Edge
    Edge --> DB
```

---

## Datenbank-Schema

### players
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| name | text | Spielername |
| chips | integer | Aktuelle Chips (Start: 1000) |
| seat_position | integer | Platz 0-8 |
| is_active | boolean | Noch im Spiel? |

### game_state
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| phase | text | 'waiting', 'preflop', 'flop', 'turn', 'river', 'showdown' |
| community_cards | jsonb | Community Cards Array |
| pot | integer | Aktueller Pot |
| current_bet | integer | Aktueller Einsatz |
| dealer_position | integer | Dealer Button Position |
| current_player | uuid | Wer ist dran? |

### player_hands
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| player_id | uuid | FK zu players |
| cards | jsonb | 2 Hole Cards |
| current_bet | integer | Einsatz dieser Runde |
| has_folded | boolean | Gefoldet? |

---

## Spielablauf

```mermaid
stateDiagram-v2
    [*] --> Waiting: Spieler joinen
    Waiting --> PreFlop: Min 2 Spieler
    PreFlop --> Flop: Betting fertig
    Flop --> Turn: Betting fertig
    Turn --> River: Betting fertig
    River --> Showdown: Finale Bets
    Showdown --> PreFlop: Neue Runde
```

---

## Features

- ✅ Echtzeit-Synchronisation via Supabase Realtime
- ✅ 6-9 Spieler pro Tisch
- ✅ Visuell aufwändiges UI (Animationen, 3D-Karten)
- ✅ Sound-Effekte (Karten, Chips)
- ✅ Spielgeld (Start: 1000 Chips)
