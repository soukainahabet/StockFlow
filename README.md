# StockFlow

Application SaaS de gestion de stock et de ventes — backend Spring Boot (REST API) + frontend React refondu (design system Linear/Vercel-style, dark mode, BI, factures, scanner code-barres).

## Sommaire

- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Modèle métier](#modèle-métier)
- [API REST](#api-rest)
- [RBAC — 4 rôles](#rbac--4-rôles)
- [Frontend — design system et écrans](#frontend--design-system-et-écrans)
- [Features avancées](#features-avancées)
- [Profils Spring](#profils-spring)
- [Comptes de démonstration](#comptes-de-démonstration-profil-dev)
- [Démarrage rapide](#démarrage-rapide)
- [Conventions de code](#conventions-de-code)
- [Historique des modifications](#historique-des-modifications)
- [Reste à faire](#reste-à-faire)

---

## Stack technique

### Backend (`Backend/StockFlow/StockFlow/`)
- **Spring Boot** 3.3.5 / **Java** 23
- **Spring Security** + **JWT** (jjwt 0.12.5)
- **Spring Data JPA** + **MySQL**
- **springdoc-openapi** 2.6.0 (Swagger UI en dev)
- **OpenPDF** 1.3.30 — génération des factures PDF (fork LGPL de iText 4)
- **Lombok**
- Build : Maven (`mvnw`)

### Frontend (`Frontend/`)
- **React** 19 + **TypeScript** + **Vite**
- **React Router** 7
- **TanStack React Query** 5
- **Tailwind CSS** 3 — tokens CSS vars, dark mode first-class (`darkMode: 'class'`)
- **Radix UI** (Dialog, Dropdown, Tooltip, Tabs, Select, Switch, Checkbox, Separator, Slot)
- **class-variance-authority** + **tailwind-merge** — gestion des variantes
- **Axios**, **Recharts**, **lucide-react**, **react-hot-toast**
- **`@yudiel/react-qr-scanner`** 2.1 — scanner QR / code-barres (utilise `BarcodeDetector` natif + fallback WASM)

---

## Architecture

```
StockApp/
├── Backend/StockFlow/StockFlow/
│   └── src/main/java/com/stockflow/
│       ├── config/         # DataInitializer, OpenApiConfig
│       ├── controller/     # Auth, Product, Category, Vente, StockMovement, User, Role,
│       │                   # Profile, Dashboard, Analytics, Invoice
│       ├── dto/            # request/ + response/ (incl. ProfitSummaryDto, TopProductDto, InvoiceResponse)
│       ├── exception/      # GlobalExceptionHandler + custom exceptions
│       ├── model/          # User, Role, Product, Category, Vente, LigneVente,
│       │                   # StockMovement, Invoice
│       ├── repository/     # Spring Data JPA (avec @EntityGraph)
│       ├── security/       # JWT filter + SecurityConfig
│       └── service/        # Logique métier
│                           # + InvoiceService, InvoicePdfGenerator, AnalyticsService
└── Frontend/src/
    ├── app/                # App.tsx (ThemeProvider + QueryClient + Tooltip), queryClient
    ├── components/
    │   ├── layout/         # DashboardLayout, Sidebar, Header, Breadcrumb,
    │   │                   # ThemeToggle, UserMenu, SearchPalette
    │   └── ui/             # Design system — 20+ composants atomiques + composés
    ├── features/
    │   ├── auth/           # Login, Register, AuthContext
    │   ├── products/       # ProductsPage, ProductDetailPage, ProductForm
    │   ├── categories/
    │   ├── stock/          # StockMovementsPage, StockMovementForm
    │   ├── ventes/         # VentesPage, VenteCreatePage, VenteDetailModal
    │   ├── invoices/       # InvoicesPage, InvoiceDetailPage
    │   ├── dashboard/
    │   ├── reports/        # ReportsPage (BI : KPIs, charts, profit, export CSV)
    │   ├── users/
    │   └── roles/
    ├── lib/                # cn, theme, useDebouncedValue
    ├── routes/             # AppRoutes, PrivateRoute, RoleGuard
    ├── services/           # services transverses : api (axios), authService,
    │                       # dashboardService, invoicesService, analyticsService
    │                       # (services métier locaux : Frontend/src/features/<feature>/<feature>Service.ts —
    │                       #  productsService, categoriesService, ventesService, stockService,
    │                       #  usersService, rolesService)
    ├── types/              # Types TypeScript partagés
    └── utils/              # format (currency, date), storage
```

---

## Modèle métier

| Entité          | Description                                                                      |
|-----------------|----------------------------------------------------------------------------------|
| `Product`       | Catalogue. Champs : name, **barcode** (optional, unique), **price** (sell), **buyPrice** (cost), quantity, alertThreshold, category. |
| `Category`      | Regroupement de produits.                                                        |
| `StockMovement` | Entrées / sorties de stock (`type` : IN / OUT) avec user + date.                 |
| `Vente`         | Transaction de vente, avec total et lignes.                                      |
| `LigneVente`    | Ligne d'une vente : produit, quantité, prix unitaire à l'instant t.              |
| `Invoice`       | Facture auto-générée à chaque vente. Numéro `INV-YYYY-NNNNN`, info client free-text, lien 1-to-1 vers `Vente`. |
| `User`          | Compte utilisateur avec un `Role`.                                               |
| `Role`          | RBAC. ADMIN, STOCK_MANAGER, SELLER, MANAGER (rôles système protégés).            |

---

## API REST

Toutes les routes sont préfixées par `/api/`. Auth via JWT (`Authorization: Bearer …`).

### Auth (public)
- `POST /auth/login` — connexion
- `POST /auth/register` — inscription
- `GET  /auth/me` — profil courant

### Catalogue
- `GET  /api/products?name&categoryId&minPrice&maxPrice&lowStock&page&size&sort` — liste paginée
- `GET  /api/products/{id}` — fiche produit
- `GET  /api/products/by-barcode/{barcode}` — recherche par code-barres (scanner)
- `GET  /api/products/low-stock` — produits sous seuil
- `POST /api/products` — créer
- `PUT  /api/products/{id}` — modifier
- `DELETE /api/products/{id}` — supprimer
- `GET  /api/categories[/{id}]`, `POST/PUT/DELETE` analogues

### Stock
- `GET  /api/stock-movements?productId&type&startDate&endDate&page&size` — historique
- `GET  /api/stock-movements/product/{productId}` — mouvements d'un produit
- `POST /api/stock-movements` — entrée / sortie

### Ventes
- `GET  /api/ventes?userId&startDate&endDate&minTotal&maxTotal&page&size`
- `GET  /api/ventes/{id}` — détail avec lignes
- `GET  /api/ventes/recent?limit=N`
- `POST /api/ventes` — crée la vente **et** auto-génère une `Invoice`
- `DELETE /api/ventes/{id}`

### Factures
- `GET  /api/invoices?q&startDate&endDate&page&size&sort` — liste
- `GET  /api/invoices/{id}` — détail (lignes + info client)
- `PUT  /api/invoices/{id}` — MAJ info client (name, email, address, phone, notes)
- `GET  /api/invoices/{id}/pdf` — download PDF stylé (OpenPDF, A4)

### Dashboard
- `GET  /api/dashboard/total-ventes` — totaux jour/semaine/mois
- `GET  /api/dashboard/low-stock` — produits en alerte
- `GET  /api/dashboard/top-products?limit=N`
- `GET  /api/dashboard/recent-ventes?limit=N`
- `GET  /api/dashboard/summary`

### Analytics (BI — ADMIN + MANAGER)
- `GET  /api/analytics/top-products?limit=10` — meilleures ventes (qty, sales count, revenue)
- `GET  /api/analytics/profit-products?limit=10` — bénéfice par produit + totaux (revenue, cost, profit, margin %)

### Administration
- `GET/POST/PUT/DELETE /api/users[/{id}]` — ADMIN only
- `GET/POST/PUT/DELETE /api/roles[/{id}]` — ADMIN only
- `GET  /api/profile` — profil courant

Swagger UI : `http://localhost:8080/swagger-ui.html` (en dev).

---

## RBAC — 4 rôles

Centralisé dans `SecurityConfig` (`hasRole` / `hasAnyRole`). Le frontend reflète exactement ces règles via `Sidebar.tsx` (filtre par item) + `AppRoutes.tsx` (`RoleGuard`) + gates `canManage` / `canCreate` / `canDelete` / `canMove` / `canEdit` côté pages.

### Matrice backend

| Domaine            | ADMIN | STOCK_MANAGER     | SELLER             | MANAGER (read-only) |
|--------------------|:-----:|:-----------------:|:------------------:|:-------------------:|
| Users / Roles      | full  | –                 | –                  | –                   |
| Catégories         | full  | GET               | GET                | GET                 |
| Produits           | full  | GET               | GET                | GET                 |
| Mouvements stock   | full  | GET + POST/PUT    | –                  | GET                 |
| Ventes             | full  | –                 | GET + POST/PUT     | GET                 |
| Factures           | full  | –                 | GET + PUT + PDF    | GET + PDF           |
| Dashboard          | GET   | GET               | GET                | GET                 |
| Analytics / Reports| GET   | –                 | –                  | GET                 |

### Matrice sidebar frontend

| Item                 | ADMIN | STOCK_MANAGER | SELLER | MANAGER |
|----------------------|:-----:|:-------------:|:------:|:-------:|
| Tableau de bord      |  ✓    |      ✓        |   ✓    |   ✓     |
| Rapports `/reports`  |  ✓    |      –        |   –    |   ✓     |
| Produits             |  ✓    |      ✓        |   ✓    |   ✓     |
| Catégories           |  ✓    |      ✓        |   ✓    |   ✓     |
| Mouvements de stock  |  ✓    |      ✓        |   –    |   ✓     |
| Ventes               |  ✓    |      –        |   ✓    |   ✓     |
| Factures `/invoices` |  ✓    |      –        |   ✓    |   ✓     |
| Utilisateurs         |  ✓    |      –        |   –    |   –     |
| Rôles                |  ✓    |      –        |   –    |   –     |

### Périmètre par rôle (spec métier)

- **ADMIN** — accès complet.
- **STOCK_MANAGER** — entrées/sorties de stock, contrôle des quantités, suivi des alertes.
- **SELLER** — enregistrement des ventes, consultation des produits, traitement des opérations commerciales, édition des factures.
- **MANAGER** — statistiques, ventes, état du stock, rapports d'activité (consultation pure).

---

## Frontend — design system et écrans

### Direction visuelle

**"Operator"** — neutrals slate + accent indigo-600, dense Linear/Vercel-style, dark mode first-class.

Tokens Tailwind exposés (via CSS vars `--color-*`) :
- Surfaces : `bg-app`, `bg-surface`, `bg-surface-muted`, `bg-surface-elevated`
- Bordures : `border-default`, `border-strong`
- Texte : `text-primary`, `text-secondary`, `text-muted`, `text-disabled`
- Accent : `bg-accent`, `bg-accent-soft`, `text-accent`, `text-accent-soft-fg`
- Sémantique : `*-success`, `*-warning`, `*-danger`, `*-info` (chacun avec `*`, `*-fg`, `*-soft`, `*-soft-fg`)

Tabular-nums actif par défaut sur les nombres des tables. Échelle typographique resserrée (text-xs à text-2xl). Bordures 1px subtiles, ombres très douces (`shadow-subtle`, `shadow-soft`, `shadow-pop`).

### Composants `Frontend/src/components/ui/`

| Atomiques               | Composés / spécialisés                                  |
|-------------------------|----------------------------------------------------------|
| `Button` (5 variants × 6 sizes, `asChild`, `loading`) | `DataTable<T>` générique (tri serveur, sélection multi, colonnes masquables, sticky header) |
| `Input`, `Label`, `Textarea` | `Pagination` (compteur central `1/N` + page size selector) |
| `Select` (Radix)        | `SearchInput` debouncé                                  |
| `Checkbox`, `Switch` (Radix) | `FilterBar` + bouton reset                          |
| `Badge` (6 variants, dot) | `PageHeader` (title + meta + actions)                 |
| `Card` family           | `StatCard` (KPI + delta auto-coloré + sparkline slot)   |
| `Dialog` / `Drawer` (Radix) | `ChartContainer` (wrapper Recharts safe vs width(-1)) |
| `Dropdown` (Radix)      | `ConfirmDialog`                                         |
| `Tooltip` (Radix)       | `BarcodeScanner` (Dialog + caméra + fallback manuel)    |
| `Tabs` (Radix)          | `Modal` (compat shim sur Dialog)                        |
| `Separator`, `Skeleton`, `Spinner` |                                              |
| `EmptyState`, `Toast`   |                                                          |

### Écrans

| Route                  | Rôle requis                              | Description                                                                 |
|------------------------|------------------------------------------|-----------------------------------------------------------------------------|
| `/login`, `/register`  | public                                   | Cartes centrées sobres, erreurs inline (pas de toast), comptes démo en `<details>` dev-only |
| `/dashboard`           | tous                                     | 4 StatCard, chart CA 30j, top produits, ventes récentes, stock faible       |
| `/reports`             | ADMIN, MANAGER                           | 5 KPIs avec deltas N vs N-1, chart CA, **Meilleures ventes** (BI), **Top vendeurs**, **Bénéfice par produit** (BI), bilan stock, **export CSV** |
| `/products`            | tous                                     | DataTable + filtres URL-sync + drawer création/édition + scanner            |
| `/products/:id`        | tous                                     | Header + actions + tabs (Infos, Mouvements, Ventes), encart stock sticky    |
| `/categories`          | tous                                     | DataTable + drawer                                                          |
| `/stock-movements`     | ADMIN, STOCK_MANAGER, MANAGER            | DataTable chronologique + drawer saisie avec validation stock négatif       |
| `/ventes`              | ADMIN, SELLER, MANAGER                   | DataTable + modal détail "facture"                                          |
| `/ventes/new`          | ADMIN, SELLER                            | Lignes dynamiques + récap sticky + **scanner code-barres**                  |
| `/invoices`            | ADMIN, SELLER, MANAGER                   | Liste des factures avec filtres                                             |
| `/invoices/:id`        | ADMIN, SELLER, MANAGER (PUT : ADMIN+SELLER) | Aperçu "facture" + boutons **Imprimer** / **Télécharger PDF** / **Modifier client** |
| `/users`, `/roles`     | ADMIN                                    | Gestion des comptes et des rôles (cadenas système)                          |

### Patterns UX transverses

- **URL-sync filters** (`useSearchParams`) sur `/products`, `/categories`, `/stock-movements`, `/ventes`, `/users`, `/invoices`, `/reports`.
- **States vides** avec icône lucide + CTA contextuel.
- **Loading** : skeletons fidèles à la structure finale (jamais de spinner plein écran après login).
- **Confirmations** : `ConfirmDialog` pour toute action destructive.
- **Optimistic invalidation** via React Query après chaque mutation.
- **Raccourcis clavier** : `Cmd/Ctrl+K` ouvre la palette de recherche (stub), `/` focus recherche, `Esc` ferme modales/drawers.
- **Accessibilité** : focus ring visible, contraste AA, navigation clavier complète sur DataTable + Dropdown + Dialog (Radix).
- **Dark mode** persisté dans `localStorage` + suivi `prefers-color-scheme`.
- **Toast custom** (`toastUI.success/error/warning/info`) — wrapper React au-dessus de `react-hot-toast` avec design en tokens (compatible dark mode).

---

## Features avancées

### 1. Business Intelligence

Endpoints d'agrégation (`/api/analytics/**`, ADMIN + MANAGER). Queries JPQL en single GROUP BY sur `LigneVenteRepository` — pas de N+1.

- **Top-products** : qtySold, salesCount (`COUNT(DISTINCT vente)`), revenue (`SUM(qty × prixUnitaire)`).
- **Profit-products** : revenue, cost (`SUM(qty × COALESCE(buyPrice, 0))`), profit, marginPercent, ordered DESC by profit. Réponse encapsulée dans `ProfitSummaryDto` (totals + items).

Frontend :
- 5e KPI `Bénéfice total` sur `/reports`
- Widget "Meilleures ventes" (BarChart horizontal, tous temps)
- Table "Bénéfice par produit" avec Badge marge sémantique (≥30% success, ≥10% warning, sinon danger)
- Marge live dans `ProductForm`, marge unitaire dans `ProductDetailPage`

> **Limite** : profit utilise le `buyPrice` actuel, pas un snapshot historique. Pour conformité comptable, ajouter `LigneVente.buyPrice`.

### 2. Reports `/reports` (ADMIN + MANAGER)

Page dédiée aux rapports d'activité :
- **Sélecteur de période** : `today` / `7d` / `30d` / `90d` / `custom` (synchronisé URL)
- **5 KPIs avec deltas N vs N-1** calculés client-side : CA, ventes, ticket moyen, bénéfice total, alertes stock
- **Chart CA journalier** (LineChart)
- **BI widgets** (top sellers, top products, profit table)
- **Bilan stock** entrées / sorties / variation nette
- **Export CSV** UTF-8 + BOM Excel (Blob synthétique)

### 3. Smart Invoice Generator

- **Auto-création** : à chaque `POST /api/ventes`, une `Invoice` est créée dans la même transaction (`InvoiceService.createForVente`). Numéro `INV-YYYY-NNNNN` (counter par année). Info client initialement vide.
- **Édition info client** : `PUT /api/invoices/{id}` — name, email, address, phone, notes (free-text, tous optionnels).
- **Génération PDF** : `GET /api/invoices/{id}/pdf` → `InvoicePdfGenerator` (OpenPDF, A4) → layout pro : header brand + numéro, blocs Émetteur/Client, méta dates, lignes en table, bloc total accent-bordered, footer.
- **Frontend** : `/invoices` (liste filtrable), `/invoices/:id` (aperçu facture stylé + boutons Imprimer / Télécharger PDF / Modifier client). Print CSS dans `index.css` masque sidebar/header et force fond blanc.

### 4. Scanner code-barres / QR

- **Champ `barcode`** sur `Product` (unique, indexed, ≤ 64 caractères) — EAN-13, UPC, Code-128, QR…
- **Endpoint** : `GET /api/products/by-barcode/{barcode}` (accessible à tous les rôles pour permettre le scan au SELLER).
- **Composant frontend** : `<BarcodeScanner>` — Dialog plein écran avec caméra arrière, formats supportés (QR, EAN-13/8, UPC-A/E, Code-128/39/93, Codabar, ITF), fallback saisie manuelle, gestion des erreurs (`NotAllowedError` / `NotFoundError`).
- **Intégration** :
  - **`ProductForm`** : bouton **Scanner** à côté du champ barcode → le code détecté remplit le champ.
  - **`VenteCreatePage`** : bouton **Scanner** dans la carte Lignes → `productsService.getByBarcode` → soit la ligne du produit est incrémentée, soit la 1ère ligne vide est remplie, soit une nouvelle ligne est créée. Garde de stock négatif inclus.

---

## Profils Spring

- **dev** (par défaut, `SPRING_PROFILES_ACTIVE=dev`) : Swagger activé, CORS `*`, comptes de démo seedés, `ddl-auto=update`.
- **prod** : Swagger désactivé, CORS strict, `ddl-auto=validate`. Variables d'environnement obligatoires (pas de valeurs par défaut) :
  - `DB_URL`, `DB_USER`, `DB_PASSWORD`
  - `JWT_SECRET`
  - `APP_CORS_ALLOWED_ORIGINS`

**Migration manuelle requise en prod** pour les nouveaux champs :
```sql
ALTER TABLE products ADD COLUMN buy_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN barcode VARCHAR(64);
CREATE UNIQUE INDEX uk_products_barcode ON products(barcode);

CREATE TABLE invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(32) NOT NULL UNIQUE,
    vente_id BIGINT NOT NULL UNIQUE,
    issue_date DATETIME(6) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    customer_name VARCHAR(150),
    customer_email VARCHAR(150),
    customer_address VARCHAR(500),
    customer_phone VARCHAR(30),
    notes VARCHAR(500),
    CONSTRAINT fk_invoice_vente FOREIGN KEY (vente_id) REFERENCES ventes(id)
);
CREATE INDEX idx_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoice_vente ON invoices(vente_id);
```

---

## Comptes de démonstration (profil dev)

| Email                  | Mot de passe | Rôle           |
|------------------------|--------------|----------------|
| admin@stockflow.com    | admin123     | ADMIN          |
| stock@stockflow.com    | stock123     | STOCK_MANAGER  |
| seller@stockflow.com   | seller123    | SELLER         |
| manager@stockflow.com  | manager123   | MANAGER        |

L'écran `/login` propose un encart repliable (`<details>`, **dev only**) avec ces comptes pré-remplissables d'un clic.

---

## Démarrage rapide

### Backend
```powershell
cd Backend\StockFlow\StockFlow
.\mvnw spring-boot:run
```
- API : `http://localhost:8080`
- Swagger UI : `http://localhost:8080/swagger-ui.html`

### Frontend
```powershell
cd Frontend
npm install
npm run dev
```
- App : `http://localhost:5173`
- Vite proxy `/api` et `/auth` → `http://localhost:8080` (configuré dans `vite.config.ts`)

### Parcours de test E2E

1. Login `admin@stockflow.com / admin123`.
2. `/products` → menu **Colonnes** → activer "Code-barres" → modifier un produit → bouton **Scanner** → autoriser la caméra → scanner un EAN-13 → enregistrer.
3. `/ventes/new` → bouton **Scanner** → scanner le même code → ligne ajoutée. Re-scanner → quantité +1.
4. Enregistrer la vente → `/ventes`.
5. `/invoices` → la facture auto-générée apparaît en tête → clic → page de détail.
6. Bouton **Modifier client** → renseigner le client → enregistrer.
7. Bouton **Imprimer** ou **Télécharger PDF** → vérifier le rendu.
8. `/reports` → vérifier les 5 KPIs (avec deltas), Meilleures ventes, Bénéfice par produit.
9. Toggle dark mode dans le header → tous les écrans restent lisibles (charts, tooltips, drawers, scanner inclus).

---

## Conventions de code

### Backend

- **Pagination** : `@ParameterObject @PageableDefault` côté contrôleur, `Page<Entity>` côté repo avec `@EntityGraph`, service renvoie `PageResponse<Dto>` (jamais le `Page` Spring directement).
- **Prévention N+1** : `@EntityGraph` sur les requêtes de listing + `@BatchSize(50)` sur `Vente.lignes`. Les queries analytics (`findTopProductsWithStats`, `findProfitByProduct`) sont en single GROUP BY.
- **RBAC** : règles dans `SecurityConfig` uniquement. `@PreAuthorize` réservé à la défense en profondeur sur `UserController` et `RoleController` (ADMIN). **Ne jamais** mettre de `@PreAuthorize` sur `StockMovementController`, `InvoiceController` ou `AnalyticsController`.
- **Rôles système** réservés : `RoleService.SYSTEM_ROLES` empêche le renommage / la suppression d'`ADMIN`, `STOCK_MANAGER`, `SELLER`, `MANAGER`, `USER`.
- **DTOs** : un `*Request` (validation Jakarta) + un `*Response` (jamais d'entity exposée). `Page` mappé via `PageResponse.from(page, Dto::fromEntity)`.

### Frontend

- **`Button asChild`** : la branche `<Slot>` rend **exactement un seul enfant** (children). Ne jamais y ajouter de sibling conditionnel (`{loading && <Loader/>}`) — Radix `Slot` appelle `Children.only(null)` et la page devient blanche.
- **Imports** : `verbatimModuleSyntax: true` → tous les imports de type doivent être `import type`. Alias `@` configuré dans `vite.config.ts` + `tsconfig.app.json`.
- **`URLSearchParams`** pour les filtres de pages (`useSearchParams`) — partageable, back/forward fonctionne.
- **Toasts** : utiliser `toastUI.*` (wrapper custom) plutôt que `toast.*` direct — design en tokens, dark-mode-compatible.
- **PDF download** : `axios.get(url, { responseType: 'blob' })` + `URL.createObjectURL(blob)` + `<a download>` synthétique + `URL.revokeObjectURL`.
- **Print** : `window.print()` + utilities Tailwind `print:hidden` / `print:bg-white` + règles `@media print` globales dans `index.css` qui masquent sidebar/header.

---

## Historique des modifications

Les évolutions majeures du projet, dans l'ordre chronologique.

### v0.4 — 2026-05-16 — Business Intelligence, factures et scanner

**Backend**
- Nouvelle entité `Invoice` (table `invoices`, lien 1↔1 vers `Vente`) auto-créée dans `VenteService.createVente`. Numérotation `INV-YYYY-NNNNN`.
- Service `InvoicePdfGenerator` (OpenPDF 1.3.30) — génération PDF A4 stylé (header brand, blocs Émetteur/Client, lignes, total accent-bordered, footer).
- Nouveau `InvoiceController` : `GET /api/invoices`, `GET /api/invoices/{id}`, `PUT /api/invoices/{id}` (info client), `GET /api/invoices/{id}/pdf`.
- Nouveau champ `Product.barcode` (unique, indexed, ≤ 64 chars) + endpoint `GET /api/products/by-barcode/{barcode}` (tous rôles).
- Nouveau champ `Product.buyPrice` (BigDecimal, nullable) pour les calculs de marge / bénéfice.
- Nouveau `AnalyticsController` (ADMIN + MANAGER) :
  - `GET /api/analytics/top-products?limit=10` → `TopProductDto[]`
  - `GET /api/analytics/profit-products?limit=10` → `ProfitSummaryDto` (items + totaux)
- Requêtes en single GROUP BY sur `LigneVenteRepository` (`findTopProductsWithStats`, `findProfitByProduct`) — pas de N+1.
- Dépendance ajoutée : `com.github.librepdf:openpdf:1.3.30` dans `pom.xml`.

**Frontend**
- Nouveau composant `BarcodeScanner` (`@yudiel/react-qr-scanner` 2.1) — Dialog plein écran, caméra arrière, formats QR + EAN-13/8, UPC-A/E, Code-128/39/93, Codabar, ITF, fallback saisie manuelle.
- Intégration scanner dans `ProductForm` (lier un code à un produit) et `VenteCreatePage` (scan → recherche → ajout/incrémentation auto au panier, avec garde de stock).
- Nouvelles pages `/invoices` (liste filtrable) et `/invoices/:id` (aperçu facture + boutons Imprimer / Télécharger PDF / Modifier client). Print CSS dans `index.css`.
- Page `/reports` (ADMIN + MANAGER) enrichie :
  - 5e KPI **Bénéfice total** avec delta N vs N-1
  - Widget **Meilleures ventes** (BarChart horizontal, tous temps)
  - Table **Bénéfice par produit** avec Badge marge sémantique (≥30% success / ≥10% warning / sinon danger)
  - Export CSV UTF-8 + BOM Excel
- `ProductForm` : marge live (€ + %) et flag `invalid` sur le prix de vente si ≤ buyPrice. `ProductDetailPage` : affichage buyPrice + marge unitaire. `ProductsPage` : colonne **Prix achat** masquable (défaut caché).
- Nouveau service `analyticsService.ts` (transverse) et `invoicesService.ts`.

### v0.3 — 2026-04-27 — RBAC re-hardened

- Centralisation complète des règles dans `SecurityConfig` (`hasRole` / `hasAnyRole`).
- Retrait de `@PreAuthorize` parasites sur `StockMovementController` (avait silencieusement bloqué STOCK_MANAGER sur les entrées/sorties).
- `RoleService.SYSTEM_ROLES` : protection renommage/suppression d'`ADMIN`, `STOCK_MANAGER`, `SELLER`, `MANAGER`, `USER`.
- Frontend miroir : `Sidebar.tsx` (filtre par item), `AppRoutes.tsx` (`RoleGuard`), gates `canManage` / `canCreate` / `canDelete` / `canMove` côté pages.

### v0.2 — 2026-04-18 — Modern SaaS redesign

Commit `13bd553` — `feat(stockflow): modern SaaS redesign with new UI system, layout improvements, dashboard enhancements, and core feature integrations`.

- **Design system "Operator"** : ~20 composants Radix + tokens CSS vars + dark mode first-class (`darkMode: 'class'`).
- Layout `DashboardLayout` + `Sidebar` filtrée par rôle + `Header` (theme toggle, user menu) + `SearchPalette` (stub).
- Pages refondues : Dashboard (StatCards + chart CA 30j + top produits), Produits, Catégories, Mouvements de stock, Ventes, Utilisateurs, Rôles.
- `DataTable<T>` générique (tri serveur, colonnes masquables, sticky header, sélection multi), `Pagination` (compteur central, page size), `FilterBar` (URL-sync), `ConfirmDialog`, `Drawer`.
- Toast custom (`toastUI`) en tokens, compatible dark-mode, branché sur les erreurs Axios.
- React Query 5 + invalidation après chaque mutation.
- Comptes seedés en dev : `admin@stockflow.com`, `stock@stockflow.com`, `seller@stockflow.com`, `manager@stockflow.com`.
- Module ventes unifié sur `Vente` (suppression définitive de `Sale` / `SaleItem`).
- Profils Spring `dev` (Swagger, CORS `*`, seeding) et `prod` (Swagger off, CORS strict, vars d'env obligatoires).
- `PageResponse<Dto>` partout — jamais d'`org.springframework.data.domain.Page` exposé.

### v0.1 — Initial commits

- `40906a3` — Ajout du frontend React initial.
- `ffe86ca` — Update backend.
- `58b824f` — Initial commit.

---

## Reste à faire

- Tests unitaires (JUnit 5) et d'intégration (Spring Boot Test + Testcontainers).
- Entités `Supplier` / `Customer` / `PurchaseOrder`.
- Migrations versionnées (Flyway ou Liquibase) pour remplacer `ddl-auto` en prod.
- Endpoint backend d'agrégation timeseries (`/api/dashboard/revenue-timeseries?from&to`) pour `/reports` à fort volume — aujourd'hui le front agrège côté client (plafond ~1 000 ventes/période).
- Snapshot historique du `buyPrice` sur `LigneVente` pour des profits comptables exacts.
- Numérotation invoice via séquence DB (atomique sous charge) plutôt que `COUNT + 1`.
- Export PDF des rapports (actuellement CSV uniquement).
- Restriction backend de `Product.buyPrice` pour les rôles non-financiers (aujourd'hui exposé dans la réponse à tous les rôles authentifiés).
- TVA / mentions légales sur les factures (le total est TTC implicite, pas de décomposition HT/TVA).
- Cmd+K palette de commandes (actuellement stub).
