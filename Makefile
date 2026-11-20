# AmarID make targets
.PHONY: help dev db-up db-down db-push db-seed demo test lint build

help:
	@echo "AmarID targets:"
	@echo "  dev        - start web dev server"
	@echo "  dev:api    - start API dev server"
	@echo "  db-up      - docker compose up (postgres, redis, mailpit)"
	@echo "  db-down    - docker compose down"
	@echo "  db-push    - prisma db push"
	@echo "  db-seed    - seed demo data"
	@echo "  demo       - db push + seed (guided demo mode)"
	@echo "  test       - run all workspace tests"
	@echo "  lint       - lint all workspaces"
	@echo "  build      - build all workspaces"

dev:
	npm run dev

dev:api:
	npm run dev:api

db-up:
	docker compose up -d

db-down:
	docker compose down

db-push:
	npm run db:push

db-seed:
	npm run db:seed

demo: db-push db-seed
	@echo "Demo data seeded. Open http://localhost:3000"

test:
	npm run test

lint:
	npm run lint

build:
	npm run build
