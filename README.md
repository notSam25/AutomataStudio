# AutomataStudio

# Summary
This project allows a user to build and simulate a variety of Automata. Built with a MEAN (MongoDB, Express.JS, Angular.JS, NodeJS) stack on top of Docker Compose (see the [Demo](#demo) section for easy deployment)

# Technology Breakdown
- Frontend: AngularJS 1.x, HTML, CSS, JavaScript, Cytoscape.js, vis.js
- Backend: Node.js, Express.js, MongoDB, Mongoose
- DevOps: Docker, Docker Compose
- Features: authentication, automata CRUD, public sharing, JSON export, simulation history

# Deployed URL Link


#  Youtube Video Link


# Current Feature Set
- Account registration and login
- User profile (username update)
- Automata CRUD (create, read, update, delete)
- Automata simulation with step history
- Shareable public links for automata
- JSON export for automata definitions

# Supported Automata
The following [Automata](https://en.wikipedia.org/wiki/Automata_theory) are supported by AutomataStudio:
- DFA(Deterministic Finite Automata)
- NFA(Non-Deterministic Finite Automata)/ $\epsilon\text{-NFA}$
- PDA(Push Down Automata)
- Turning Machine

# Requirements
1. A Terminal
1. A Web Browser
1. Docker(and Docker-Compose) version >= 24

# Demo
Demo'ing this project is really easy! Just run the following
``` bash
git clone https://github.com/notSam25/AutomataStudio
cd AutomataStudio/
docker compose up --build
```

Backend API runs on `http://localhost:5000` and frontend runs on `http://localhost:8080`.

# Auth Flow
- Register a new user from `#!/register`
- Login from `#!/login`
- Create/edit/delete/share automata while authenticated

# Team Roles
- Sam Wiseman (Backend and deployment)
- Bradley Thornton (Frontend)