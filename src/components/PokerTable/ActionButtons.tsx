import { useState } from 'react';
import type { PlayerAction } from '../../types/poker';
import './ActionButtons.css';

interface ActionButtonsProps {
    canCheck: boolean;
    canCall: boolean;
    minRaise: number;
    maxRaise: number;
    currentBet: number;
    isMyTurn: boolean;
    onAction: (action: PlayerAction, amount?: number) => void;
}

export const ActionButtons = ({
    canCheck,
    canCall,
    minRaise,
    maxRaise,
    currentBet,
    isMyTurn,
    onAction
}: ActionButtonsProps) => {
    const [raiseAmount, setRaiseAmount] = useState(minRaise);
    const [showRaiseSlider, setShowRaiseSlider] = useState(false);

    if (!isMyTurn) {
        return null;
    }

    const handleRaise = () => {
        if (showRaiseSlider) {
            onAction('raise', raiseAmount);
            setShowRaiseSlider(false);
        } else {
            setRaiseAmount(minRaise);
            setShowRaiseSlider(true);
        }
    };

    const handleQuickBet = (multiplier: number) => {
        const amount = Math.min(minRaise * multiplier, maxRaise);
        setRaiseAmount(amount);
    };

    return (
        <div className="action-buttons">
            <button
                className="action-btn fold"
                onClick={() => onAction('fold')}
            >
                Fold
            </button>

            {canCheck ? (
                <button
                    className="action-btn check"
                    onClick={() => onAction('check')}
                >
                    Check
                </button>
            ) : canCall ? (
                <button
                    className="action-btn call"
                    onClick={() => onAction('call')}
                >
                    Call {currentBet}
                </button>
            ) : null}

            <div className="raise-container">
                {showRaiseSlider && (
                    <div className="raise-slider">
                        <div className="quick-bets">
                            <button className="quick-bet-btn" onClick={() => handleQuickBet(1)}>Min</button>
                            <button className="quick-bet-btn" onClick={() => handleQuickBet(2)}>2x</button>
                            <button className="quick-bet-btn" onClick={() => handleQuickBet(3)}>3x</button>
                            <button className="quick-bet-btn" onClick={() => setRaiseAmount(maxRaise)}>Max</button>
                        </div>
                        <input
                            type="range"
                            min={minRaise}
                            max={maxRaise}
                            value={raiseAmount}
                            onChange={(e) => setRaiseAmount(Number(e.target.value))}
                        />
                        <span className="raise-amount">{raiseAmount}</span>
                    </div>
                )}
                <button
                    className="action-btn raise"
                    onClick={handleRaise}
                    disabled={maxRaise < minRaise}
                >
                    {showRaiseSlider ? `Raise ${raiseAmount}` : 'Raise'}
                </button>
            </div>

            <button
                className="action-btn all-in"
                onClick={() => onAction('all-in')}
            >
                All-In
            </button>
        </div>
    );
};
