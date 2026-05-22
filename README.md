# SOOM - Stock Order Management System

SOOM adalah sistem manajemen stok dan pesanan yang dirancang untuk membantu pedagang dan UMKM mengelola inventaris dan membuat keputusan penjualan yang lebih baik.

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Instalasi & Setup](#instalasi--setup)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Proyek](#struktur-proyek)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## ✨ Fitur

### Manajemen Produk
- Kelola produk dengan tiga tipe: Made to Order, Made to Stock, Resell
- Riwayat resep dengan versioning
- Estimasi modal berdasarkan resep
- Tampilan card-based untuk navigasi yang lebih baik

### Manajemen Inventaris
- Tracking stok bahan dan produk
- Unit konversi otomatis
- Alert stok minimal
- Riwayat perubahan stok

### Manajemen Pesanan
- Pembuatan pesanan cepat
- Tracking status pesanan
- Payment recording
- Order history

### Proses Produksi
- Schedule produksi
- Tracking tanggal expired
- Riwayat produksi
- Cost tracking

### Analisis Finansial
- Dashboard metrik bisnis
- Cash flow tracking
- Profit/Loss analysis
- Revenue reports

### User Management
- Multi-user support
- Role-based access control
- User administration

## 💻 Teknologi

### Backend
- **Framework**: Java Spring Boot 3.5.11
- **Database**: PostgreSQL 16
- **ORM**: Spring Data JPA + Hibernat
- **Caching**: Redis 7
- **Authentication**: JWT (JJWT 0.12.6)
- **Migration**: Flyway 10.x
- **Build**: Maven 3.9
- **Java**: OpenJDK 17

### Frontend
- **Framework**: React 19.2.4
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 8.0.0
- **Routing**: React Router DOM 7.13.1
- **State Management**: Zustand 5.0.11
- **HTTP Client**: Axios 1.13.6
- **Data Fetching**: TanStack React Query 5.90.21
- **UI Components**: PrimeReact 10.9.7
- **Form**: React Hook Form 7.71.2
- **Charts**: Chart.js 4.5.1
- **Testing**: Cypress 15.13.0

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (production)

## 🚀 Prasyarat

- Docker & Docker Compose (recommended)
- Atau:
  - Java 17+ (untuk backend)
  - Node.js 20+ (untuk frontend)
  - PostgreSQL 16
  - Redis 7

## 🔧 Instalasi & Setup

### Menggunakan Docker (Recommended)

1. **Clone/Setup Proyek**
   ```bash
   cd SOOM
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` dengan nilai yang sesuai

3. **Start Services**
   ```bash
   docker-compose up --build
   ```

4. **Akses Aplikasi**
   - Frontend: http://localhost:80
   - Backend: http://localhost:8081
   - Health: http://localhost:8081/api/health

### Manual Setup (Development)

#### Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

Database dan Redis harus running di localhost dengan default credentials.

## 📖 Menjalankan Aplikasi

### Development Mode
```bash
# Backend (dari backend folder)
mvn spring-boot:run

# Frontend (dari frontend folder)
npm run dev
```

### Production Mode
```bash
# Build Frontend
cd frontend
npm run build

# Build Backend
cd backend
mvn clean package

# Deploy menggunakan Docker
docker-compose -f docker-compose.yml up -d
```

## 📁 Struktur Proyek

```
SOOM/
├── backend/                    # Java Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/soom/backend/
│   │   │   │   ├── controller/      # REST API endpoints (12 controllers)
│   │   │   │   ├── service/         # Business logic (14 services)
│   │   │   │   ├── repository/      # Data access (15 repositories)
│   │   │   │   ├── entity/          # JPA entities (16 entities)
│   │   │   │   ├── dto/             # DTOs for API
│   │   │   │   ├── security/        # JWT authentication
│   │   │   │   ├── config/          # Spring configuration
│   │   │   │   ├── exception/       # Custom exceptions
│   │   │   │   ├── enums/           # Domain enums
│   │   │   │   ├── utils/           # Utilities
│   │   │   │   └── context/         # Multi-tenancy support
│   │   │   └── resources/
│   │   │       ├── application.yaml # Configuration
│   │   │       └── db/migration/    # Flyway migrations (15 migrations)
│   │   └── test/                    # Unit & Integration tests
│   ├── pom.xml                      # Maven dependencies
│   └── Dockerfile                   # Docker image
│
├── frontend/                   # React TypeScript Application
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── common/              # Common UI components
│   │   │   ├── product/             # Product components (+ new cards)
│   │   │   ├── categories/          # Category components
│   │   │   ├── ingredient/          # Ingredient components
│   │   │   ├── order/               # Order components
│   │   │   ├── production/          # Production components
│   │   │   ├── cashflow/            # Cash flow components
│   │   │   ├── units/               # Unit components
│   │   │   └── user/                # User components
│   │   ├── pages/                   # Page components (11 pages)
│   │   ├── hooks/                   # Custom hooks
│   │   │   └── queries/             # React Query hooks
│   │   ├── services/                # API services
│   │   ├── store/                   # Zustand stores
│   │   ├── types/                   # TypeScript types
│   │   ├── utils/                   # Utilities
│   │   ├── styles/                  # Global styles
│   │   ├── assets/                  # Static assets
│   │   ├── App.tsx                  # Main App component
│   │   └── main.tsx                 # Entry point
│   ├── public/                      # Public assets
│   ├── cypress/                     # E2E tests
│   │   ├── e2e/                     # Test scenarios (6+ tests)
│   │   └── support/                 # Test utilities
│   ├── package.json                 # Dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── Dockerfile                  # Docker image
│   └── nginx.conf                  # Nginx configuration
│
├── docker-compose.yml              # Multi-container setup
├── .env.example                    # Environment template
├── README.md                       # This file
├── DEPLOYMENT.md                   # Deployment guide
├── DOCKER_QUICKSTART.md           # Docker quick start
├── SECURITY_CHECKLIST.md          # Security checklist
└── promt.md                       # Task list

```

## 🔌 API Documentation

### Base URL
- Development: `http://localhost:8081/api/v1`
- Production: Configured via `VITE_API_URL`

### Main Endpoints

**Authentication**
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token

**Products**
- `GET /products` - List products (paginated)
- `POST /products` - Create product
- `GET /products/{id}` - Get product detail
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

**Recipes**
- `GET /products/{id}/recipes` - List recipes
- `POST /products/{id}/recipes` - Save recipe
- `PUT /products/{id}/recipes/{recipeId}/activate` - Activate recipe

**Categories, Ingredients, Units, Orders, Production, CashFlow**
- Similar CRUD endpoints available

**Dashboard**
- `GET /dashboard/metrics` - Business metrics

### Authentication
Semua endpoint (kecuali login) memerlukan JWT token:
```
Authorization: Bearer <token>
```

### Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## 🚀 Deployment

### Opsi 1: Docker Compose (Recommended)
Lihat [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)

### Opsi 2: Manual Deployment
Lihat [DEPLOYMENT.md](./DEPLOYMENT.md)

### Checklist Deployment
1. Baca [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)
2. Setup environment variables (.env)
3. Run database migrations (otomatis via Flyway)
4. Configure HTTPS & CORS
5. Setup monitoring & logging
6. Configure backups

## 🧪 Testing

### Unit Tests
```bash
# Backend
cd backend
mvn test

# Frontend
cd frontend
npm test
```

### Integration Tests
```bash
cd backend
mvn integration-test
```

### E2E Tests (Cypress)
```bash
cd frontend
npm run cypress:open
# atau
npm run cypress:run
```

### Available E2E Tests
1. Category setup
2. Ingredient setup
3. Product recipe
4. Production flow
5. Order flow
6. Cashflow verification
7. Complete business flow

## 📊 Database Schema

Database menggunakan PostgreSQL dengan 15 migrations:
- V1: Initial tables (users, categories, ingredients, etc.)
- V2: Refresh tokens untuk JWT
- V3: Default user setup
- V4-V5: Admin configuration
- V6: Expired date tracking
- V7-V9: Unit conversions & recipes
- V10: Order items
- V11-V12: Unit management
- V13-V14: Multi-tenancy
- V15: COGS tracking

Lihat `backend/src/main/resources/db/migration/` untuk details.

## 🆘 Troubleshooting

### Backend tidak jalan
```bash
# Check logs
docker-compose logs backend

# Verify environment
echo $DB_PASSWORD
echo $JWT_SECRET

# Restart
docker-compose restart backend
```

### Database connection error
```bash
# Verify DB running
docker-compose ps db

# Check credentials in .env
docker-compose exec db psql -U postgres -d soom_db
```

### Frontend tidak load
```bash
# Check API URL
# Browser console -> Network tab
# Verify VITE_API_URL in .env

# Rebuild
docker-compose rebuild frontend
docker-compose restart frontend
```

### Pagination tidak bekerja
- ✅ Fixed in latest version (page calculation from first/rows)

### Card layout tidak tampil
- ✅ Implemented in ProductPage and RecipeHistoryPage

## 📝 Recent Updates

### Task 1: Cleanup ✅
- Removed unused SVG assets (react.svg, vite.svg)
- Removed corrupted migration file (double .sql extension)
- Fixed typo: Healthontroller.java → HealthController.java

### Task 3: Pagination Fix ✅
- Fixed pagination bug di 8 pages
- Issue: `event.page` undefined
- Solution: Calculate page = Math.floor(first / rows)

### Task 4: Card-based UI ✅
- Created ProductCard component
- Created RecipeCard component
- Updated ProductPage ke card grid layout
- ProductRecipeHistoryPage sudah menggunakan cards

### Task 5: Deployment Prep ✅
- Buat .env.example untuk environment configuration
- Dokumentasi DEPLOYMENT.md
- DOCKER_QUICKSTART.md untuk quick start
- SECURITY_CHECKLIST.md untuk security review

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

## 📄 License

[Your License Here]

## 📧 Support

Untuk pertanyaan atau issues:
1. Check documentation files
2. Review logs
3. Check GitHub issues

---

**Last Updated**: 2026-05-22  
**Version**: 1.0.0  
**Status**: Production Ready (with deployment guidelines)
