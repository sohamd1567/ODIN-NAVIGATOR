# ODIN - Optimal Dynamic Interplanetary Navigator

## Overview

ODIN is a futuristic space mission control application that provides hazard analysis and trajectory optimization for interplanetary navigation. The application features a modern space-themed interface with glassmorphism design, animated visualizations, and real-time decision logging. Users can input various space hazards (solar flares, debris, engine failures) and receive AI-powered navigation recommendations with crew-friendly explanations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + Vite**: Modern React application with Vite for fast development and building
- **TypeScript**: Full type safety across the application
- **Component Structure**: Modular design with dedicated components for each dashboard panel
  - `HazardInputPanel`: Handles hazard selection and analysis triggers
  - `DecisionLog`: Displays real-time JSON-like analysis logs with typewriter animations
  - `CrewSummary`: Shows user-friendly explanations with emojis and statistics
  - `TrajectoryVisualization`: SVG-based animated trajectory paths
  - `StarField`: Animated background particle system

### UI Framework and Styling
- **Tailwind CSS**: Utility-first styling with custom space-themed color palette
- **Shadcn/UI**: Component library providing consistent design system
- **Framer Motion**: Advanced animations and transitions throughout the interface
- **Custom CSS Variables**: Space-themed color system (cosmic blue, neon cyan, purple gradients)
- **Glassmorphism Design**: Translucent panels with frosted blur effects and neon glows

### State Management
- **React State**: Local component state for UI interactions and animations
- **TanStack Query**: Data fetching and caching (prepared for future API integration)
- **React Hook Form**: Form handling with Zod validation

### Backend Architecture
- **Express.js**: Node.js web server with TypeScript
- **Modular Route System**: Clean separation of API endpoints in `/server/routes.ts`
- **Error Handling**: Centralized error middleware with proper status codes
- **Development Middleware**: Request logging and response timing

### Database Layer
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Schema Definition**: Centralized schema in `/shared/schema.ts` for type consistency
- **Migration Support**: Database migrations managed through Drizzle Kit
- **Connection**: Neon Database serverless PostgreSQL integration

### Development and Build System
- **Monorepo Structure**: Shared types and utilities between client/server
- **Path Aliases**: Clean imports using `@/` for client and `@shared/` for shared code
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Development Tools**: Runtime error overlay, Cartographer integration for Replit

### Authentication and Storage
- **Memory Storage**: In-memory user storage for development (IStorage interface)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Extensible Design**: Interface-based storage allowing easy database integration

### Routing and Navigation
- **Wouter**: Lightweight client-side routing
- **Single Page Application**: Hash-based routing for seamless navigation
- **Not Found Handling**: Proper 404 page with user guidance

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Database ORM with type safety
- **express**: Node.js web application framework
- **react**: Frontend UI library
- **@vitejs/plugin-react**: Vite React integration

### UI and Animation Libraries
- **@radix-ui/***: Comprehensive component primitives for accessible UI
- **framer-motion**: Animation library for smooth transitions and effects
- **lucide-react**: Modern icon system
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for components

### Data Management
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Performant form library
- **@hookform/resolvers**: Validation resolvers for react-hook-form
- **zod**: TypeScript-first schema validation

### Development Tools
- **typescript**: Static type checking
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit integration tools

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional class name utility
- **nanoid**: Secure URL-friendly unique ID generator
- **wouter**: Minimalist client-side routing