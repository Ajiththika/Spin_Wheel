import React, { useState, useRef, useEffect } from 'react';
import './SpinWheelGame.css';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD93D', '#6C5CE7',
  '#A8E6CF', '#FF8B94', '#FFAAA5', '#D4A5A5', '#9B59B6',
  '#3498DB', '#E67E22', '#2ECC71', '#F1C40F', '#E74C3C'
];

const DEFAULT_PRIZES = [
  { id: 1, label: 'Yes', color: '#FF6B6B', weight: 1 },
  { id: 2, label: 'No', color: '#4ECDC4', weight: 1 },
  { id: 3, label: 'Maybe', color: '#45B7D1', weight: 1 },
  { id: 4, label: 'Spin Again', color: '#FFD93D', weight: 1 },
];

const SPIN_DURATION_MS = 4000; // 4 seconds

export default function SpinWheelGame() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [prizes, setPrizes] = useState(() => {
    try {
      const saved = localStorage.getItem('spinPrizes');
      return saved ? JSON.parse(saved) : DEFAULT_PRIZES;
    } catch {
      return DEFAULT_PRIZES;
    }
  });
  const [newPrizeLabel, setNewPrizeLabel] = useState('');

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('spinHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Calculate weighted random selection
  // Calculate weighted random selection
  const selectPrize = () => {
    if (prizes.length === 0) return null;
    const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
    let randomValue = Math.random() * totalWeight;

    for (const prize of prizes) {
      if (randomValue < prize.weight) {
        return prize;
      }
      randomValue -= prize.weight;
    }
    return prizes[prizes.length - 1]; // Fallback
  };

  useEffect(() => {
    localStorage.setItem('spinPrizes', JSON.stringify(prizes));
  }, [prizes]);

  const spin = () => {
    if (isSpinning) return;

    const newPrize = selectPrize();
    if (!newPrize) return;

    // Calculate rotation
    const sliceAngle = 360 / prizes.length;
    const prizeIndex = prizes.findIndex(p => p.id === newPrize.id);

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

  const addPrize = (e) => {
    e.preventDefault();
    if (!newPrizeLabel.trim()) return;

    const newPrize = {
      id: Date.now(),
      label: newPrizeLabel.trim(),
      color: COLORS[prizes.length % COLORS.length],
      weight: 1
    };

    setPrizes([...prizes, newPrize]);
    setNewPrizeLabel('');
  };

  const removePrize = (id) => {
    if (isSpinning) return;
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const clearPrizes = () => {
    if (isSpinning) return;
    setPrizes([]);
  };

  return (
    <div className="game-container">
      <div className="wheel-container-main">
        {/* The Stand */}
        <div className="wheel-stand"></div>
        <div className="wheel-legs"></div>

        <div className="wheel-wrapper">
          <div className="pointer"></div>

          {/* The Outer Rim */}
          <div className="wheel-rim">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="rim-bulb"
                style={{ transform: `rotate(${i * 30}deg)` }}
              ></div>
            ))}
          </div>

          <div
            className="wheel"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)` : 'none'
            }}
          >
            {/* Center Knob - placed inside but absolutely positioned to be static relative to wheel or spinning with it? 
                    Actually center knob usually doesn't spin or spins with it. Let's make it decoration on top.
                    Wait, if it's inside .wheel it spins. If outside it doesn't. 
                    Real wheels have a static center often, or spinning. Let's put it outside .wheel 
                    but inside wrapper to be static, or inside to spin. 
                    Let's update the structure: Center knob should be on top of the wheel.
                */}

            {prizes.length === 0 ? (
              <div className="empty-wheel-message">Add items</div>
            ) : prizes.map((prize, index) => {
              const rotation = index * (360 / prizes.length);
              const skewY = 90 - (360 / prizes.length);
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
                      transform: `skewY(${skewY}deg) rotate(${360 / prizes.length / 2}deg)`
                    }}
                  >
                    {prize.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Cap/Knob */}
          <div className="center-knob">
            <div className="center-knob-inner"></div>
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="spin-btn" onClick={spin} disabled={isSpinning || prizes.length < 2}>
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

      <div className="configuration-area">
        <h3>Edit Wheel Items</h3>
        <form onSubmit={addPrize} className="add-prize-form">
          <input
            type="text"
            value={newPrizeLabel}
            onChange={(e) => setNewPrizeLabel(e.target.value)}
            placeholder="Enter name..."
            disabled={isSpinning}
          />
          <button type="submit" disabled={isSpinning || !newPrizeLabel.trim()}>Add</button>
        </form>

        <div className="prize-list-header">
          <span>Items: {prizes.length}</span>
          {prizes.length > 0 && (
            <button onClick={clearPrizes} className="text-danger small-btn" disabled={isSpinning}>Clear All</button>
          )}
        </div>

        <ul className="prize-list">
          {prizes.map((p) => (
            <li key={p.id}>
              <span className="color-dot" style={{ background: p.color }}></span>
              <span className="prize-name">{p.label}</span>
              <button
                onClick={() => removePrize(p.id)}
                className="remove-btn"
                disabled={isSpinning}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
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
