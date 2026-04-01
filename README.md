# Pet Feeder App

A modern React web application for managing smart pet feeders. This app allows you to monitor, schedule, and control your pet's feeding remotely with a beautiful, intuitive interface.

## Features

- 🍽️ **Smart Feeding Control** - Dispense food remotely with custom portions
- 📹 **Live Video Feed** - Watch your pets eat in real-time
- 📊 **Analytics Dashboard** - Track feeding patterns and nutrition data
- 🔔 **Smart Notifications** - Get alerts for feeding times and low food levels
- ⚙️ **Device Settings** - Configure Wi-Fi, firmware updates, and preferences

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for smooth animations
- **shadcn/ui** for beautiful UI components
- **Recharts** for data visualization
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pet-feeder-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the app running.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
pet-feeder-app/
├── src/
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles
├── components/
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── SplashScreen.tsx  # Welcome screen
│   ├── OnboardingScreens.tsx # App introduction
│   ├── LoginScreen.tsx   # Authentication
│   ├── HomeDashboard.tsx # Main dashboard
│   ├── LiveFeedScreen.tsx # Video feed
│   ├── PetProfilesScreen.tsx # Pet management
│   ├── NotificationsScreen.tsx # Alerts
│   ├── SettingsScreen.tsx # App settings
│   └── AnalyticsScreen.tsx # Data visualization
├── styles/
│   └── globals.css       # Additional global styles
├── App.tsx               # Main app component
└── index.html           # HTML template
```

## Features Overview

### 🏠 Home Dashboard
- Live video feed preview
- Quick stats (last feeding, next scheduled, food remaining)
- Quick actions for scheduling and analytics
- Floating feed button for immediate dispensing

### 📹 Live Feed
- Real-time video streaming
- Pet detection with RFID tag recognition
- Recording and snapshot capabilities
- Audio controls

### 🐕 Pet Profiles
- Multiple pet management
- Individual feeding schedules
- Weight and food type tracking
- Feeding history charts

### 📊 Analytics
- Weekly feeding frequency charts
- Time distribution analysis
- 30-day consumption trends
- Exportable PDF reports

### 🔔 Notifications
- Real-time feeding alerts
- Low food reservoir warnings
- System updates and reminders
- Swipe-to-delete functionality

### ⚙️ Settings
- Wi-Fi and device configuration
- App preferences (notifications, dark mode)
- Support and help center
- Firmware updates

## Customization

### Colors
The app uses a consistent color palette defined in the Tailwind config:
- Primary: `#5C6BC0` (Indigo)
- Secondary: `#FFB74D` (Orange)
- Success: `#81C784` (Green)
- Info: `#64B5F6` (Blue)

### Adding New Features
1. Create new components in the `components/` directory
2. Add routing logic in `App.tsx`
3. Update the navigation in `HomeDashboard.tsx`

## Deployment

### Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist/` folder to Netlify

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
