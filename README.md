# Tic-Tac-Toe (Ultimate Edition)

A modern, responsive, and feature-rich Tic-Tac-Toe web application built with vanilla JavaScript, modern CSS glassmorphism, and HTML5.

## 🚀 Features

- **🎮 Multiple Game Modes**:
  - **Player vs AI (Unbeatable)**: Built with the **Minimax** algorithm and alpha-beta pruning — practically impossible to defeat!
  - **Player vs AI (Medium)**: Smart defensive and offensive moves with occasional human-like variability.
  - **Player vs AI (Easy)**: Casual randomized moves.
  - **2 Players (Local)**: Classic pass-and-play on the same device.
- **✨ Visuals & Animations**:
  - Dark glassmorphism interface with ambient glowing backdrop blobs.
  - Interactive hover ghost indicators showing move previews.
  - Dynamic SVG strike-through line marking the exact winning trio.
  - Victory celebration with HTML5 Canvas confetti bursts.
  - Pulsing victory highlights on winning cells.
- **🎵 Sound Effects (Web Audio API)**:
  - Zero external media dependencies — synthesized audio tones for clicks, victory fanfares, draws, and resets.
  - One-click mute/unmute toggle.
- **📊 Persistent Scoreboard**:
  - Tracks Player X wins, Player O/AI wins, and Ties.
  - Automatically saved to `localStorage`.
  - Easy "Reset Scores" button.

## 🕹️ How to Run

Simply open `index.html` in any modern web browser:

```bash
# On macOS:
open index.html

# Or start a local server:
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

