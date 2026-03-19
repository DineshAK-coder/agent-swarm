# Swarm Explorer (Agentic Canvas)

Swarm Explorer is a highly interactive, node-based web application that allows users to create, configure, and orchestrate a "swarm" of AI agents. Using a visual canvas interface powered by React Flow, users can drop specialized AI personas onto a workspace and watch them collaborate, debate, or assist with complex tasks in real-time.

## 🚀 Features

- **Visual Agent Canvas:** Built on `@xyflow/react`, visualize your AI agents as draggable, connectable nodes on a beautiful dotted canvas.
- **Deep Personalization:** Every agent can have a distinct **Name**, **Role** (e.g., Designer, Researcher), **Personality** (e.g., Optimistic, Sarcastic), and **Vocal Tone**.
- **Agentic Council (Global Mode):** Agents actively listen to user prompts and respond sequentially, incorporating standard chat history and engaging with each other's points.
- **Isolated Threads:** Toggle "Isolate Threads" if you only want the agents to communicate directly with you without cross-talking or debating each other.
- **Voice Interactivity (TTS & STT):** 
  - **Speech-To-Text:** Speak directly into the microphone to prompt the swarm.
  - **Text-To-Speech:** Hear your agents respond using state-of-the-art TTS voices provided by Murf AI.
- **Live Visual Feedback:** Nodes dynamically animate (pulsing rings, bouncing, subtitle overlays) when thinking or talking to provide intuitive visual feedback on the state of the system.

## 🛠️ Technology Stack

- **Frontend Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + Framer Motion (Animations)
- **Node Environment / Canvas:** React Flow (`@xyflow/react`)
- **Icons:** Lucide React
- **LLM Provider:** [Groq](https://groq.com/) (using `llama-3.1-8b-instant` for ultra-fast, real-time responses)
- **Voice Generation:** [Murf AI](https://murf.ai/) API
- **Deployment & Serverless:** Vercel (Frontend + Serverless Functions)

## 📦 Getting Started (Local Development)

### 1. Prerequisites
- Node.js (v18+ recommended)
- API keys from **Groq** and **Murf AI**.

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd agentic-canvas
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` (or create a new `.env` file) in the root directory and add your API credentials:

```env
GROQ_API_KEY=your_groq_api_key_here
MURF_API_KEY=your_murf_api_key_here
```

### 4. Run the Development Server
Since the project relies on server-side API endpoints (`/api/chat` and `/api/tts`), start the custom development server which runs both Express backend routes and the Vite frontend:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser to interact with the Swarm Explorer.

## ☁️ Deployment (Vercel)

The project is fully structured for zero-config deployment on Vercel. 

1. **Connect Repository:** Import your Git repository into Vercel.
2. **Environment Variables:** During setup, navigate to the Environment Variables section and add your `GROQ_API_KEY` and `MURF_API_KEY`. *(Never commit your `.env` file to the repository!)*
3. **Deploy:** Click Deploy. Vercel will automatically run `npm run build` to compile the Vite frontend into static files, and compile the `api/chat.ts` and `api/tts.ts` files into scalable **Serverless Functions**.

## 🧠 Usage Guide

1. **Add an Agent:** Click the pulsing `+` button on the bottom right to recruit a new agent. Define their persona (e.g., "Lead Architect", "Paranoid", "Formal").
2. **Toggle Modes:** Click the microphone icon `Mic` on an agent's node to stop them from participating in the current global conversation, or click the `Volume` icon to mute their TTS voice playback.
3. **Prompt the Swarm:** Type into the bottom chat bar (or use your microphone) and press enter. Every active listening agent will queue up to analyze and respond to your input in sequence.
4. **Interject:** If the agents are going off track, type a follow-up and click the orange "Interject" button (`Send` icon) to halt current generation and redirect the swarm instantly.
