
whatsapp-ai-chatbot/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   │
│   ├── database/
│   │   ├── connection.py
│   │   └── base.py
│   │
│   ├── modules/
│   │   │
│   │   ├── admin/
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   │
│   │   ├── dashboard/
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   │
│   │   ├── products/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── repository.py
│   │   │   └── service.py
│   │   │
│   │   ├── notifications/
│   │   │   ├── router.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── repository.py
│   │   │   └── service.py
│   │   │
│   │   └── chatbot/
│   │       ├── service.py
│   │       └── ...
│   │
│   ├── integrations/
│   │   ├── whatsapp/
│   │   │   └── client.py
│   │   │
│   │   └── ai/
│   │       └── client.py
│   │
│   └── api/
│       └── router.py
│
├── tests/
│   ├── test_products.py
│   ├── test_admin.py
│   └── test_notifications.py
│
├── migrations/
│
├── .env
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md







# Architecture du Backend — FastAPI

## 1. Présentation générale

Le backend de notre application est développé avec **FastAPI (Python)**. Il constitue le cœur de notre système et assure la communication entre :

- Le frontend React (interface d'administration).
- La base de données PostgreSQL hébergée sur Neon.
- L'API WhatsApp Business Platform.
- L'API GPT pour le traitement des demandes des clients.

L'architecture adoptée repose sur une approche **Feature-Based Architecture**, combinée à une séparation des responsabilités en plusieurs couches.

L'objectif est de rendre le code organisé, maintenable, réutilisable et évolutif.

## 2. Organisation et responsabilités des dossiers

### `app/`

Dossier principal contenant le code source de l'application FastAPI.

- `__init__.py` : permet à Python de reconnaître `app` comme un package et facilite les imports entre les différents modules.
- `main.py` : point d'entrée de l'application. Il initialise FastAPI, configure les éléments globaux (CORS, middleware, etc.) et enregistre le routeur principal de l'API.

### `core/` — Configuration et sécurité

Contient les éléments transversaux utilisés par plusieurs parties de l'application.

- `config.py` : centralise la configuration de l'application et la lecture des variables d'environnement provenant du fichier `.env` (URL PostgreSQL, clés API, secrets JWT, etc.).
- `security.py` : regroupe les mécanismes de sécurité et d'authentification : hashage et vérification des mots de passe, génération et validation des tokens JWT, identification de l'administrateur connecté.

### `database/` — Gestion de la base de données

Contient les éléments nécessaires à la communication avec PostgreSQL via SQLAlchemy.

- `connection.py` : configure le moteur SQLAlchemy (`Engine`) et les sessions de connexion à PostgreSQL (Neon).
- `base.py` : définit la classe de base déclarative SQLAlchemy dont hériteront les modèles de données.

### `modules/` — Fonctionnalités métier

Chaque sous-dossier représente une fonctionnalité indépendante de l'application. Il contient les composants nécessaires à son fonctionnement.

#### `admin/` — Administration et authentification

Gère les comptes administrateurs et leur authentification.

- `router.py` : endpoints liés à la connexion et aux opérations d'administration.
- `models.py` : modèle SQLAlchemy représentant les administrateurs dans PostgreSQL.
- `schemas.py` : schémas Pydantic pour valider les données d'authentification et structurer les réponses de l'API.
- `service.py` : logique métier liée à l'administration et à l'authentification.

#### `dashboard/` — Tableau de bord

Gère les statistiques affichées dans l'interface d'administration.

- `router.py` : endpoints permettant de récupérer les indicateurs du dashboard.
- `service.py` : calcule et regroupe les statistiques (nombre de produits, stock total, commandes, revenus, etc.).

#### `products/` — Gestion des produits

Gère le catalogue des produits de la boutique.

- `router.py` : endpoints CRUD (création, consultation, modification et suppression des produits), avec recherche et pagination.
- `models.py` : modèle SQLAlchemy représentant la table `products`.
- `schemas.py` : schémas Pydantic pour valider les données reçues et structurer les produits retournés par l'API (`ProductCreate`, `ProductUpdate`, `ProductResponse`, etc.).
- `repository.py` : regroupe les opérations d'accès aux données : récupération, insertion, modification et suppression des produits dans PostgreSQL.
- `service.py` : contient la logique métier liée aux produits et applique les règles de gestion avant de solliciter le repository.

#### `notifications/` — Notifications et escalade humaine

Gère les conversations clients nécessitant une intervention humaine.

- `router.py` : endpoints permettant de consulter les notifications, de les marquer comme lues ou de les résoudre.
- `models.py` : modèle SQLAlchemy représentant les notifications dans PostgreSQL.
- `schemas.py` : schémas Pydantic pour la validation et le transfert des données des notifications.
- `repository.py` : opérations d'accès aux notifications dans PostgreSQL.
- `service.py` : logique métier de gestion des notifications et de leur état (en attente, lues, résolues).

#### `chatbot/` — Orchestration de l'assistant IA

Contient la logique centrale du chatbot.

- `service.py` : orchestre le traitement des messages clients. Il coordonne l'analyse des demandes, la récupération des informations produits, la génération des réponses avec GPT et l'escalade vers un administrateur lorsque cela est nécessaire.

**Important :** le chatbot orchestre les différentes opérations, mais ne réimplémente pas directement la communication technique avec les API externes.

### `integrations/` — Communication avec les services externes

Contient les composants responsables des interactions techniques avec les API tierces.

#### `whatsapp/`

- `client.py` : encapsule la communication avec WhatsApp Business Platform API, notamment l'envoi de messages, la gestion des requêtes HTTP et des erreurs de communication.

#### `ai/`

- `client.py` : encapsule la communication avec l'API GPT : transmission des prompts, envoi des messages, récupération des réponses et gestion des erreurs.

**Différence importante :** `integrations/` gère la communication technique avec les services externes, tandis que `modules/chatbot/` gère la logique métier et l'orchestration des interactions.

### `api/` — Regroupement des routes

- `router.py` : centralise et regroupe les routeurs des différents modules (`admin`, `products`, `dashboard`, `notifications`, etc.) sous un préfixe commun, par exemple `/api/v1`.

Cela permet de structurer les endpoints et de faciliter la gestion de la version de l'API.

### `tests/` — Tests automatisés

Contient les tests permettant de vérifier automatiquement le bon fonctionnement de l'application.

Exemples :

- `test_products.py` : teste les opérations et les règles métier liées aux produits.
- `test_admin.py` : teste l'authentification et les accès administrateurs.
- `test_notifications.py` : teste la gestion des notifications et des escalades.

Outils prévus :

- **Pytest** : exécution des tests automatisés.
- **FastAPI TestClient** : simulation de requêtes HTTP vers les endpoints.
- **HTTPX** : client HTTP utilisé par les outils de test.
- **unittest.mock** : simulation de certaines dépendances externes.

### `migrations/` — Migrations de base de données

Contient les fichiers de migration générés et gérés par **Alembic**.

Ils permettent de faire évoluer progressivement la structure de PostgreSQL (création de tables, ajout ou modification de colonnes, etc.) sans devoir recréer entièrement la base de données.

## 3. Comprendre les différentes couches d'un module

Dans les modules qui nécessitent un accès à la base de données, plusieurs fichiers peuvent collaborer. Chacun possède une responsabilité précise.

| Fichier | Technologie / responsabilité | Rôle |
|---|---|---|
| `router.py` | FastAPI | Reçoit les requêtes HTTP et retourne les réponses. |
| `models.py` | SQLAlchemy | Décrit la structure des tables de la base de données. |
| `schemas.py` | Pydantic | Valide les données entrantes et structure les données sortantes. |
| `repository.py` | SQLAlchemy | Effectue les opérations d'accès aux données. |
| `service.py` | Logique métier | Applique les règles métier et coordonne les opérations. |

### Différence entre Models et Schemas

- **Models (SQLAlchemy)** : décrivent comment les données sont stockées dans PostgreSQL.
- **Schemas (Pydantic)** : décrivent comment les données sont reçues, validées et renvoyées par l'API.

Exemple : lors de la création d'un produit, `ProductCreate` vérifie les données reçues du frontend, tandis que le modèle `Product` représente l'enregistrement correspondant dans PostgreSQL.

### Différence entre Repository et Service

- **Repository** : sait comment accéder aux données et effectuer les opérations sur la base de données.
- **Service** : sait quelles règles métier appliquer et dans quel ordre exécuter les opérations.

Cette séparation évite de mélanger les requêtes SQL, les règles métier et la gestion des requêtes HTTP.

## 4. Flux de traitement d'une requête API

Exemple : création d'un produit depuis React.

1. **React** envoie une requête HTTP POST contenant les informations du produit.
2. **Router** reçoit la requête et utilise le schéma Pydantic pour valider les données.
3. **Service** applique les règles métier (prix positif, stock non négatif, etc.).
4. **Repository** exécute l'opération d'insertion via SQLAlchemy.
5. **PostgreSQL** enregistre le produit.
6. Le résultat remonte jusqu'au frontend sous la forme d'une réponse JSON.

## 5. Flux de traitement d'un message WhatsApp

Exemple : un client demande si un iPhone 15 est disponible.

1. WhatsApp transmet le message à notre backend via un webhook.
2. Le backend reçoit et traite le webhook.
3. Le service du chatbot analyse la demande.
4. Le chatbot sollicite le module `products` pour récupérer les informations du produit.
5. Le chatbot transmet les données pertinentes à l'API GPT pour formuler une réponse.
6. Le client WhatsApp envoie la réponse au client.

Si la demande est hors périmètre ou ne peut pas être résolue correctement, le chatbot déclenche une escalade humaine via le module `notifications`.

**Principe fondamental :** les prix et les stocks proviennent de PostgreSQL. GPT sert à comprendre et à formuler les réponses, et ne doit pas inventer les informations commerciales.

## 6. Technologies et outils principaux

| Technologie | Utilisation |
|---|---|
| FastAPI | Framework backend et création des API REST. |
| Uvicorn | Serveur ASGI pour exécuter l'application. |
| Pydantic | Validation et structuration des données. |
| SQLAlchemy | ORM et interaction avec PostgreSQL. |
| Alembic | Gestion des migrations de base de données. |
| PostgreSQL / Neon | Stockage des données. |
| Pytest | Tests automatisés. |
| HTTPX | Client HTTP utilisé notamment pour les tests. |
| WhatsApp Business API | Communication avec les clients. |
| GPT API | Compréhension et génération des réponses IA. |
| JWT | Authentification des administrateurs. |

## 7. Principes architecturaux à respecter

1. Chaque fichier doit avoir une responsabilité clairement définie.
2. Les routes ne doivent pas contenir toute la logique métier.
3. Les requêtes d'accès à la base de données doivent être séparées de la logique métier lorsque la couche repository est utilisée.
4. Les modèles SQLAlchemy et les schémas Pydantic ne doivent pas être confondus.
5. Les communications avec les services externes doivent être isolées dans `integrations/`.
6. Le chatbot doit orchestrer les fonctionnalités existantes plutôt que reproduire leur logique.
7. Les données sensibles doivent être stockées dans les variables d'environnement et ne jamais être publiées dans le dépôt Git.
8. Les fonctionnalités importantes doivent être accompagnées de tests automatisés.

---

**Objectif de cette architecture :** construire un backend modulaire, maintenable et évolutif, permettant de faire fonctionner un assistant vendeur intelligent connecté à WhatsApp tout en offrant aux commerçants une interface d'administration complète.

