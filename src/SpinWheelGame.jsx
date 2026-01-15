import React, { useState, useRef, useEffect } from 'react';
import './SpinWheelGame.css';

const PRIZES = [
  { id: 1, label: '50 Points', color: '#FF6B6B', weight: 4 }, // Common
  { id: 2, label: '100 Points', color: '#4ECDC4', weight: 3 },
  { id: 3, label: '500 Points', color: '#45B7D1', weight: 2 },
  { id: 4, label: 'JACKPOT', color: '#FFD93D', weight: 1 }, // Rare
  { id: 5, label: 'Try Again', color: '#6C5CE7', weight: 4 },
  { id: 6, label: 'Mystery', color: '#A8E6CF', weight: 2 },
  { id: 7, label: 'Bonus', color: '#FF8B94', weight: 3 },
  { id: 8, label: 'Free Spin', color: '#FFAAA5', weight: 2 },
];

const SPIN_DURATION_MS = 4000; // 4 seconds

export default function SpinWheelGame() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
        const saved = localStorage.getItem('spinHistory');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  // Calculate weighted random selection
  const selectPrize = () => {
    const totalWeight = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
    let randomValue = Math.random() * totalWeight;
    
    for (const prize of PRIZES) {
      if (randomValue < prize.weight) {
        return prize;
      }
      randomValue -= prize.weight;
    }
    return PRIZES[PRIZES.length - 1]; // Fallback
  };

  const spin = () => {
    if (isSpinning) return;

    const newPrize = selectPrize();
    
    // Calculate rotation
    const sliceAngle = 360 / PRIZES.length;
    const prizeIndex = PRIZES.findIndex(p => p.id === newPrize.id);
    
    // We want the winner to be at 0 degrees (top)
    // The prize's current center angle in the standard layout:
    const prizeCenterAngle = (prizeIndex * sliceAngle) + (sliceAngle / 2);
    
    const extraSpins = 5; // Fixed spins
    
    // Calculate new rotation
    // We want final position % 360 to be (360 - prizeCenterAngle)
    // But we must add to current rotation to keep spinning forward
    // Find next satisfying angle > currentRotation
    
    const currentVisRotation = rotation;
    
    // Just add 5 full spins + distance to target
    // Distance to target from current position:
    // We are at `currentVisRotation`.
    // Normalized current pos: `currentVisRotation % 360`.
    // Target pos: `(360 - prizeCenterAngle) % 360`.
    
    // Example: Current 10. Target 350. Delta = 340.
    // Example: Current 350. Target 10. Delta = 20. 
    
    let targetNormalized = (360 - prizeCenterAngle) % 360;
    let currentNormalized = currentVisRotation % 360;
    
    let delta = targetNormalized - currentNormalized;
    if (delta < 0) delta += 360;
    
    // Add extra full spins
    const totalRotation = currentVisRotation + (360 * extraSpins) + delta;

    setRotation(totalRotation);
    setIsSpinning(true);
    setSelectedPrize(null); // Clear previous selection immediately

    // Animation end handler
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedPrize(newPrize);
      setHistory(prev => {
        const newHist = [newPrize, ...prev].slice(0, 10);
        localStorage.setItem('spinHistory', JSON.stringify(newHist));
        return newHist;
      });
    }, SPIN_DURATION_MS); 
  };

  const resetGame = () => {
    if (isSpinning) return;
    setRotation(0);
    setSelectedPrize(null);
  };

  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('spinHistory');
  };

  return (
    <div className="game-container">
      <div className="wheel-wrapper">
        <div className="pointer"></div>
        <div 
            className="wheel" 
            style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)` : 'none' 
            }}
        >
            {PRIZES.map((prize, index) => {
            const rotation = index * (360 / PRIZES.length);
            const skewY = 90 - (360 / PRIZES.length);
            return (
                <div 
                key={prize.id} 
                className="segment"
                style={{
                    backgroundColor: prize.color,
                    transform: `rotate(${rotation}deg) skewY(-${skewY}deg)`,
                }}
                >
                <div 
                    className="segment-text" 
                    style={{ 
                        transform: `skewY(${skewY}deg) rotate(${360 / PRIZES.length / 2}deg)` 
                    }}
                >
                    {prize.label}
                </div>
                </div>
            );
            })}
        </div>
      </div>

      <div className="controls">
        <button className="spin-btn" onClick={spin} disabled={isSpinning}>
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>
        <button onClick={resetGame} disabled={isSpinning} className="secondary-btn">
          Reset
        </button>
      </div>

      <div className="status-area">
        {selectedPrize && (
            <div className="result-display">
            <h2>Won: {selectedPrize.label}</h2>
            </div>
        )}
      </div>

      <div className="history">
        <h3>History (Last 10)</h3>
        {history.length > 0 && <button onClick={clearHistory} className="small-btn">Clear</button>}
        <ul>
            {history.map((h, i) => (
                <li key={i} className="history-item">
                    <span className="dot" style={{ backgroundColor: h.color }}></span>
                    <span className="label">{h.label}</span>
                </li>
            ))}
            {history.length === 0 && <li>No outcomes yet</li>}
        </ul>
      </div>
    </div>
  );
}
