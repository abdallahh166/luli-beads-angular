# Luli Beads Angular Application

A modern, scalable Angular e-commerce application for Luli Beads, built with clean architecture principles and best practices.

## 🚀 Features

- **Modern Angular 20** with standalone components
- **NgRx State Management** for predictable state handling
- **Tailwind CSS** for utility-first styling
- **Material Design** components for consistent UI
- **Supabase Integration** for backend services
- **Comprehensive Testing** setup with Jasmine/Karma
- **ESLint & Prettier** for code quality
- **CI/CD Pipeline** with GitHub Actions
- **Error Handling** and logging services
- **Responsive Design** for all devices

## 🏗️ Architecture

The application follows clean architecture principles with clear separation of concerns:

```
src/
├── app/
│   ├── core/           # Core services, guards, interceptors
│   ├── shared/         # Shared components, pipes, directives
│   ├── pages/          # Feature pages
│   ├── store/          # NgRx state management
│   └── types/          # TypeScript interfaces and types
├── assets/             # Static assets
└── environments/       # Environment configurations
```

### Core Principles

- **Single Responsibility**: Each service/component has one clear purpose
- **Dependency Injection**: Proper use of Angular's DI system
- **State Management**: Centralized state with NgRx
- **Error Handling**: Consistent error handling across the application
- **Logging**: Comprehensive logging for debugging and monitoring
- **Testing**: High test coverage with proper mocking

## 🛠️ Technology Stack

- **Frontend**: Angular 20, TypeScript, RxJS
- **State Management**: NgRx Store, Effects, DevTools
- **Styling**: Tailwind CSS, Angular Material
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Testing**: Jasmine, Karma, Angular Testing Utilities
- **Code Quality**: ESLint, Prettier, Husky
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+ or yarn 1.22+
- Angular CLI 20+

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/luli-beads-angular.git
cd luli-beads-angular
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create environment files with your configuration:

```bash
# src/environments/environment.ts
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  },
  // ... other config
};
```

### 4. Start Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/` to view the application.

## 📜 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:staging` - Build for staging
- `npm run test` - Run unit tests
- `npm run test:ci` - Run tests in CI mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 🧪 Testing

The application includes comprehensive testing setup:

- **Unit Tests**: Component, service, and utility tests
- **Integration Tests**: Component integration tests
- **E2E Tests**: End-to-end testing (when configured)

Run tests with:

```bash
npm test                    # Watch mode
npm run test:ci           # Single run
npm run test:coverage     # With coverage report
```

## 🔧 Code Quality

### ESLint Configuration

The project uses ESLint with Angular-specific rules:

- Component and directive naming conventions
- Template validation
- TypeScript best practices
- Angular-specific linting rules

### Prettier Configuration

Consistent code formatting with Prettier:

- 100 character line width
- Single quotes
- Trailing commas
- 2-space indentation

### Pre-commit Hooks

Husky and lint-staged ensure code quality:

- Automatic formatting on commit
- ESLint checks before commit
- Prettier formatting

## 🚀 Deployment

### Build Configurations

- **Development**: `npm run build`
- **Staging**: `npm run build:staging`
- **Production**: `npm run build:production`

### CI/CD Pipeline

GitHub Actions workflow includes:

- Automated testing
- Security scanning
- Build verification
- Deployment to staging/production

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Route guards
│   │   ├── services/        # Core services
│   │   └── interceptors/    # HTTP interceptors
│   ├── shared/
│   │   ├── components/      # Reusable components
│   │   ├── directives/      # Custom directives
│   │   └── pipes/           # Custom pipes
│   ├── pages/               # Feature pages
│   ├── store/               # NgRx store
│   │   ├── actions/         # Actions
│   │   ├── effects/         # Effects
│   │   ├── reducers/        # Reducers
│   │   └── selectors/       # Selectors
│   └── types/               # TypeScript interfaces
├── assets/                  # Static assets
├── environments/            # Environment configs
└── styles/                  # Global styles
```

## 🔒 Security

- **Input Validation**: Comprehensive form validation
- **XSS Protection**: Angular's built-in XSS protection
- **CSRF Protection**: HTTP-only cookies
- **Authentication**: Supabase Auth integration
- **Authorization**: Role-based access control

## 📊 Performance

- **Lazy Loading**: Route-based code splitting
- **OnPush Strategy**: Change detection optimization
- **Tree Shaking**: Unused code elimination
- **Bundle Optimization**: Angular CLI optimizations
- **Image Optimization**: Responsive images and lazy loading

## 🐛 Debugging

### Logging Service

Centralized logging with different levels:

```typescript
import { LoggingService } from './core/services/logging.service';

constructor(private logging: LoggingService) {}

this.logging.info('User logged in', 'AuthComponent');
this.logging.error('Login failed', 'AuthComponent', error);
```

### Error Handling

Consistent error handling across the application:

```typescript
import { ErrorHandlerService } from './core/services/error-handler.service';

constructor(private errorHandler: ErrorHandlerService) {}

try {
  // Your code
} catch (error) {
  this.errorHandler.handleError(error, 'ComponentName');
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Angular style guide
- Write comprehensive tests
- Use TypeScript strict mode
- Follow component naming conventions
- Add proper error handling
- Include logging for debugging

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes.

---

**Built with ❤️ using Angular and modern web technologies**
