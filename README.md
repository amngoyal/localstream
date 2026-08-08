# LocalStream

<p align="center">
  <strong>Turn your scattered local video files into a gorgeous, premium streaming platform right in your browser.</strong>
</p>

<p align="center">
  <a href="https://localstream.vercel.app" target="_blank"><strong>👉 Try the Live Demo here</strong></a>
</p>

## Overview

LocalStream is a 100% free and open-source local video player built for developers, students, and course-bingers. It leverages the modern File System Access API to stream videos directly from your local folders into a beautifully designed, Netflix-like interface.

No accounts, no server setup, no internet required.

### ✨ Features

- **100% Local & Private**: Your files never leave your computer. Everything stays on your local machine.
- **Automatic Progress Tracking**: Never lose your spot in a 2-hour tutorial again. Your watch progress is saved instantly.
- **Portable Metadata**: Layout changes, notes, and progress can be stored right inside your course folder. Move your folder to a new computer, and everything goes with it.
- **Fully Mobile Responsive**: Designed to look incredible on any device. Watch on your desktop or easily browse your courses on your phone with touch-friendly controls.
- **Beautiful UI**: Glassmorphism, smooth animations, and a distraction-free cinematic player.

## Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/amngoyal/localstream.git
   cd localstream
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How it Works

LocalStream doesn't require any backend or database. It uses the `window.showDirectoryPicker()` API to securely read your local video folders (like `.mp4`, `.mkv`, `.webm`) and `IndexedDB` to save your library and watch history locally in your browser. 

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
