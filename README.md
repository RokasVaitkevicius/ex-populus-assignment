# ex-populus-assignment

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then setup environment variables:

```bash
cp .env.example .env.local
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Bing maps

As map, autocomplete and geocoding service, Bing Maps is used. I've picked it just because it has good enough free tier. In order to get Bing api key you need to create a Bing Maps API key by visiting this [site](https://www.bingmapsportal.com/) and add it to the `.env.local` file.

## Lawn detection algorithm

It's a simple algorithm that checks if pixels are green enough. It's not perfect and can be improved by using machine learning or more advanced image processing techniques. But for the sake of this assignment, I've implemented a simple one.
