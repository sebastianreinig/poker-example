import type { Player } from '../../types/poker';
import { Card } from './Card';
import './PlayerSeat.css';

interface PlayerSeatProps {
    player: Player | null;
    position: number;
    isMe: boolean;
    isCurrentTurn: boolean;
    isWinner: boolean;
    turnTimeLeft?: number;
    showCards: boolean;
}

// Position offsets for 9 seats around an oval table
const SEAT_POSITIONS: { [key: number]: { top: string; left: string; betOffset: { top: string; left: string } } } = {
    0: { top: '85%', left: '50%', betOffset: { top: '-60px', left: '0' } },
    1: { top: '75%', left: '15%', betOffset: { top: '-40px', left: '60px' } },
    2: { top: '50%', left: '5%', betOffset: { top: '0', left: '80px' } },
    3: { top: '25%', left: '15%', betOffset: { top: '40px', left: '60px' } },
    4: { top: '10%', left: '35%', betOffset: { top: '60px', left: '20px' } },
    5: { top: '10%', left: '65%', betOffset: { top: '60px', left: '-20px' } },
    6: { top: '25%', left: '85%', betOffset: { top: '40px', left: '-60px' } },
    7: { top: '50%', left: '95%', betOffset: { top: '0', left: '-80px' } },
    8: { top: '75%', left: '85%', betOffset: { top: '-40px', left: '-60px' } },
};

export const PlayerSeat = ({
    player,
    position,
    isMe,
    isCurrentTurn,
    isWinner,
    turnTimeLeft = 30,
    showCards
}: PlayerSeatProps) => {
    const posStyle = SEAT_POSITIONS[position] || SEAT_POSITIONS[0];

    const classNames = [
        'player-seat',
        !player && 'empty',
        player?.isFolded && 'folded',
        isCurrentTurn && 'current-turn',
        isWinner && 'winner'
    ].filter(Boolean).join(' ');

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2);
    };

    return (
        <div
            className={classNames}
            style={{
                top: posStyle.top,
                left: posStyle.left,
                transform: 'translate(-50%, -50%)'
            }}
        >
            {player ? (
                <>
                    <div className={`player-avatar ${player.isDealer ? 'dealer' : ''}`}>
                        {isCurrentTurn && (
                            <div
                                className={`timer-ring ${turnTimeLeft <= 5 ? 'warning' : ''}`}
                                style={{ animationDuration: `${turnTimeLeft}s` }}
                            />
                        )}
                        {getInitials(player.name)}
                    </div>

                    <div className="player-info">
                        <div className="player-name">{isMe ? `${player.name} (Du)` : player.name}</div>
                        <div className="player-chips">{player.chips.toLocaleString()}</div>
                    </div>

                    {player.cards.length > 0 && (
                        <div className="player-cards">
                            {player.cards.map((card, i) => (
                                <Card
                                    key={i}
                                    card={card}
                                    faceDown={!isMe && !showCards}
                                    small
                                />
                            ))}
                        </div>
                    )}

                    {player.currentBet > 0 && (
                        <div
                            className="player-bet"
                            style={{
                                top: posStyle.betOffset.top,
                                left: posStyle.betOffset.left
                            }}
                        >
                            {player.currentBet.toLocaleString()} 💰
                        </div>
                    )}

                    {player.isSmallBlind && <div className="blind-indicator">SB</div>}
                    {player.isBigBlind && <div className="blind-indicator">BB</div>}

                    {player.isAllIn && (
                        <div className="player-action all-in">All-In!</div>
                    )}
                </>
            ) : (
                <div className="player-avatar" style={{ opacity: 0.3, background: '#374151' }}>
                    {position + 1}
                </div>
            )}
        </div>
    );
};
