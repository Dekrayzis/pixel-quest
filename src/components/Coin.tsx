import React from 'react';
import { Coin as CoinType } from '../types';
import { buildClassName, entityStyle } from '../utils/className';
import '../styles/coin.scss';

interface CoinProps {
  coin: CoinType;
  now: number;
}

function Coin({ coin, now }: CoinProps): React.ReactElement | null {
  const { collected, collectedAt } = coin;

  // Remove after collection animation
  if (collected && now - collectedAt > 500) return null;

  const className = buildClassName('coin', {
    'coin--collected': collected,
  });

  return (
    <div className={className} style={entityStyle(coin)}>
      <div className="coin__inner" />
    </div>
  );
}

export default Coin;
