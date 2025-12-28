# Guardians of the Glow

A collaborative, asymmetric mobile web game for a toddler and a parent playing on a single device.

**Design Doc**: [GEMINI.md](./GEMINI.md)

## How to Play

**Device**: Single Smartphone or Tablet (Landscape recommended).  
**Players**: 2 (Toddler + Parent).

1.  **Open the game URL** on your mobile browser.
2.  **Add to Home Screen** (optional but recommended for fullscreen).
3.  **Roles**:
    *   **Toddler (Chaos Generator)**: Tap anywhere in the dark to create Sparks (fireflies).
    *   **Parent (Order Keeper)**: Drag your finger to create a "Gravity Field". Guide the sparks into the central Lantern.
4.  **Goal**: Keep the Lantern charged!
    *   Only feed sparks that match the Lantern's color.
    *   Cyan sparks -> Cyan Lantern.
    *   Wrong color = Energy Loss.

## Development

### Prerequisites
*   Node.js & npm

### Setup
```bash
npm install
```

### Run Locally
```bash
npm run dev
```
Open the local URL on your phone (connected to same Wi-Fi) to test touch events properly.

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```
This generates static files in `dist/`.

## Deployment (GitHub Pages)

This project is configured to be deployed as a static site.
1.  Push to GitHub.
2.  Configure GitHub Pages to serve from the `dist` folder (or use the included workflow).

## License
MIT