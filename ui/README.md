# Twin Keys UI

Anti-coercion protection for self-custody wallets. Create and maintain realistic twin wallets that mirror real on-chain activity.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 + DaisyUI 5 (custom "twinkeys" theme)
- **Routing**: React Router v7
- **State Management**: TanStack Query v5
- **Icons**: Lucide React
- **Code Formatting**: Prettier

## Project Structure

```
src/
├── components/
│   ├── layout/      # Header, Footer, Layout
│   ├── ui/          # Reusable UI components (Button, Input, Card)
│   └── features/    # Feature-specific components
├── pages/           # Home, Login, Dashboard
├── hooks/           # Custom React hooks
├── styles/          # CSS and style utilities
├── utils/           # Helper functions
├── constants/       # Design tokens, configuration
└── types/           # TypeScript type definitions
```

## Development

### Install Dependencies

```bash
bun install
```

### Start Development Server

```bash
bun dev
```

The server will start at `http://localhost:3000` with hot module reloading enabled.

### Build for Production

```bash
bun run build
```

### Start Production Server

```bash
bun start
```

## Code Formatting

Format code with Prettier:

```bash
bun run format
```

Check formatting:

```bash
bun run format:check
```

## Design System

### Colors

- **Primary**: Institutional Blue (#305cde)
- **Text**: High contrast for readability
- **Backgrounds**: White and off-white

### Typography

- **Body Font**: Sofia Sans
- **Display Font**: Tektur (for headings and emphasis)

### Design Principles

- Sharp border radius (0-4px)
- Trustworthy, institutional aesthetic
- Sleek and modern with retro touches
- Generous use of dither effects and ASCII art
- Irregular bento box / masonry grids

### Button Variants

- **Primary**: Filled blue background, white text
- **Secondary**: Transparent with blue border

## Routes

- `/` - Home page with hero section and feature grid
- `/login` - Login page with email and wallet connect
- `/dashboard` - Dashboard for managing twin wallets

## Custom DaisyUI Theme

The project uses a custom DaisyUI theme called "twinkeys" with institutional blue as the primary color and sharp border radii. All theme variables are defined in `src/index.css`.

## Development Guidelines

See `.cursorrules` for detailed development guidelines including:

- Component structure and reusability
- Code style and TypeScript usage
- DaisyUI integration best practices
- Modular file organization

## Future Enhancements

- Full Solana wallet adapter integration (Phantom, Solflare, etc.)
- WalletConnect integration for login
- Twin wallet creation and management features
- Real-time blockchain monitoring
- Enhanced dither effect backgrounds

---

Built with [Bun](https://bun.sh)
