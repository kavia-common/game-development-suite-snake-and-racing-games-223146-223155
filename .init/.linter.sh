#!/bin/bash
cd /home/kavia/workspace/code-generation/game-development-suite-snake-and-racing-games-223146-223155/frontend_games_ui
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

