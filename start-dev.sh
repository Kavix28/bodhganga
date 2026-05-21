#!/usr/bin/env bash
# =============================================================
#  Bodhganga — Full-Stack Dev Launcher
#  Starts the Spring Boot backend AND the Vite frontend in
#  parallel, with coloured output and clean shutdown.
#
#  Usage:
#    ./start-dev.sh          # starts both servers
#    ./start-dev.sh --help   # prints this help
# =============================================================

set -euo pipefail

# ── Colour helpers ─────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# ── Help ───────────────────────────────────────────────────────
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo -e "${BOLD}Bodhganga Dev Launcher${RESET}"
  echo ""
  echo "  Starts Spring Boot backend (port 9090) and Vite frontend (port 5173)"
  echo "  both in the background with live-streamed, colour-coded logs."
  echo ""
  echo "  ${BOLD}Usage:${RESET} ./start-dev.sh [--help]"
  echo ""
  echo "  Press ${YELLOW}Ctrl+C${RESET} to stop both servers."
  exit 0
fi

# ── Pre-flight checks ──────────────────────────────────────────
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}${BOLD}║        Bodhganga Dev Environment             ║${RESET}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""

# Check Java
if ! command -v java &>/dev/null; then
  echo -e "${RED}✗ java not found. Please install JDK 17+ and add it to PATH.${RESET}"
  exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -1)
echo -e "${GREEN}✓ Java:${RESET} $JAVA_VERSION"

# Check Node / npm
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ node not found. Please install Node.js 18+.${RESET}"
  exit 1
fi
echo -e "${GREEN}✓ Node:${RESET} $(node --version)  npm: $(npm --version)"

# Check backend mvnw
if [[ ! -f "$BACKEND_DIR/mvnw" ]]; then
  echo -e "${RED}✗ backend/mvnw not found. Run this script from the project root.${RESET}"
  exit 1
fi

# Check frontend package.json
if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
  echo -e "${RED}✗ frontend/package.json not found.${RESET}"
  exit 1
fi

# Install frontend deps if node_modules is missing
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo -e "${YELLOW}⚙ node_modules missing — running npm ci in frontend/...${RESET}"
  (cd "$FRONTEND_DIR" && npm ci)
fi

echo ""
echo -e "${BOLD}Starting servers...${RESET}"
echo -e "  ${CYAN}Backend${RESET}  → http://localhost:9090"
echo -e "  ${GREEN}Frontend${RESET} → http://localhost:5173"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${RESET} to stop both."
echo "────────────────────────────────────────────────"

# ── Log files ──────────────────────────────────────────────────
LOG_DIR="$SCRIPT_DIR/.dev-logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
> "$BACKEND_LOG"
> "$FRONTEND_LOG"

# ── Start backend ──────────────────────────────────────────────
(
  cd "$BACKEND_DIR"
  # Use mvnw on Linux/Mac, mvnw.cmd on Windows (Git Bash handles mvnw fine)
  MVNW="./mvnw"
  [[ ! -x "$MVNW" ]] && chmod +x "$MVNW"
  "$MVNW" spring-boot:run -Dspring-boot.run.profiles=dev 2>&1 \
    | while IFS= read -r line; do
        echo -e "${CYAN}[BACKEND]${RESET} $line" | tee -a "$BACKEND_LOG"
      done
) &
BACKEND_PID=$!

# ── Start frontend ─────────────────────────────────────────────
(
  cd "$FRONTEND_DIR"
  npm run dev 2>&1 \
    | while IFS= read -r line; do
        echo -e "${GREEN}[FRONTEND]${RESET} $line" | tee -a "$FRONTEND_LOG"
      done
) &
FRONTEND_PID=$!

# ── Graceful shutdown on Ctrl+C ────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${RESET}"
  kill "$BACKEND_PID"  2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID"  2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo -e "${RED}✓ Both servers stopped.${RESET}"
  echo -e "  Logs saved to ${LOG_DIR}/"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait "$BACKEND_PID" "$FRONTEND_PID"
