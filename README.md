# 🎣 Lishka - AI-Powered Fishing Assistant

A modern, AI-driven fishing application that helps anglers discover fish species, get fishing advice, track weather conditions, and manage their fishing gear. Built with React, TypeScript, and powered by OpenAI's GPT models.

## ✨ Features

### 🐟 AI-Powered Fishing Assistant

- **Intelligent Chat Interface**: Ask questions about fishing techniques, fish species, and locations
- **Fish Species Database**: Comprehensive information including scientific names, habitats, difficulty levels, and seasonal availability
- **Location-Aware Recommendations**: Get fishing advice tailored to your specific location
- **Image Analysis**: Upload fish photos for species identification and analysis

### 🌤️ Weather & Marine Intelligence

- **Real-time Weather Data**: Current conditions, forecasts, and marine weather
- **Fishing Conditions**: Tide information, swell data, and optimal fishing times
- **Location-based Insights**: Weather data specific to your fishing location

### 🎒 Gear Management

- **Personal Gear Library**: Track and organize your fishing equipment
- **Gear Recommendations**: AI-suggested equipment based on fishing conditions
- **Photo Management**: Store and categorize gear photos with metadata

### 📱 Modern User Experience

- **Responsive Design**: Optimized for mobile and desktop
- **Dark/Light Themes**: Customizable appearance
- **Offline Capabilities**: Core features work without internet connection
- **Progressive Web App**: Install as a native app on mobile devices

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations

### Backend & Services

- **Supabase** for authentication, database, real-time subscriptions, and edge functions
- **OpenAI GPT** for AI-powered responses
- **Vercel Blob** for image storage
- **React Query** for data fetching and caching

### Development Tools

- **ESLint** with TypeScript rules
- **Prettier** for code formatting
- **Tempo DevTools** for development assistance
- **Storybook** for component development

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Vercel account (for blob storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd lishka.app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_VERCEL_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   VITE_TEMPO=1
   ```

4. **Database Setup**

   ```bash
   # Generate Supabase types
   npm run types:supabase

   # Run database migrations
   # (Check supabase/migrations/ folder for SQL files)
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## 🗄️ Supabase Setup & Deployment

### Initial Supabase Configuration

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Choose your organization and region
   - Wait for the project to be provisioned

2. **Install Supabase CLI**

   ```bash
   npm install -g supabase
   ```

3. **Login to Supabase**

   ```bash
   supabase login
   ```

4. **Link Your Project**

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

5. **Environment Variables**
   Add these to your `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Database Migrations

1. **Create a New Migration**

   ```bash
   supabase migration new create_fish_catches_table
   ```

2. **Apply Migrations**

   ```bash
   supabase db push
   ```

3. **Reset Database (Development)**
   ```bash
   supabase db reset
   ```

### Edge Functions

1. **Create a New Function**

   ```bash
   supabase functions new function-name
   ```

2. **Function Structure**

   ```typescript
   // supabase/functions/function-name/index.ts
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

   serve(async (req) => {
     const { name } = await req.json();
     const data = {
       message: `Hello ${name}!`,
     };

     return new Response(JSON.stringify(data), {
       headers: { "Content-Type": "application/json" },
     });
   });
   ```

3. **Deploy Functions**

   ```bash
   # Deploy all functions
   supabase functions deploy

   # Deploy specific function
   supabase functions deploy function-name

   # e.g to deploy send-email function
   supabase functions deploy send-email --no-verify-jwt
   ```

4. **Function Invocation**
   ```typescript
   // In your React app
   const { data, error } = await supabase.functions.invoke("function-name", {
     body: { name: "World" },
   });
   ```

### Storage Buckets

1. **Create Storage Buckets**

   ```sql
   -- Run in Supabase SQL editor
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('fish-images', 'fish-images', true);

   INSERT INTO storage.buckets (id, name, public)
   VALUES ('gear-photos', 'gear-photos', true);
   ```

2. **Storage Policies**

   ```sql
   -- Allow authenticated users to upload images
   CREATE POLICY "Users can upload images" ON storage.objects
   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

   -- Allow public read access to fish images
   CREATE POLICY "Public read access to fish images" ON storage.objects
   FOR SELECT USING (bucket_id = 'fish-images');
   ```

### Row Level Security (RLS)

1. **Enable RLS on Tables**

   ```sql
   ALTER TABLE fish_catches ENABLE ROW LEVEL SECURITY;
   ```

2. **Create Policies**

   ```sql
   -- Users can only see their own catches
   CREATE POLICY "Users can view own catches" ON fish_catches
   FOR SELECT USING (auth.uid() = user_id);

   -- Users can insert their own catches
   CREATE POLICY "Users can insert own catches" ON fish_catches
   FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

### Local Development

1. **Start Local Supabase**

   ```bash
   supabase start
   ```

2. **Stop Local Supabase**

   ```bash
   supabase stop
   ```

3. **View Local Dashboard**
   - Open http://localhost:54323
   - Use the credentials from the CLI output

### Production Deployment

1. **Deploy Database Changes**

   ```bash
   supabase db push
   ```

2. **Deploy Edge Functions**

   ```bash
   supabase functions deploy
   ```

3. **Update Production Environment**
   - Update environment variables in your hosting platform
   - Ensure production Supabase project is linked

### Monitoring & Debugging

1. **View Function Logs**

   ```bash
   supabase functions logs function-name
   ```

2. **Database Logs**
   - Check Supabase Dashboard → Logs
   - Monitor query performance and errors

3. **Real-time Subscriptions**
   ```typescript
   // Subscribe to real-time changes
   const subscription = supabase
     .channel("fish_catches")
     .on(
       "postgres_changes",
       { event: "*", schema: "public", table: "fish_catches" },
       (payload) => console.log("Change received!", payload),
     )
     .subscribe();
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/            # Base UI components (buttons, forms, etc.)
│   ├── auth/          # Authentication components
│   └── skeletons/     # Loading state components
├── contexts/           # React contexts (auth, theme)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and services
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── stories/            # Storybook stories
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run ts:check` - TypeScript type checking
- `npm run types:supabase` - Generate Supabase types

## 🌐 Key Features Implementation

### AI Chat System

The app uses OpenAI's GPT models to provide intelligent fishing advice. Users can ask questions about:

- Fish species identification
- Fishing techniques and tips
- Location-specific advice
- Gear recommendations

### Weather Integration

Real-time weather data is fetched and displayed with:

- Current conditions
- Hourly and daily forecasts
- Marine weather (tides, swell)
- Fishing condition indicators

### Image Management

Users can upload and manage fishing-related images:

- Fish photos for identification
- Gear photos for inventory
- Location photos for reference
- AI-powered image analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support and questions:

- Check the FAQ page in the app
- Review the documentation
- Contact the development team

---

**Built with ❤️ for the fishing community**
