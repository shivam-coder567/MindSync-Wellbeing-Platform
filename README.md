# MindSync — Basic Foundation

Clean starting point for MindSync.

Current phase: **structure only**. No UI system, database, AI, authentication, chat, or video has been added.

## Structure
```text
src/
├── components/
├── layouts/
├── pages/
│   ├── student/
│   ├── professional/
│   └── institution/
├── routes/
├── services/
├── types/
└── data/
```

## Run
```bash
npm install
npm run dev
```

Then open the local Vite URL.

Development order:
**Structure → Logic → Data → UI → Integration → Testing**
