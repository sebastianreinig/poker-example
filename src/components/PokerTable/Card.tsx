import type { Card as CardType } from '../../types/poker';
import { getSuitSymbol, getSuitColor } from '../../lib/card-utils';
import './Card.css';

interface CardProps {
    card?: CardType;
    faceDown?: boolean;
    small?: boolean;
    community?: boolean;
    winning?: boolean;
    flipping?: boolean;
}

export const Card = ({
    card,
    faceDown = false,
    small = false,
    community = false,
    winning = false,
    flipping = false
}: CardProps) => {
    const classNames = [
        'card',
        faceDown && 'face-down',
        small && 'small',
        community && 'community',
        winning && 'winning',
        flipping && 'flipping',
        card && getSuitColor(card.suit)
    ].filter(Boolean).join(' ');

    if (faceDown || !card) {
        return <div className={classNames} />;
    }

    const suitSymbol = getSuitSymbol(card.suit);

    return (
        <div className={classNames}>
            <div className="card-corner top">
                <span className="card-rank">{card.rank}</span>
                <span className="card-suit">{suitSymbol}</span>
            </div>
            <div className="card-center">{suitSymbol}</div>
            <div className="card-corner bottom">
                <span className="card-rank">{card.rank}</span>
                <span className="card-suit">{suitSymbol}</span>
            </div>
        </div>
    );
};
