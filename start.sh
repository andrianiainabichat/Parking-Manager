#!/bin/bash
# ============================================================
# Parking Manager — Script de démarrage rapide
# ============================================================

echo ""
echo "🅿️  ============================================"
echo "    PARKING MANAGER — Démarrage"
echo "    ============================================"
echo ""

# Install backend dependencies
echo "📦 Installation des dépendances backend..."
cd backend
npm install --silent
echo "✅ Backend prêt"

# Install frontend dependencies
echo "📦 Installation des dépendances frontend..."
cd ../frontend
npm install --silent
echo "✅ Frontend prêt"

cd ..

echo ""
echo "🚀 Démarrage des serveurs..."
echo "   Backend  → http://localhost:3000"
echo "   Frontend → http://localhost:5173"
echo ""
echo "⚠️  Assurez-vous d'avoir configuré backend/.env"
echo "⚠️  Assurez-vous d'avoir exécuté backend/config/init.sql dans MySQL"
echo ""

# Start backend and frontend in parallel
(cd backend && npm run dev) &
(cd frontend && npm run dev) &

wait
