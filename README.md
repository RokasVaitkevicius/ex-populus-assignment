# Lawn Area Estimator

A web application that helps users estimate the lawn area of a property using aerial imagery and computer vision techniques.

## Features

- Address search and geocoding
- Interactive map with aerial imagery
- Automated lawn detection and area calculation
- Square footage and square meter measurements
- Visual representation of detected lawn areas

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions
- **Maps & Geocoding**: Bing Maps API
- **Image Processing**: Sharp.js

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ex-populus-assignment.git
cd ex-populus-assignment
```

2. Install dependencies:

```bash
pnpm install
```

3. Setup environment variables:

```bash
cp .env.example .env.local
```

4. Add your Bing Maps API key to the `.env.local` file:

```
NEXT_PUBLIC_BING_MAPS_KEY=your_public_key_here
BING_MAPS_API_KEY=your_server_key_here
```

5. Run the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## API Keys

### Bing Maps

This application uses Bing Maps for aerial imagery, geocoding, and address autocomplete. To get your own Bing Maps API key:

1. Visit the [Bing Maps Dev Center](https://www.bingmapsportal.com/)
2. Create an account or sign in
3. Create a new key in the "My Account" -> "Keys" section
4. Select "Website" as the application type
5. Use the same key for both environment variables in your `.env.local` file

## Lawn Detection Algorithm

The application uses a color-based detection algorithm to identify lawn areas in aerial imagery:

1. The app fetches an aerial image from Bing Maps API
2. Each pixel is converted from RGB to HSV color space
3. Pixels are classified as "lawn" if they meet specific green color criteria:
   - Hue between 40° and 200° (green spectrum)
   - Sufficient saturation and brightness values
   - Green channel dominance compared to red and blue

The algorithm then:

- Counts the green pixels
- Calculates the percentage of green coverage
- Converts pixel count to real-world area using the map's zoom level and latitude

### Limitations

- Weather conditions, shadows, and seasonal changes can affect detection accuracy
- Similar green features like trees or shrubs may be incorrectly classified as lawn
- Very dry or dormant lawns might not be detected
