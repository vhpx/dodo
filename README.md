# The Interrogation Room

A voice-first escape game where players have 90 seconds to talk their way out of absurd developer disaster scenarios (like accidentally pushing secrets to GitHub or deleting production databases). An AI host with a toxic, roast-heavy personality evaluates responses in real-time, awarding time bonuses for clever thinking while mocking failures. The game features a minimal UI with countdown timer, performance meter, and the ability to buy extra time with coins earned from successful escapes.

## Features

- **Voice-First Gameplay**: Powered by Google's Gemini Live API for real-time voice interaction
- **90-Second Countdown**: Time is your score - remaining seconds become bonus coins
- **Toxic AI Host**: An arrogant, unhinged AI that roasts your every move
- **Dev Disaster Scenarios**: Hilarious, relatable situations like pushing `.env` to prod or `rm -rf` on production
- **Performance Meter**: Real-time feedback on how well (or poorly) you're doing
- **Buy More Time**: Spend coins to extend your escape attempt
- **Campaigns & Quick Play**: Story-driven campaigns or random scenarios
- **Achievement System**: Unlock achievements and earn rewards

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI**: Google Gemini Live API (Native Audio)
- **State Management**: Zustand
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Language**: TypeScript

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run the development server:
   ```bash
   bun dev
   ```
4. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
5. Enter your API key when prompted in the app

## Team Dodo

| Name | Email |
|------|-------|
| Vo Hoang Phuc | phucvo@tuturuuu.com |
| Vo Minh Khoi | khoivo@tuturuuu.com |
| Nguyen Gia Khang | khangnguyen@tuturuuu.com |
| Doan Huu Quoc | huuquoc7603@gmail.com |

## License

MIT
