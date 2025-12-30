import { useState, useEffect } from 'react';
import type { GameState, Player } from '../../types/poker';
import { evaluateHand } from '../../lib/poker-logic';
import { soundManager } from '../../lib/sounds';
import { PlayerSeat } from './PlayerSeat';
import { Card } from './Card';
import { ActionButtons } from './ActionButtons';
import './PokerTable.css';

interface PokerTableProps {
    gameState: GameState;
    myPlayer: Player | null;
    isMyTurn: boolean;
    turnTimeLeft: number;
    canCheck: boolean;
    canCall: boolean;
    minRaise: number;
    onAction: (action: any, amount?: number) => void;
    onStartGame: () => void;
    onNextRound: () => void;
}

const MAX_SEATS = 9;

export const PokerTable = ({
    gameState,
    myPlayer,
    isMyTurn,
    turnTimeLeft,
    canCheck,
    canCall,
    minRaise,
    onAction,
    onStartGame,
    onNextRound
}: PokerTableProps) => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showWinner, setShowWinner] = useState(false);

    useEffect(() => {
        soundManager.setEnabled(soundEnabled);
    }, [soundEnabled]);

    useEffect(() => {
        if (gameState.phase === 'showdown' && gameState.winners.length > 0) {
            setShowWinner(true);
            const timer = setTimeout(() => setShowWinner(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [gameState.phase, gameState.winners]);

    const getPlayerAtSeat = (seatPosition: number): Player | null => {
        return gameState.players.find(p => p.seatPosition === seatPosition) || null;
    };

    const getWinnerName = (): string => {
        const winners = gameState.winners.map(id =>
            gameState.players.find(p => p.id === id)?.name || 'Unknown'
        );
        return winners.join(' & ');
    };

    const getWinnerHand = (): string => {
        if (gameState.winners.length === 0) return '';
        const winner = gameState.players.find(p => p.id === gameState.winners[0]);
        if (!winner || winner.cards.length === 0) return '';

        const result = evaluateHand([...winner.cards, ...gameState.communityCards]);
        return result.rankName;
    };

    const maxRaise = myPlayer?.chips || 0;

    return (
        <div className="poker-table-container">
            {/* Phase indicator */}
            <div className={`phase-indicator ${gameState.phase}`}>
                {gameState.phase === 'waiting' ? 'Warten auf Spieler...' : gameState.phase.toUpperCase()}
            </div>

            {/* Sound toggle */}
            <button
                className={`sound-toggle ${!soundEnabled ? 'muted' : ''}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
            >
                {soundEnabled ? '🔊' : '🔇'}
            </button>

            <div className="poker-table">
                {/* Table surface */}
                <div className="table-surface" />

                {/* Player seats */}
                {Array.from({ length: MAX_SEATS }).map((_, i) => {
                    const player = getPlayerAtSeat(i);
                    return (
                        <PlayerSeat
                            key={i}
                            player={player}
                            position={i}
                            isMe={player?.id === myPlayer?.id}
                            isCurrentTurn={player?.id === gameState.currentPlayerId}
                            isWinner={gameState.winners.includes(player?.id || '')}
                            turnTimeLeft={player?.id === gameState.currentPlayerId ? turnTimeLeft : 30}
                            showCards={gameState.phase === 'showdown'}
                        />
                    );
                })}

                {/* Center area */}
                <div className="table-center">
                    <div className="table-logo">♠ ♥ ♦ ♣</div>

                    {/* Community cards */}
                    {gameState.phase !== 'waiting' && (
                        <div className="community-cards">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`community-card-slot ${gameState.communityCards[i] ? 'filled' : ''}`}
                                >
                                    {gameState.communityCards[i] && (
                                        <Card
                                            card={gameState.communityCards[i]}
                                            community
                                            winning={gameState.phase === 'showdown'}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pot display */}
                    {gameState.pot > 0 && (
                        <div className="pot-display">
                            <div className="pot-chips">
                                <div className="pot-chip" />
                                <div className="pot-chip" />
                                <div className="pot-chip" />
                            </div>
                            <span className="pot-amount">{gameState.pot.toLocaleString()} 💰</span>
                        </div>
                    )}
                </div>

                {/* Start game button */}
                {gameState.phase === 'waiting' && gameState.players.length >= 2 && (
                    <button
                        className="start-game-btn"
                        onClick={onStartGame}
                    >
                        Spiel Starten
                    </button>
                )}

                {gameState.phase === 'waiting' && gameState.players.length < 2 && (
                    <div className="start-game-btn" style={{ cursor: 'default' }}>
                        Min. 2 Spieler
                    </div>
                )}

                {/* Winner announcement */}
                {showWinner && gameState.winners.length > 0 && (
                    <div className="winner-announcement">
                        <h2>🎉 {getWinnerName()} gewinnt!</h2>
                        <p>
                            Mit <span className="hand-name">{getWinnerHand()}</span>
                        </p>
                        <p style={{ marginTop: '10px', color: '#fbbf24' }}>
                            +{gameState.pot.toLocaleString()} Chips
                        </p>
                        <button
                            className="next-round-btn"
                            onClick={onNextRound}
                            style={{
                                marginTop: '15px',
                                padding: '10px 20px',
                                fontSize: '1.2rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                            }}
                        >
                            Nächste Runde ➤
                        </button>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            {myPlayer && gameState.phase !== 'waiting' && gameState.phase !== 'showdown' && (
                <ActionButtons
                    canCheck={canCheck}
                    canCall={canCall}
                    minRaise={minRaise}
                    maxRaise={maxRaise}
                    currentBet={gameState.currentBet}
                    isMyTurn={isMyTurn}
                    onAction={onAction}
                />
            )}
        </div>
    );
};
