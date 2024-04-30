# Nest Microservice Template

This repository contains a template for creating microservices using NestJS. It's designed to provide a structured
foundation for developing scalable, maintainable microservices.

## Table of Contents

- [Getting Started](#getting-started)
- [Services](#services)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Microservices Architecture**: Utilizes NestJS for building scalable microservices.
- **Database Integration**: Supports PostgreSQL and MongoDB for data storage.
- **ORMs and ODMs**: Includes TypeORM & Prisma for PostgreSQL and Mongoose for MongoDB.
- **File Storage**: Utilizes MinIO for file storage in the `file-service`.
- **Authentication**: Implements Passport for authentication in the `auth-service`.
- **Authorization**: Utilizes Redis for managing role permissions across all services.
- **Email Service**: Supports SMTP for sending emails.
- **Docker Support**: Comes with Docker support for easy deployment.
- **Environment Configuration**: Supports `.env` files for easy environment configuration.
- **Health Checks**: Includes health check endpoints for monitoring service health.

## Services Overview

### auth-service

- **Technologies**: PostgreSQL, TypeORM, Passport, Redis (for refresh tokens)
- **Description**: Handles authentication and authorization, with Redis for managing refresh tokens..

### file-service

- **Technologies**: MongoDB, Mongoose, MinIO
- **Description**: Manages file storage and retrieval.

### user-service

- **Technologies**: PostgreSQL, Prisma
- **Description**: Manages user data and profiles.

### email-service

- **Technologies**: SMTP
- **Description**: Manages email sending functionality.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing
purposes.

### Prerequisites

- Node.js (v14.x or higher)
- NestJS CLI
- PostgreSQL
- MongoDB
- Redis
- MinIO
- Docker (optional, for containerization)

### Installation

1. Clone the repository:
   git clone https://github.com/samb2/nest-microservice-template.git
2. Navigate to the project directory:
   cd nest-microservice-template
3. Install dependencies:
   npm install

## Services

The template includes several microservices:

- `auth-service`: Handles authentication and authorization.
- `email-service`: Manages email sending functionality.
- `file-service`: Provides file storage and retrieval.
- `user-service`: Manages user data and profiles.

## Configuration

Before running the application, you need to configure the environment variables. Copy the `.env.example` file to `.env`
and update the values as needed:

```
cp .env.example .env.development
cp .env.example .env.production
cp .env.example .env.test
```

## Running the Application

To start the application, run:

```
npm run start
```

For development, you can use:

```
npm run start:dev
```

### Docker

If you prefer to run the application in Docker, you can use the provided `compose.yml` file:

```
docker-compose up
```

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) before getting started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.