import React from 'react';
import '../styles/coin.scss';

const Coin = React.memo(function Coin({ coin, now }: { coin: any; now: number }): React.ReactElement | null {
  const { x, y, collected, collectedAt } = coin;

  // Remove after collection animation
  if (collected && now - collectedAt > 500) return null;

  const className = [
    'coin',
    collected ? 'coin--collected' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className} style={{ left: x, top: y }}>
      <div className="coin__inner" />
    </div>
  );
});

export default Coin;
