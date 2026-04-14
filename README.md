# AutomataStudio
This project allows a user to build and simulate a variety of Automata. Built with a MEAN(MongoDB, Express.JS, Angular.JS, NodeJS) stack on top of Docker Compose(see the [Demo](#demo) section for easy deployment)

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