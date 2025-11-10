# 🏓 Ping Pong Game

A modern, feature-rich browser-based ping pong game built with HTML5 Canvas and vanilla JavaScript. Experience classic arcade gameplay enhanced with particle effects, procedural audio, and intelligent AI opponents.

![Game Preview](https://img.shields.io/badge/Status-Complete-success)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎮 Game Preview

![Ping Pong Game Screenshot](Preview%20PingPong.png)

*Live gameplay showing particle effects, ball trail, and real-time statistics*

## ✨ Features

### 🎮 Game Modes
- **Player vs Player** - Local multiplayer on the same device
- **Player vs AI** - Challenge computer opponents with three difficulty levels:
  - 🟢 **Easy** - Perfect for beginners
  - 🟡 **Medium** - Balanced challenge
  - 🔴 **Hard** - Competitive AI gameplay

### 🎨 Visual Effects
- **Particle System** - Dynamic explosions on scoring and paddle collisions
- **Ball Trail Effect** - Smooth motion blur trail following the ball
- **Hit Animations** - Paddle flash effects on impact
- **Glowing Ball** - Radial gradient with pulsing effect
- **Color-Coded Players** - Distinct colors for each player (Orange vs Cyan)

### 🔊 Audio System
- Procedurally generated sound effects using Web Audio API
- Distinct audio feedback for:
  - Paddle hits
  - Wall bounces
  - Scoring points
  - Victory fanfare

### 📱 Cross-Platform Controls
- **Keyboard Controls** (Customizable!)
  - Player 1: `W` / `S` keys (default) or Arrow keys
  - Player 2: `↑` / `↓` arrow keys (default) or `W` / `S` keys
  - `SPACE` - Start/Pause game
  - `ESC` - Return to main menu
- **Multi-Touch Controls** - Full mobile support with simultaneous control
  - Tap anywhere on screen to start game
  - Drag on left side to control Player 1 paddle
  - Drag on right side to control Player 2 paddle
  - Both players can control paddles simultaneously with different fingers
  - Mobile menu button (📱) for easy navigation
- **Settings Menu** - Change control schemes for each player from the main menu
- **Responsive Design** - Optimized for portrait and landscape orientations
  - Landscape mode provides fullscreen gameplay experience
  - No white borders or wasted space

### 📊 Statistics Tracking
- Real-time rally counter during gameplay
- Longest rally tracking
- Total hits counter
- Post-game statistics summary

### ⚙️ Game Mechanics
- **Progressive Difficulty** - Ball gradually accelerates over time
- **Physics-Based Collisions** - Realistic paddle impact with angle variation
- **Best of 9 Format** - First to 5 points wins
- **Smooth Pause System** - Freeze gameplay without losing progress

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/parpy69/PingPongGame.git
```

2. Navigate to the project directory:
```bash
cd PingPongGame
```

3. Open `index.html` in your web browser:
```bash
open index.html
```

Or simply double-click the `index.html` file.

### Live Demo

[Play the game here](https://pingponggame-gray.vercel.app/)

## 🎮 How to Play

1. **Select Game Mode** - Choose between Player vs Player or Player vs AI
2. **(Optional) Customize Controls** - Click "⚙️ Controls Settings" to change key bindings
3. **Choose Difficulty** (AI mode only) - Pick Easy, Medium, or Hard
4. **Press SPACE** to start the game
5. **Control Your Paddle**:
   - **Desktop:** Use `W` (up) and `S` (down) by default for Player 1
   - **Desktop:** Use `↑` (up) and `↓` (down) by default for Player 2
   - **Mobile/Tablet:** Tap screen to start, then drag on your side to control
   - **Multi-player on Mobile:** Both players can control their paddles simultaneously
   - Or customize in settings to swap controls!
6. **Score Points** - Make your opponent miss the ball
7. **First to 5 Wins!**

### Controls Reference

| Action | Key/Input | Customizable? |
|--------|-----------|---------------|
| Move Up (P1) | `W` (default) or `↑` | ✅ Yes |
| Move Down (P1) | `S` (default) or `↓` | ✅ Yes |
| Move Up (P2) | `↑` (default) or `W` | ✅ Yes |
| Move Down (P2) | `↓` (default) or `S` | ✅ Yes |
| Start/Pause | `SPACE` or Touch screen | ❌ No |
| Main Menu | `ESC` or 📱 Menu button | ❌ No |
| Touch Control (P1) | Drag on left side | ❌ No |
| Touch Control (P2) | Drag on right side | ❌ No |
| Multi-Touch | Both players simultaneously | ✅ Supported |
| Open Settings | Main menu button | - |

## 🛠️ Technologies Used

- **HTML5 Canvas API** - 2D graphics rendering
- **JavaScript (ES6+)** - Game logic and mechanics
- **Web Audio API** - Procedural sound generation
- **CSS3** - UI styling and animations
- **Vanilla JavaScript** - No frameworks or libraries

## 🎯 Technical Highlights

### Customizable Controls System
Players can choose their preferred control scheme:
- Independent control settings for each player
- Swap between WASD and Arrow keys
- Settings persist during gameplay session
- Dynamic control text updates based on configuration

### Multi-Touch Support
Advanced touch handling for mobile devices:
- `Map()` data structure tracks multiple touch points simultaneously
- Each touch assigned unique identifier for precise tracking
- Coordinate scaling accounts for canvas/viewport differences
- Touch detection determines left/right paddle assignment
- Smooth simultaneous control for two players on one device

### AI Implementation
The AI opponent uses a dynamic tracking algorithm with configurable parameters:
- **Speed Multiplier** - Controls paddle movement speed
- **Reaction Delay** - Simulates human-like response time
- **Error Margin** - Adds imperfection to positioning

### Particle System
Custom particle engine featuring:
- Physics-based motion with gravity
- Alpha fade-out over lifetime
- Color-coded explosions per event type
- Efficient particle pooling

### Audio Generation
Real-time audio synthesis without external files:
- Oscillator-based tone generation
- Dynamic frequency and duration
- Multiple waveform types (sine, square, triangle)
- Envelope control for natural sound decay

## 📁 Project Structure

```
pingpong-game/
├── index.html          # Main HTML file with embedded CSS
├── game.js             # Game logic, physics, and rendering
└── README.md           # Project documentation
```

## 🎨 Customization

You can easily customize the game by modifying these constants in `game.js`:

```javascript
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 5;
const SPEED_INCREMENT = 0.003;
const WINNING_SCORE = 5;
```

Adjust AI difficulty settings:
```javascript
const AI_SETTINGS = {
  easy: { speed: 0.7, reactionDelay: 8, errorMargin: 25 },
  medium: { speed: 0.85, reactionDelay: 5, errorMargin: 15 },
  hard: { speed: 1.1, reactionDelay: 2, errorMargin: 5 },
};
```

## 🐛 Known Issues

- None at this time! Feel free to report any bugs in the Issues section.

## 🔮 Future Enhancements

- [x] Customizable control schemes ✅
- [x] Multi-touch mobile support ✅
- [x] Landscape mode optimization ✅
- [ ] Power-ups system (speed boost, paddle size)
- [ ] Online multiplayer support
- [ ] Leaderboard with localStorage
- [ ] Additional game modes (survival, time attack)
- [ ] Customizable themes and color schemes
- [ ] Tournament bracket system
- [ ] Saved control preferences (localStorage)

## 📝 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

## 👨‍💻 Author

**Abdullah Khudeish**
- GitHub: [@parpy69](https://github.com/parpy69)
- LinkedIn: [Abdullah Khudeish](https://www.linkedin.com/in/abdullah-khudeish-3a010923a/)
- Project Repository: [PingPongGame](https://github.com/parpy69/PingPongGame)
- Live Demo: [Play Now](https://pingponggame-gray.vercel.app)

## ⭐ Show Your Support

Give a ⭐️ if you enjoyed this project!

---

Made with ❤️ and JavaScript

