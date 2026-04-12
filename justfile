# Hy Manager — deploy tasks
# Run `just` (no args) to list available recipes.

set shell := ["bash", "-cu"]

default:
    @just --list

# Build the SPA for production using .env.production
build:
    @test -f .env.production || { echo "❌ .env.production not found in project root"; exit 1; }
    pnpm generate:prod

# Build with prod env, then serve locally to smoke-test before deploying
preview: build
    pnpm preview

# Full deploy: hosting + firestore rules + firestore indexes
deploy: build
    firebase deploy

# Hosting-only deploy (faster — skips firestore rules/indexes)
deploy-hosting: build
    firebase deploy --only hosting

# Deploy firestore rules + indexes without rebuilding the app
deploy-firestore:
    firebase deploy --only firestore

# Show the active Firebase project
whoami:
    firebase projects:list
    firebase use
