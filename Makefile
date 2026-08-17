# ==============================================================================
# DSH Mobile — Developer Makefile
# ==============================================================================

.DEFAULT_GOAL := help

CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RESET  := \033[0m

.PHONY: help check format build release dev clean local-install local-format local-check local-android local-ios

##@ 🚀 Containerized Commands (Recommended - Zero Config)

check: ## Run full quality gate (lint, typecheck, tests, policy verification)
	@echo "$(CYAN)Running quality checks in Docker container...$(RESET)"
	docker compose run --rm check

format: ## Auto-format code using Prettier
	@echo "$(CYAN)Formatting code in Docker container...$(RESET)"
	docker compose run --rm check sh -c "npm run format"

build: ## Build Android Debug APK and output to ./dist/dsh-mobile-debug.apk
	@echo "$(CYAN)Building Android Debug APK in Docker container...$(RESET)"
	docker compose run --rm build-apk

release: ## Build Android Release APK and output to ./dist/
	@echo "$(CYAN)Building Android Release APK in Docker container...$(RESET)"
	docker compose run --rm build-release

dev: ## Start Metro bundler development server (port 8081)
	@echo "$(CYAN)Starting Metro development server...$(RESET)"
	docker compose up dev

clean: ## Clean local build artifacts and output directories
	@echo "$(YELLOW)Cleaning build artifacts and dist directory...$(RESET)"
	rm -rf dist android/app/build android/.gradle .gradle node_modules/.cache coverage

##@ 💻 Local / Host Toolchain Commands (Requires Node.js & Android/iOS SDKs)

local-install: ## Install JavaScript dependencies locally
	@echo "$(CYAN)Installing npm dependencies...$(RESET)"
	npm install

local-format: ## Format code locally
	@echo "$(CYAN)Formatting code locally...$(RESET)"
	npm run format

local-check: ## Run quality check suite locally on host
	@echo "$(CYAN)Running quality checks locally...$(RESET)"
	npm run check

local-android: ## Run Android app on connected device/emulator
	@echo "$(CYAN)Bootstrapping Gradle wrapper and running Android target...$(RESET)"
	npm run native:bootstrap:android
	npm run android

local-ios: ## Install CocoaPods and run iOS app on macOS simulator
	@echo "$(CYAN)Installing pods and running iOS target...$(RESET)"
	cd ios && bundle exec pod install && cd ..
	npm run ios

##@ 📖 General

help: ## Display this help message
	@echo ""
	@echo "DSH Mobile — Development & Build Tooling"
	@echo "==========================================="
	@echo "Usage: make [target]"
	@echo ""
	@echo "Containerized Commands (Docker - Zero Config):"
	@echo "  make check          Run full quality gate"
	@echo "  make format         Auto-format all code with Prettier"
	@echo "  make build          Build Android Debug APK in ./dist"
	@echo "  make release        Build Android Release APK in ./dist"
	@echo "  make dev            Start Metro development server"
	@echo "  make clean          Clean build artifacts"
	@echo ""
	@echo "Local Toolchain Commands:"
	@echo "  make local-install  Install npm dependencies locally"
	@echo "  make local-format   Format code locally"
	@echo "  make local-check    Run quality gate locally"
	@echo "  make local-android  Run on Android device/emulator"
	@echo "  make local-ios      Run on iOS simulator (macOS)"
	@echo ""
