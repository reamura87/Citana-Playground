

<h1 align="center", style="letter-spacing: 4px; font-family: 'Inter; margin: 10px;'">
  CITANA PLAYGROUND
</h1>

<p align="center">
  <a href="https://citana-playground.vercel.app/">
    <img src="https://img.shields.io/badge/✦_EXPLORE_PLAYGROUND-Visit%20Website-8B7CF6?style=for-the-badge" alt="Explore Citana Playground" />
  </a>
  <a href="https://github.com/reamura87/Citana-Playground">
    <img src="https://img.shields.io/badge/SOURCE-Open%20on%20GitHub-242424?style=for-the-badge&logo=github" alt="Source code on GitHub" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Deployment-Vercel-FFFFFF?style=flat-square&logo=vercel&logoColor=black" alt="Vercel" />
</p>

---

> *Somewhere between a random thought and a finished creation, there is a playground.*

**Citana Playground** is a personal digital garden for experimenting, building, and collecting ideas. It is a space where code meets creativity, small experiments become projects, and curiosity has room to grow.

Rather than being just another portfolio, Citana is an evolving collection of digital tools, creative experiments, and things worth exploring.

## ◈ The Philosophy

A playground should never feel finished.

It should be a place to try something unusual, make mistakes, discover new possibilities, and turn a random idea into something real.

Citana is built around three simple principles:

- **Explore** — follow curiosity and experiment with new ideas.
- **Create** — turn thoughts into interactive digital experiences.
- **Collect** — keep useful creations and interesting discoveries in one place.

## ✧ Explore the Playground

<p align="center">
  <img src="public\game.png" width="100%" alt="game.png" />
  <img src="public\alat.png" width="100%" alt="alat.png" />
  <img src="public\satua.png" width="100%" alt="satua.png" />
  <img src="public\karyaseni.png" width="100%" alt="karyaseni.png" />
</p>

<p align="center"><i>A glimpse into a growing collection of digital experiments.</i></p>

| Space | Description |
|---|---|
| ✎ Creative Writing | A rich-text editing experience for writing and shaping ideas. |
| ◈ Image Experiments | Explore image workflows, including browser-based background removal. |
| ▧ Document Lab | Experiment with document processing and PDF-to-Word workflows. |
| ✦ Interactive Experiments | A space for exploring interactive experiences and game-like ideas. |
| ⌘ Developer Playground | A growing collection of web experiments and personal projects. |

*The spaces above describe the project's intended creative direction and capabilities represented by its current dependencies; availability and completeness may vary as development continues.*

## ⌘ Built With

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,vite,js,supabase,vercel,git,github&theme=dark" alt="Technologies used in Citana Playground" />
</p>

| Technology | Role |
|---|---|
| React | Component-based user interface |
| Vite | Development server and build tooling |
| React Router | Client-side navigation |
| Supabase | Backend services and database integration |
| Tiptap | Rich-text editor foundation |
| Phaser | Interactive game development |
| ONNX Runtime Web | Browser-based machine learning inference |
| PDF.js & DOCX | Document rendering and Word document workflows |
| Vercel | Website deployment |

## ◉ How It Works

```mermaid
flowchart TD
    A["✦ Citana Playground"] --> B["Creative Interface"]
    A --> C["Interactive Experiences"]
    A --> D["Document & Image Tools"]

    B --> E["React + Tiptap"]
    C --> F["Phaser"]
    D --> G["PDF.js + DOCX"]
    D --> H["ONNX Runtime Web"]

    A --> I["Data & Backend"]
    I --> J["Supabase"]

    E --> K["Vite Build"]
    F --> K
    G --> K
    H --> K
    J -. "Backend integration" .-> K

    K --> L["Vercel Deployment"]

    style A fill:#252039,stroke:#a78bfa,color:#ffffff
    style L fill:#252039,stroke:#a78bfa,color:#ffffff
```

The frontend is built with React and Vite. Specialized libraries support editing, document handling, image processing, and interactive experiences. Supabase provides the foundation for backend integration, while Vercel hosts the deployed website.

## ⌘ Run Locally

Want to explore the project or experiment with the source code?

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/reamura87/Citana-Playground.git

# Enter the project directory
cd Citana-Playground

# Install dependencies
npm install

# Start the development server
npm run dev
```

Vite will display a local URL in your terminal, usually `http://localhost:5173`.

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production application |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

### Environment Variables

If a feature requires Supabase or another external service, configure its environment variables using the project's expected names.

Create a local `.env` file and use `.env.example` as a reference if it documents the required variables.

**Never commit real API keys, passwords, access tokens, or private credentials.** Only expose public client-side credentials intended for browser use. Enforce authorization and data access policies on the backend.

## ◈ Project Structure

```text
Citana-Playground/
├── public/             # Static assets
├── src/                # Application source code
├── .github/            # GitHub workflows
├── .env.example        # Environment template, if applicable
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

This is a high-level overview of the repository. Additional components, routes, and modules may exist within `src/`.

## ✧ Roadmap

The playground is an evolving project. Potential directions include:

- [ ] Refine the creative digital garden aesthetic.
- [ ] Expand the collection of browser-based creative tools.
- [ ] Improve the image and document processing experience.
- [ ] Develop more interactive experiments and small games.
- [ ] Improve accessibility, responsiveness, and performance.
- [ ] Document individual experiments and their implementation.
- [ ] Add screenshots and demonstrations for each major feature.

## ◈ Contributing

Ideas, feedback, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run the build and lint checks.
5. Open a pull request describing your contribution.

For larger changes, consider opening an issue first to discuss the idea.

## ✦ A Little More About This Project

Citana Playground is an independent creative project built through curiosity, experimentation, and continuous learning.

It is not just about what can be built today. It is about leaving room for what might be built tomorrow.

If you find something interesting here, explore the source, share your feedback, or follow along as the playground grows.

<p align="center">
  <a href="https://citana-playground.vercel.app/">
    <img src="https://img.shields.io/badge/ENTER_THE_PLAYGROUND-8B7CF6?style=for-the-badge&logo=vercel&logoColor=white" alt="Enter the Playground" />
  </a>
</p>

<p align="center">
  <sub>Made with curiosity, a little chaos, and a lot of code.</sub>
</p>
