import React from 'react';
import { Projectile as ProjectileType } from '../types';
import { entityStyle } from '../utils/className';
import '../styles/projectile.scss';

interface ProjectileProps {
  projectile: ProjectileType;
}

function Projectile({ projectile }: ProjectileProps): React.ReactElement {
  const { direction } = projectile;

  return (
    <div
      className="projectile"
      style={entityStyle(projectile)}
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
