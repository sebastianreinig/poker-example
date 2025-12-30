import { useState } from 'react';
import type { Player } from '../../types/poker';
import './JoinScreen.css';

interface JoinScreenProps {
    players: Player[];
    onJoin: (name: string) => void;
}

const MAX_PLAYERS = 9;

export const JoinScreen = ({ players, onJoin }: JoinScreenProps) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && players.length < MAX_PLAYERS) {
            onJoin(name.trim());
        }
    };

    const seatsAvailable = MAX_PLAYERS - players.length;

    return (
        <div className="join-screen">
            {/* Decorative chips */}
            <div className="chip-decoration" />
            <div className="chip-decoration" />
            <div className="chip-decoration" />
            <div className="chip-decoration" />

            <div className="join-card">
                <div className="join-logo">
                    <h1>Texas Hold'em</h1>
                    <div className="suits">
                        <span className="black">♠</span>
                        <span className="red">♥</span>
                        <span className="red">♦</span>
                        <span className="black">♣</span>
                    </div>
                    <p className="join-subtitle">Multiplayer Poker</p>
                </div>

                <form className="join-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Dein Name</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Spielername eingeben..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                            autoFocus
                            autoComplete="off"
                        />
                    </div>

                    <button
                        type="submit"
                        className="join-btn"
                        disabled={!name.trim() || players.length >= MAX_PLAYERS}
                    >
                        Am Tisch Platz nehmen
                    </button>
                </form>

                {players.length > 0 && (
                    <div className="table-status">
                        <h3>Spieler am Tisch</h3>
                        <div className="player-list">
                            {players.map(player => (
                                <span key={player.id} className="player-badge">
                                    {player.name}
                                </span>
                            ))}
                        </div>
                        <p className="seats-available">
                            <span>{seatsAvailable}</span> {seatsAvailable === 1 ? 'Platz' : 'Plätze'} frei
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
