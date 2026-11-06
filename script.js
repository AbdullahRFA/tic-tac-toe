// Tic-Tac-Toe Game Engine (Ultimate Edition)
(function() {
  'use strict';

  // Game Constants
  const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const SYMBOL_SETS = {
    classic: { X: '✕', O: '◯' },
    elements: { X: '⚡', O: '🔥' },
    animals: { X: '🐱', O: '🐶' },
    royal: { X: '👑', O: '💎' }
  };

  const THEMES = ['cyber', 'matrix', 'sunset', 'light'];
  const STORAGE_KEY = 'tictactoe_scores_v2';

  // State
  let boardState = Array(9).fill('');
  let moveHistory = []; // stores indices
  let currentPlayer = 'X';
  let isGameActive = true;
  let gameMode = 'ai-unbeatable';
  let symbolStyle = 'classic';
  let currentThemeIdx = 0;
  let isAiThinking = false;
  let soundEnabled = true;

  let scores = {
    X: 0,
    O: 0,
    ties: 0,
    total: 0
  };

  // DOM Elements
  const cells = document.querySelectorAll('.cell');
  const boardEl = document.getElementById('board');
  const statusText = document.getElementById('statusText');
  const turnDot = document.querySelector('.turn-dot');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const scoreTiesEl = document.getElementById('scoreTies');
  const winRateX = document.getElementById('winRateX');
  const winRateO = document.getElementById('winRateO');
  const totalMatches = document.getElementById('totalMatches');
  const namePlayerO = document.getElementById('namePlayerO');
  const tagSymbolX = document.getElementById('tagSymbolX');
  const tagSymbolO = document.getElementById('tagSymbolO');
  const scoreCardX = document.getElementById('scoreCardX');
  const scoreCardO = document.getElementById('scoreCardO');
  const gameModeSelect = document.getElementById('gameMode');
  const symbolSetSelect = document.getElementById('symbolSet');
  const restartBtn = document.getElementById('restartBtn');
  const resetScoreBtn = document.getElementById('resetScoreBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const hintBtn = document.getElementById('hintBtn');
  const undoBtn = document.getElementById('undoBtn');
  const soundOnIcon = document.querySelector('.sound-on-icon');
  const soundOffIcon = document.querySelector('.sound-off-icon');
  const strikeSvg = document.getElementById('strikeLineSvg');
  const strikeLine = document.getElementById('strikeLine');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const confettiCtx = confettiCanvas.getContext('2d');

  // Web Audio Context for synthesized sound effects
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration = 0.1, type = 'sine', delay = 0) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const startTime = audioCtx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {}
  }

  function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    switch (type) {
      case 'click':
        playTone(currentPlayer === 'X' ? 440 : 554, 0.08, 'triangle');
        break;
      case 'hint':
        playTone(880, 0.12, 'sine');
        break;
      case 'undo':
        playTone(330, 0.08, 'sine');
        break;
      case 'win':
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          playTone(freq, 0.16, 'sine', idx * 0.08);
        });
        break;
      case 'draw':
        playTone(330, 0.15, 'sawtooth');
        playTone(293, 0.25, 'sawtooth', 0.12);
        break;
      case 'reset':
        playTone(587, 0.06, 'sine');
        playTone(440, 0.08, 'sine', 0.05);
        break;
    }
  }

  // Load / Save Scores
  function loadScores() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        scores = JSON.parse(saved);
        updateScoreDisplay();
      }
    } catch (e) {}
  }

  function saveScores() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch (e) {}
  }

  function updateScoreDisplay() {
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreTiesEl.textContent = scores.ties;
    const total = scores.total || (scores.X + scores.O + scores.ties) || 0;
    totalMatches.textContent = `${total} Matches`;

    const rateX = total > 0 ? Math.round((scores.X / total) * 100) : 0;
    const rateO = total > 0 ? Math.round((scores.O / total) * 100) : 0;
    winRateX.textContent = `${rateX}% Win`;
    winRateO.textContent = `${rateO}% Win`;
  }

  function getPlayerSymbol(player) {
    return SYMBOL_SETS[symbolStyle][player] || player;
  }

  // Update Turn & Hover Styles
  function updateTurnUI() {
    scoreCardX.classList.toggle('active-turn', isGameActive && currentPlayer === 'X');
    scoreCardO.classList.toggle('active-turn', isGameActive && currentPlayer === 'O');

    if (turnDot) {
      const activeColor = currentPlayer === 'X' ? 'var(--color-x)' : 'var(--color-o)';
      turnDot.style.backgroundColor = activeColor;
      turnDot.style.boxShadow = `0 0 8px ${activeColor}`;
    }

    if (isGameActive) {
      const sym = getPlayerSymbol(currentPlayer);
      if (isAiMode()) {
        statusText.textContent = currentPlayer === 'X' ? `Your Turn (${sym})` : 'AI is thinking...';
      } else {
        statusText.textContent = `Player ${sym}'s Turn`;
      }
    }

    undoBtn.disabled = moveHistory.length === 0 || !isGameActive || isAiThinking;
    hintBtn.disabled = !isGameActive || isAiThinking || (isAiMode() && currentPlayer !== 'X');
  }

  function isAiMode() {
    return gameMode.startsWith('ai-');
  }

  // Cell Click Handling
  function handleCellClick(e) {
    initAudio();
    clearHints();
    const cell = e.currentTarget;
    const index = parseInt(cell.getAttribute('data-index'), 10);

    if (boardState[index] !== '' || !isGameActive || isAiThinking) {
      return;
    }

    makeMove(index, currentPlayer);

    if (isGameActive && isAiMode() && currentPlayer === 'O') {
      isAiThinking = true;
      boardEl.style.pointerEvents = 'none';
      undoBtn.disabled = true;
      hintBtn.disabled = true;

      const delay = Math.floor(Math.random() * 220) + 260;
      setTimeout(() => {
        aiTurn();
        isAiThinking = false;
        boardEl.style.pointerEvents = 'auto';
        updateTurnUI();
      }, delay);
    }
  }

  function makeMove(index, player) {
    boardState[index] = player;
    moveHistory.push(index);
    const cell = cells[index];
    cell.textContent = getPlayerSymbol(player);
    cell.classList.add(player.toLowerCase(), 'taken');

    playSound('click');

    const winInfo = checkWin(boardState, player);

    if (winInfo) {
      handleGameOver('win', player, winInfo);
    } else if (isBoardFull(boardState)) {
      handleGameOver('draw');
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateTurnUI();
    }
  }

  function checkWin(board, player) {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] === player && board[b] === player && board[c] === player) {
        return { combo, player };
      }
    }
    return null;
  }

  function isBoardFull(board) {
    return board.every(cell => cell !== '');
  }

  // Game Over Handling
  function handleGameOver(result, winner = null, winInfo = null) {
    isGameActive = false;
    scores.total = (scores.total || 0) + 1;

    if (result === 'win') {
      scores[winner]++;
      saveScores();
      updateScoreDisplay();

      winInfo.combo.forEach(idx => cells[idx].classList.add('winner'));
      drawStrikeLine(winInfo.combo, winner);

      const sym = getPlayerSymbol(winner);
      if (isAiMode()) {
        statusText.textContent = winner === 'X' ? `🎉 You Win! (${sym})` : `🤖 AI Wins! (${sym})`;
      } else {
        statusText.textContent = `🎉 Player ${sym} Wins!`;
      }

      playSound('win');
      triggerConfetti();
    } else {
      scores.ties++;
      saveScores();
      updateScoreDisplay();
      statusText.textContent = "🤝 It's a Draw!";
      playSound('draw');
    }

    scoreCardX.classList.remove('active-turn');
    scoreCardO.classList.remove('active-turn');
    undoBtn.disabled = true;
    hintBtn.disabled = true;
  }

  // SVG Strike Line Drawing
  function drawStrikeLine(combo, winner) {
    const boardRect = boardEl.getBoundingClientRect();
    const cellA = cells[combo[0]].getBoundingClientRect();
    const cellC = cells[combo[2]].getBoundingClientRect();

    const x1 = cellA.left + cellA.width / 2 - boardRect.left;
    const y1 = cellA.top + cellA.height / 2 - boardRect.top;
    const x2 = cellC.left + cellC.width / 2 - boardRect.left;
    const y2 = cellC.top + cellC.height / 2 - boardRect.top;

    strikeLine.setAttribute('x1', x1);
    strikeLine.setAttribute('y1', y1);
    strikeLine.setAttribute('x2', x2);
    strikeLine.setAttribute('y2', y2);

    strikeLine.className.baseVal = winner === 'X' ? 'strike-x' : 'strike-o';
    strikeSvg.classList.add('visible');
  }

  function clearStrikeLine() {
    strikeSvg.classList.remove('visible');
  }

  // AI Moves
  function aiTurn() {
    if (!isGameActive) return;

    let moveIndex;
    switch (gameMode) {
      case 'ai-easy':
        moveIndex = getEasyMove();
        break;
      case 'ai-medium':
        moveIndex = getMediumMove();
        break;
      case 'ai-unbeatable':
      default:
        moveIndex = getUnbeatableMove();
        break;
    }

    if (moveIndex !== undefined && moveIndex !== -1) {
      makeMove(moveIndex, 'O');
    }
  }

  function getEasyMove() {
    const available = getAvailableIndices(boardState);
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
  }

  function getMediumMove() {
    const available = getAvailableIndices(boardState);
    for (const idx of available) {
      const copy = [...boardState];
      copy[idx] = 'O';
      if (checkWin(copy, 'O')) return idx;
    }
    for (const idx of available) {
      const copy = [...boardState];
      copy[idx] = 'X';
      if (checkWin(copy, 'X')) return idx;
    }
    if (Math.random() < 0.5) return getUnbeatableMove();
    return getEasyMove();
  }

  function getUnbeatableMove() {
    const available = getAvailableIndices(boardState);
    if (available.length === 9) return 4;
    if (available.length === 8) {
      return boardState[4] === '' ? 4 : [0, 2, 6, 8][Math.floor(Math.random() * 4)];
    }

    let bestScore = -Infinity;
    let bestMove = available[0];

    for (const idx of available) {
      boardState[idx] = 'O';
      const score = minimax(boardState, 0, false, -Infinity, Infinity);
      boardState[idx] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }
    return bestMove;
  }

  function minimax(board, depth, isMaximizing, alpha, beta) {
    if (checkWin(board, 'O')) return 10 - depth;
    if (checkWin(board, 'X')) return depth - 10;
    if (isBoardFull(board)) return 0;

    const available = getAvailableIndices(board);

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const idx of available) {
        board[idx] = 'O';
        const score = minimax(board, depth + 1, false, alpha, beta);
        board[idx] = '';
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const idx of available) {
        board[idx] = 'X';
        const score = minimax(board, depth + 1, true, alpha, beta);
        board[idx] = '';
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  function getAvailableIndices(board) {
    const indices = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') indices.push(i);
    }
    return indices;
  }

  // Hint Logic
  function handleHint() {
    if (!isGameActive || isAiThinking) return;
    clearHints();
    initAudio();

    const available = getAvailableIndices(boardState);
    if (available.length === 0) return;

    let bestScore = -Infinity;
    let bestMove = available[0];

    for (const idx of available) {
      boardState[idx] = 'X';
      // Maximizing for X
      const score = -minimax(boardState, 0, true, -Infinity, Infinity);
      boardState[idx] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }

    const targetCell = cells[bestMove];
    targetCell.classList.add('hint');
    playSound('hint');
    statusText.textContent = `💡 Hint: Cell ${bestMove + 1} looks strong!`;

    setTimeout(() => {
      targetCell.classList.remove('hint');
    }, 2500);
  }

  function clearHints() {
    cells.forEach(c => c.classList.remove('hint'));
  }

  // Undo Move
  function handleUndo() {
    if (moveHistory.length === 0 || !isGameActive || isAiThinking) return;
    clearHints();
    clearStrikeLine();
    playSound('undo');

    if (isAiMode()) {
      // Revert AI move and Human move
      const stepsToRevert = (currentPlayer === 'X' && moveHistory.length >= 2) ? 2 : 1;
      for (let s = 0; s < stepsToRevert; s++) {
        const lastIdx = moveHistory.pop();
        if (lastIdx !== undefined) {
          boardState[lastIdx] = '';
          const cell = cells[lastIdx];
          cell.textContent = '';
          cell.className = 'cell';
        }
      }
      currentPlayer = 'X';
    } else {
      // 2-player mode: undo 1 move
      const lastIdx = moveHistory.pop();
      if (lastIdx !== undefined) {
        boardState[lastIdx] = '';
        const cell = cells[lastIdx];
        cell.textContent = '';
        cell.className = 'cell';
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      }
    }

    updateTurnUI();
  }

  // Confetti Particle System
  let particles = [];
  let confettiAnimId = null;

  function resizeCanvas() {
    const rect = boardEl.getBoundingClientRect();
    confettiCanvas.width = rect.width;
    confettiCanvas.height = rect.height;
  }

  function triggerConfetti() {
    resizeCanvas();
    particles = [];
    const colors = ['#00f2fe', '#ff007f', '#f59e0b', '#10b981', '#ffffff', '#8b5cf6'];
    const count = 70;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: confettiCanvas.width / 2,
        y: confettiCanvas.height / 2,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.8) * 12,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        gravity: 0.28,
        friction: 0.96,
        alpha: 1,
        fade: Math.random() * 0.015 + 0.01
      });
    }

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
    animateConfetti();
  }

  function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let activeParticles = 0;

    for (const p of particles) {
      if (p.alpha <= 0) continue;
      activeParticles++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.rot += p.vRot;
      p.alpha -= p.fade;

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rot * Math.PI) / 180);
      confettiCtx.globalAlpha = Math.max(0, p.alpha);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    }

    if (activeParticles > 0) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // Reset Round
  function restartGame() {
    playSound('reset');
    clearHints();
    boardState = Array(9).fill('');
    moveHistory = [];
    isGameActive = true;
    currentPlayer = 'X';
    isAiThinking = false;
    clearStrikeLine();

    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
    });

    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }

    updateTurnUI();
  }

  // Reset Scores
  function resetScores() {
    scores = { X: 0, O: 0, ties: 0, total: 0 };
    saveScores();
    updateScoreDisplay();
    restartGame();
  }

  // Handlers
  function handleModeChange() {
    gameMode = gameModeSelect.value;
    const symO = getPlayerSymbol('O');
    namePlayerO.textContent = isAiMode() ? `AI (${symO})` : `PLAYER ${symO}`;
    restartGame();
  }

  function handleSymbolChange() {
    symbolStyle = symbolSetSelect.value;
    tagSymbolX.textContent = getPlayerSymbol('X');
    tagSymbolO.textContent = getPlayerSymbol('O');
    const symO = getPlayerSymbol('O');
    namePlayerO.textContent = isAiMode() ? `AI (${symO})` : `PLAYER ${symO}`;
    
    // Refresh existing marked cells
    cells.forEach((cell, idx) => {
      if (boardState[idx] !== '') {
        cell.textContent = getPlayerSymbol(boardState[idx]);
      }
    });
    updateTurnUI();
  }

  function toggleTheme() {
    currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
    const nextTheme = THEMES[currentThemeIdx];
    document.documentElement.setAttribute('data-theme', nextTheme);
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundOnIcon.classList.toggle('hidden', !soundEnabled);
    soundOffIcon.classList.toggle('hidden', soundEnabled);
  }

  // Event Listeners
  cells.forEach(cell => cell.addEventListener('click', handleCellClick));
  restartBtn.addEventListener('click', restartGame);
  resetScoreBtn.addEventListener('click', resetScores);
  gameModeSelect.addEventListener('change', handleModeChange);
  symbolSetSelect.addEventListener('change', handleSymbolChange);
  themeToggleBtn.addEventListener('click', toggleTheme);
  soundToggleBtn.addEventListener('click', toggleSound);
  hintBtn.addEventListener('click', handleHint);
  undoBtn.addEventListener('click', handleUndo);

  window.addEventListener('resize', () => {
    resizeCanvas();
    if (!isGameActive) {
      const winX = checkWin(boardState, 'X');
      const winO = checkWin(boardState, 'O');
      if (winX) drawStrikeLine(winX.combo, 'X');
      else if (winO) drawStrikeLine(winO.combo, 'O');
    }
  });

  // Init
  loadScores();
  updateTurnUI();
})();
