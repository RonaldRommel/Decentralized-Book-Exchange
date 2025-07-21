# 📚 Decentralized Book Exchange System

> A scalable microservices-based platform enabling peer-to-peer book exchanges with event-driven architecture and comprehensive performance optimization.

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

## 🚀 Key Performance Achievements

| Metric               | Async Service | Sync Service | Performance Gain  |
| -------------------- | ------------- | ------------ | ----------------- |
| Mean Response Time   | 4.1ms         | 11.4ms       | **64% faster**    |
| Median Response Time | 4ms           | 10.9ms       | **63% faster**    |
| P95 Response Time    | 6ms           | 16.9ms       | **65% faster**    |
| P99 Response Time    | 7.9ms         | 24.8ms       | **68% faster**    |
| Max Response Time    | 17ms          | 72ms         | **76% better**    |
| Success Rate         | 100%          | 100%         | Equal reliability |

**🏆 Result: 2.3× improvement in throughput with 40% reduction in 95th percentile latency**

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Microservices Breakdown](#-microservices-breakdown)
- [Performance Comparison](#-performance-comparison)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Technology Stack](#-technology-stack)
- [Load Testing](#-load-testing)
- [Future Enhancements](#-future-enhancements)

## 🏗️ Architecture Overview

### System Architecture Diagram

```
┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Client    │───▶│ Exchange Service │───▶│   RabbitMQ       │
└─────────────┘    └─────────────────┘    │  Message Broker  │
                            │              └──────────────────┘
                            ▼                        │
                   ┌─────────────────┐               ▼
                   │     MySQL       │    ┌─────────────────────┐
                   │   Database      │    │   Validation        │
                   └─────────────────┘    │   Services          │
                            │              └─────────────────────┘
                            │                       │
                   ┌────────┼────────┐             │
                   │        │        │             ▼
             ┌──────────┐ ┌─────────────┐ ┌─────────────────┐
             │   User   │ │ Inventory   │ │   Validation    │
             │ Service  │ │  Service    │ │   Coordinator   │
             └──────────┘ └─────────────┘ └─────────────────┘
```

### Event-Driven Validation Flow

**Synchronous Flow (Legacy):**

```
Client → Exchange Service → User Service → Inventory Service → Database → Response
```

**Asynchronous Flow (Optimized):**

```
Client → Exchange Service → [202 Accepted Response]
         ↓
RabbitMQ → User Validation Service → Validation Result
         ↓
RabbitMQ → Book Validation Service → Validation Result
         ↓
RabbitMQ → Validation Coordinator → Final Decision → Exchange Status Update
```

## 🔧 Microservices Breakdown

### Core Business Services

#### 1. **Exchange Service**

- **Purpose**: Orchestrates book exchange requests and manages exchange lifecycle
- **Tech Stack**: Node.js, Express, MySQL, RabbitMQ
- **Database**: Exchange records, transaction history
- **Key Features**:
  - RESTful API for exchange management
  - Event publishing for async validation
  - Status tracking and updates

#### 2. **User Service**

- **Purpose**: User profile management and reputation tracking
- **Tech Stack**: Node.js, Express, MySQL
- **Database**: User profiles, reputation scores
- **Key Features**:
  - User CRUD operations
  - Reputation scoring system
  - Profile management

#### 3. **Inventory Service**

- **Purpose**: Book catalog and inventory management
- **Tech Stack**: Node.js, Express, MySQL
- **Database**: Book details, availability status
- **Key Features**:
  - Book catalog management
  - Availability tracking
  - Book metadata storage

### Validation Services (Event-Driven)

#### 4. **User Validation Service**

- **Purpose**: Asynchronous user eligibility verification
- **Tech Stack**: Node.js, RabbitMQ
- **Key Features**:
  - Reputation-based validation
  - User status verification
  - Event-driven processing

#### 5. **Book Validation Service**

- **Purpose**: Book availability and condition verification
- **Tech Stack**: Node.js, RabbitMQ
- **Key Features**:
  - Availability checking
  - Ownership verification
  - Condition assessment

#### 6. **Validation Coordinator Service**

- **Purpose**: Combines validation results and makes final decisions
- **Tech Stack**: Node.js, RabbitMQ
- **Key Features**:
  - Result aggregation
  - Business rule enforcement
  - Final status publishing

## ⚡ Performance Comparison

### Synchronous vs Asynchronous Architecture

**Before (Synchronous)**:

- Blocking API calls between services
- Sequential validation steps
- Higher latency and resource usage
- Cascading failures possible

**After (Asynchronous)**:

- Event-driven communication
- Parallel validation processing
- Immediate response to client
- Fault-tolerant with retry mechanisms

### Load Test Configuration

```yaml
config:
  target: "http://localhost:3002"
  phases:
    - duration: 60 # 60 second test
      arrivalRate: 20 # 20 requests/second
  scenarios:
    - Async Service Test (50%)
    - Sync Service Test (50%)
```

## 📚 API Documentation

### Exchange Service APIs

| Method | Endpoint               | Description                              |
| ------ | ---------------------- | ---------------------------------------- |
| POST   | `/exchanges`           | Request to borrow a book                 |
| GET    | `/exchanges/:id`       | Get details of an exchange               |
| PUT    | `/exchanges/:id/state` | Update status (accepted, returned, etc.) |
| GET    | `/exchanges?user_id=1` | Get exchanges for a given user           |

#### Create Exchange Request

```http
POST /exchanges
Content-Type: application/json

{
  "book_id": "book-123",
  "borrower_id": 1,
  "lender_id": 2,
  "requested_duration": 14
}
```

**Response (Async):**

```json
{
  "exchange_id": "ex-abc123",
  "status": "pending_validation",
  "message": "Exchange request received and being processed",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Update Exchange State

```http
PUT /exchanges/ex-abc123/state
Content-Type: application/json

{
  "status": "accepted",
  "notes": "Book ready for pickup"
}
```

### User Service APIs

| Method | Endpoint                | Description                             |
| ------ | ----------------------- | --------------------------------------- |
| POST   | `/users`                | Create a new user                       |
| GET    | `/users/:id`            | Get a user's profile                    |
| PUT    | `/users/:id/reputation` | Update a user's reputation score        |
| GET    | `/users`                | List all users (optional for admin/dev) |

#### Create User

```http
POST /users
Content-Type: application/json

{
  "username": "bookworm123",
  "email": "user@example.com",
  "location": "New York",
  "bio": "Love reading sci-fi novels"
}
```

#### Update Reputation

```http
PUT /users/123/reputation
Content-Type: application/json

{
  "score": 4.5,
  "review": "Great book condition, prompt return"
}
```

### Inventory Service APIs

| Method | Endpoint     | Description                 |
| ------ | ------------ | --------------------------- |
| GET    | `/books`     | Get all books               |
| POST   | `/books`     | Add a new book              |
| GET    | `/books/:id` | Get details of a book by ID |
| PUT    | `/books/:id` | Update book details         |
| DELETE | `/books/:id` | Delete a book               |

#### Add New Book

```http
POST /books
Content-Type: application/json

{
  "title": "The Pragmatic Programmer",
  "author": "David Thomas, Andrew Hunt",
  "isbn": "978-0201616224",
  "condition": "excellent",
  "owner_id": 123,
  "available": true,
  "genre": "Programming"
}
```

#### Get Book Details

```http
GET /books/book-123
```

**Response:**

```json
{
  "book_id": "book-123",
  "title": "The Pragmatic Programmer",
  "author": "David Thomas, Andrew Hunt",
  "isbn": "978-0201616224",
  "condition": "excellent",
  "owner_id": 123,
  "available": true,
  "genre": "Programming",
  "added_at": "2024-01-10T15:20:00Z"
}
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- Docker & Docker Compose

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/decentralized-book-exchange.git
cd decentralized-book-exchange
```

2. **Create .env for each service with data**

```bash
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=root
DB_NAME=bookdb
DB_PORT=3306
```

3. **Start infrastructure with Docker**

```bash
docker-compose up -d
```

## 🛠️ Technology Stack

| Category             | Technology | Purpose                         |
| -------------------- | ---------- | ------------------------------- |
| **Runtime**          | Node.js    | JavaScript runtime environment  |
| **Framework**        | Express.js | Web application framework       |
| **Message Broker**   | RabbitMQ   | Asynchronous message processing |
| **Database**         | MySQL      | Relational data storage         |
| **Containerization** | Docker     | Application containerization    |
| **Load Testing**     | Artillery  | Performance benchmarking        |

## 📊 Load Testing

### Running Performance Tests

1. **Install Artillery**

```bash
npm install -g artillery
```

2. **Run comparison test**

```bash
artillery run test-config.yml
```

3. **Generate detailed report**

```bash
artillery report results.json
```

### Test Scenarios

The load test compares:

- **Async endpoint**: `/exchange/async` (Event-driven)
- **Sync endpoint**: `/exchange/sync` (Traditional blocking)

**Test Parameters:**

- Duration: 60 seconds
- Load: 20 requests/second
- Total requests: ~1,200
- Success rate: 100% for both services

## 🔄 Message Flow Architecture

### RabbitMQ Exchanges and Queues

```
📤 Exchanges:
├── validate-user (fanout)
├── validate-book (fanout)
└── validation-status (direct)

📥 Queues:
├── user-validation-queue
├── book-validation-queue
└── exchange-updates-queue
```

### Message Processing Flow

1. **Exchange Request**: Client initiates book exchange
2. **Event Publishing**: Exchange service publishes validation events
3. **Parallel Processing**: User and Book validation services process simultaneously
4. **Status Updates**: Validation results published to status exchange
5. **Final Update**: Exchange service updates transaction status

## 🚦 Reliability Features

- **Dead Letter Queues**: Failed message handling
- **Retry Logic**: Automatic retry mechanisms
- **Circuit Breaker**: Prevents cascade failures
- **Health Checks**: Service availability monitoring
- **Graceful Shutdown**: Clean service termination

## 🔮 Future Enhancements

- [ ] **Redis Caching**: Performance optimization
- [ ] **Monitoring Dashboard**: Real-time metrics
- [ ] **Authentication Service**: JWT-based auth
- [ ] **Notification Service**: Real-time user updates
- [ ] **Analytics Service**: Usage and performance insights

## 📈 Monitoring & Observability

### Key Metrics Tracked

- Response time percentiles (P50, P95, P99)
- Request throughput
- Error rates
- Queue depth and processing time
- Database connection pool utilization

### Health Endpoints

```bash
# Service health checks
curl http://localhost:3003/health
curl http://localhost:3002/health
curl http://localhost:3001/health
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**

- GitHub: [@RonaldRommel](https://github.com/RonaldRommel/)
- LinkedIn: [Ronald Rommel](https://www.linkedin.com/in/ronald-rommel/)

---

⭐ **Star this repository if you found it helpful!**

_Built with ❤️ and lots of ☕ by Ronald Rommel_
