# 🅿️ Parking Manager

Système de gestion de parking professionnel — Vue.js 3 + Express.js + MySQL

---

## 📋 Fonctionnalités

- **CRUD complet** sur les 6 tables : Client, Voiture, Place Parking, Entrée, Sortie, Tarif
- **Recherche** de voitures par matricule ou marque (LIKE)
- **Filtrage** des entrées/sorties par date
- **Génération PDF** de relevé de stationnement mensuel par véhicule
- **Calcul automatique** du montant à la sortie selon la durée et les tarifs
- **Notification email** au client lors de l'entrée et de la sortie
- **Recette totale** avec statistiques mensuelles
- **Tableau de bord** temps réel avec plan visuel des places

## 🛠️ Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Vue.js 3, Pinia, Vue Router, Axios |
| Backend | Express.js, Node.js |
| Base de données | MySQL 8+ |
| PDF | PDFKit |
| Email | Nodemailer |
| Bundler | Vite |

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- MySQL 8+

### 1. Base de données

```sql
-- Dans MySQL, exécuter :
source /chemin/vers/backend/config/init.sql
```

Ou via la ligne de commande :
```bash
mysql -u root -p < backend/config/init.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres MySQL et SMTP
npm install
npm start          # production
npm run dev        # développement (nodemon)
```

**Variables d'environnement (.env) :**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=parking_db
PORT=3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@gmail.com
SMTP_PASS=votre_app_password
SMTP_FROM=Parking Manager <votre@gmail.com>
```

> Pour Gmail, créez un **App Password** dans les paramètres de sécurité de votre compte Google.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # développement (http://localhost:5173)
npm run build      # production
```

---

## 📁 Structure du projet

```
parking-app/
├── backend/
│   ├── config/
│   │   ├── db.js          # Pool MySQL
│   │   └── init.sql       # Script de création des tables + données
│   ├── middleware/
│   │   └── emailService.js # Envoi des emails HTML
│   ├── routes/
│   │   ├── clients.js
│   │   ├── voitures.js
│   │   ├── places.js
│   │   ├── tarifs.js
│   │   ├── entrees.js     # + logique email entrée
│   │   └── sorties.js     # + calcul montant + PDF + email sortie
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── assets/main.css          # Styles globaux (design system)
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.vue      # Navigation latérale
    │   │   │   ├── Topbar.vue       # Barre supérieure
    │   │   │   └── ToastContainer.vue
    │   │   └── modals/
    │   │       └── ConfirmModal.vue
    │   ├── router/index.js
    │   ├── store/toast.js           # Pinia store notifications
    │   ├── utils/api.js             # Instance Axios
    │   ├── views/
    │   │   ├── Dashboard.vue        # Tableau de bord
    │   │   ├── Clients.vue          # CRUD clients
    │   │   ├── Voitures.vue         # CRUD voitures + recherche
    │   │   ├── Places.vue           # CRUD places + plan visuel
    │   │   ├── Tarifs.vue           # CRUD tarifs
    │   │   ├── Entrees.vue          # Entrées + déclenchement sortie
    │   │   ├── Sorties.vue          # Historique sorties
    │   │   └── Recette.vue          # Stats financières + PDF
    │   ├── App.vue
    │   └── main.js
    ├── public/
    │   └── favicon.svg
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🗄️ Modèle de données

```
CLIENT ──< VOITURE ──< ENTREE >── PLACE_PARKING
                           │
                         SORTIE (calcul montant via TARIF)
```

### Logique métier

1. **Entrée** : La place passe de `Libre` → `Occupée`, email envoyé au client
2. **Sortie** : Durée calculée, montant déterminé via la table TARIF, place `Occupée` → `Libre`, email envoyé
3. **Tarifs** : Tranches par durée (en minutes), ex: 0-60min = 2000 Ar

---

## 🎨 Design (Critères de Bastien & Scapin)

| Critère | Implémentation |
|---------|---------------|
| **Guidage** | Labels clairs, placeholders, feedback immédiat (toasts) |
| **Charge de travail** | Actions groupées, modals concis, tableau de bord synthétique |
| **Contrôle explicite** | Confirmation avant suppression, boutons explicites |
| **Gestion des erreurs** | Messages d'erreur détaillés dans les modals |
| **Homogénéité** | Design system CSS unifié (variables, composants réutilisables) |
| **Adaptabilité** | Sidebar rétractable, filtres, recherche |

---

## 📞 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/dashboard` | Statistiques globales |
| GET/POST/PUT/DELETE | `/api/clients` | CRUD clients |
| GET/POST/PUT/DELETE | `/api/voitures?search=` | CRUD voitures + recherche |
| GET/POST/PUT/DELETE | `/api/places?etat=&typePlace=` | CRUD places |
| GET/POST/PUT/DELETE | `/api/tarifs` | CRUD tarifs |
| GET/POST/DELETE | `/api/entrees?date=` | Entrées + filtre date |
| GET/POST/DELETE | `/api/sorties?date=` | Sorties + filtre date |
| GET | `/api/sorties/recette` | Recette totale et mensuelle |
| GET | `/api/sorties/releve/pdf?idVoiture=&mois=` | Génération PDF |
| GET | `/api/health` | Santé de l'API |
