# Math Speed Challenge

A math learning game for second-graders to practice single-digit addition (0-10 + 0-10).

## Run Locally

```bash
npm install
npm run build
```

Start a local server and open http://localhost:3000:
```bash
npx serve .
```

For development with auto-recompile:
```bash
npm run dev
```

## Run with Docker

```bash
docker build -t math-game .
docker run -p 8080:80 math-game
```

Open http://localhost:8080
