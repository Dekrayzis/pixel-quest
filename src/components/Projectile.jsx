import React from 'react';
import '../styles/projectile.scss';

function Projectile({ projectile }) {
  const { x, y, width, height, direction } = projectile;

  return (
    <div
      className="projectile"
      style={{ left: x, top: y, width, height }}
    >
      <div className="projectile__ball" />
      <div
        className={`projectile__trail projectile__trail--${
          direction === 1 ? 'left' : 'right'
        }`}
      />
    </div>
  );
}

export default Projectile;
