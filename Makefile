# -----------------------------------------------------------------------------
# ChatMe — 42-Style Monorepo Makefile
# -----------------------------------------------------------------------------

.DEFAULT_GOAL := all
.NOTPARALLEL:

# ANSI Terminal Formatting
BOLD    := \033[1m
RESET   := \033[0m
GREEN   := \033[32m
YELLOW  := \033[33m
BLUE    := \033[34m
CYAN    := \033[36m
RED     := \033[31m

.PHONY: all clean fclean re help env dev test test-e2e lint typecheck build check ci up down logs health migrate seed

# -----------------------------------------------------------------------------
# 42 Canonical Lifecycle Rules
# -----------------------------------------------------------------------------

all: env up migrate build
	@echo "$(BLUE)==> Ensuring monorepo dependencies are installed...$(RESET)"
	pnpm install
	@echo "$(GREEN)$(BOLD)==> Build and initialization complete! Ready for development.$(RESET)"

clean:
	@echo "$(YELLOW)==> Cleaning build outputs, compiler caches, and test reports...$(RESET)"
	rm -rf dist apps/*/dist packages/*/dist
	rm -rf .turbo apps/*/.turbo packages/*/.turbo
	rm -rf coverage test-results playwright-report apps/*/coverage apps/*/test-results apps/*/playwright-report
	docker compose stop
	@echo "$(GREEN)==> Clean finished successfully.$(RESET)"

fclean: clean
	@echo "$(RED)==> Performing full cleanup: removing node_modules and container volumes...$(RESET)"
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	docker compose down -v
	@echo "$(GREEN)==> Full clean finished successfully (.env files preserved).$(RESET)"

re: fclean all

# -----------------------------------------------------------------------------
# Development & Environment Provisioning
# -----------------------------------------------------------------------------

env:
	@echo "$(BLUE)==> Provisioning environment configurations...$(RESET)"
	./scripts/setup-env.sh

dev: env up migrate
	@echo "$(BLUE)==> Verifying initial database seed state...$(RESET)"
	@USER_COUNT=$$(docker compose exec -T postgres psql -U postgres -d chat_me -P pager=off -t -A -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0"); \
	if [ "$$USER_COUNT" = "0" ] || [ -z "$$USER_COUNT" ]; then \
		echo "$(YELLOW)==> No users found. Seeding initial demo participants and chats...$(RESET)"; \
		pnpm db:seed; \
	else \
		echo "$(GREEN)==> Database populated ($$USER_COUNT users). Preserving existing chat messages and receipts.$(RESET)"; \
	fi
	@echo "$(GREEN)$(BOLD)==> Launching full-stack development servers (web: 5173, server: 3001)...$(RESET)"
	pnpm dev

# -----------------------------------------------------------------------------
# Quality & Verification Gates
# -----------------------------------------------------------------------------

lint:
	@echo "$(BLUE)==> Running static, glossary, network, and state linters...$(RESET)"
	pnpm lint

typecheck:
	@echo "$(BLUE)==> Running TypeScript typecheck across monorepo...$(RESET)"
	pnpm typecheck

build:
	@echo "$(BLUE)==> Compiling workspace packages and production client bundle...$(RESET)"
	pnpm build

test: env up migrate
	@echo "$(BLUE)==> Executing unit and integration test suites...$(RESET)"
	pnpm test

test-e2e: env up migrate build
	@echo "$(BLUE)==> Executing headless browser E2E test suite...$(RESET)"
	pnpm --filter @chat-me/web test:e2e

check: lint typecheck test build test-e2e
	@echo "$(GREEN)$(BOLD)==> All CI/CD quality gates passed successfully!$(RESET)"

ci: check

# -----------------------------------------------------------------------------
# Backing Infrastructure & Database Operations
# -----------------------------------------------------------------------------

up:
	@echo "$(BLUE)==> Starting backing Docker infrastructure (PostgreSQL, Redis, MinIO)...$(RESET)"
	docker compose up -d --wait

down:
	@echo "$(YELLOW)==> Stopping backing Docker containers...$(RESET)"
	docker compose down

logs:
	@echo "$(BLUE)==> Streaming Docker container logs...$(RESET)"
	docker compose logs -f

migrate:
	@echo "$(BLUE)==> Applying PostgreSQL relational database migrations...$(RESET)"
	pnpm db:migrate

seed:
	@echo "$(YELLOW)==> Seeding demo users, chats, reactions, and receipts...$(RESET)"
	pnpm db:seed

health:
	@echo "$(BLUE)==> Probing service health (PostgreSQL, Redis, MinIO)...$(RESET)"
	pnpm health

# -----------------------------------------------------------------------------
# Command Summary & Help
# -----------------------------------------------------------------------------

help:
	@echo "$(BOLD)ChatMe — Monorepo Automation & Development Workflow$(RESET)"
	@echo ""
	@echo "$(BOLD)42 Canonical Lifecycle Rules:$(RESET)"
	@echo "  $(CYAN)all$(RESET)         Bootstrap env, install deps, start containers, migrate schema, compile packages (default)"
	@echo "  $(CYAN)clean$(RESET)       Remove build outputs, caches, test reports and stop containers without removing data"
	@echo "  $(CYAN)fclean$(RESET)      Execute clean, remove all node_modules, and tear down containers with persistent volumes"
	@echo "  $(CYAN)re$(RESET)          Execute fclean followed by all (complete scratch rebuild)"
	@echo ""
	@echo "$(BOLD)Development & Environment:$(RESET)"
	@echo "  $(CYAN)dev$(RESET)         Start infrastructure, apply migrations, seed if empty, and run web + server dev servers"
	@echo "  $(CYAN)env$(RESET)         Non-interactively provision .env files and generate cryptographic secrets idempotently"
	@echo ""
	@echo "$(BOLD)Quality & Verification Gates:$(RESET)"
	@echo "  $(CYAN)lint$(RESET)        Run ESLint and mechanical domain glossary, network seam, and state linters"
	@echo "  $(CYAN)typecheck$(RESET)   Execute TypeScript compiler typecheck across all workspaces without emit"
	@echo "  $(CYAN)test$(RESET)        Run unit and container-backed integration test suites (ensures infra is ready)"
	@echo "  $(CYAN)test-e2e$(RESET)    Run multi-participant headless browser Playwright E2E tests"
	@echo "  $(CYAN)build$(RESET)       Compile all workspace packages and build production web client bundle"
	@echo "  $(CYAN)check$(RESET)       Run complete CI verification pipeline (lint -> typecheck -> test -> build -> test-e2e)"
	@echo "  $(CYAN)ci$(RESET)          Alias for check"
	@echo ""
	@echo "$(BOLD)Infrastructure & Database:$(RESET)"
	@echo "  $(CYAN)up$(RESET)          Start PostgreSQL, Redis, and MinIO backing containers in detached mode"
	@echo "  $(CYAN)down$(RESET)        Stop and remove Docker containers without deleting persistent database volumes"
	@echo "  $(CYAN)logs$(RESET)        Follow combined Docker container log output"
	@echo "  $(CYAN)migrate$(RESET)     Apply pending PostgreSQL schema migrations via Drizzle"
	@echo "  $(CYAN)seed$(RESET)        Unconditionally seed PostgreSQL with demo accounts, chats, and messages"
	@echo "  $(CYAN)health$(RESET)      Probe PostgreSQL, Redis, and MinIO readiness"
	@echo "  $(CYAN)help$(RESET)        Display this help message and target descriptions"
