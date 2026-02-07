# Pick Me Up

A swipeable motivational message card app. Swipe through uplifting messages or submit your own to brighten someone's day. Messages are shared across all visitors via a database.

## Features

- Swipe left to see a random motivational message
- Submit your own pick-me-ups (up to 200 characters)
- Messages are shared — everyone sees what others submit
- Basic profanity filter to keep things positive
- Smooth card animations
- Works on both mobile (touch) and desktop (mouse)

## Local Setup

1. Clone the repo and install dependencies:
   ```
   git clone https://github.com/AngelCRocha/Pick-Me-Up-Web.git
   cd Pick-Me-Up-Web
   npm install
   ```

2. Create a `.env` file in the project root with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open http://localhost:3000 in your browser.

## Built With

- HTML, CSS, JavaScript (frontend)
- Node.js + Express (backend)
- Supabase (PostgreSQL database)
