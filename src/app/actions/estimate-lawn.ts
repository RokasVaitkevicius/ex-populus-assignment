"use server"

import axios from "axios"
import sharp from "sharp"

interface LawnEstimationParams {
  coordinates: {
    lat: number
    lng: number
  }
  zoom?: number
  address?: string
  mapWidth?: number
  mapHeight?: number
  mapBounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

const rgbToHsv = (
  r: number,
  g: number,
  b: number
): [number, number, number] => {
  const rPrime = r / 255
  const gPrime = g / 255
  const bPrime = b / 255

  const cMax = Math.max(rPrime, gPrime, bPrime)
  const cMin = Math.min(rPrime, gPrime, bPrime)
  const delta = cMax - cMin

  let hue = 0
  if (delta !== 0) {
    if (cMax === rPrime) {
      hue = 60 * (((gPrime - bPrime) / delta) % 6)
    } else if (cMax === gPrime) {
      hue = 60 * ((bPrime - rPrime) / delta + 2)
    } else {
      hue = 60 * ((rPrime - gPrime) / delta + 4)
    }
  }

  if (hue < 0) {
    hue += 360
  }

  const saturation = cMax === 0 ? 0 : (delta / cMax) * 100
  const value = cMax * 100

  return [hue, saturation, value]
}

const getStaticMapImage = (
  lat: number,
  lng: number,
  zoom = 18,
  width = 600,
  height = 400,
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
): string => {
  const BING_MAPS_KEY = process.env.BING_MAPS_API_KEY || ""

  if (bounds) {
    const boundingBox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
    return `https://dev.virtualearth.net/REST/v1/Imagery/Map/Aerial?mapArea=${boundingBox}&mapSize=${width},${height}&format=png&key=${BING_MAPS_KEY}`
  }

  const validZoom = Math.max(1, Math.min(21, Math.round(zoom)))
  return `https://dev.virtualearth.net/REST/v1/Imagery/Map/Aerial/${lat},${lng}/${validZoom}?mapSize=${width},${height}&format=png&key=${BING_MAPS_KEY}`
}

const estimateLawnArea = async (
  imageUrl: string,
  zoom = 18,
  latitude = 0,
  mapWidth = 600,
  mapHeight = 400
) => {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
    const imageBuffer = Buffer.from(response.data, "binary")

    const { data, info } = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { width, height, channels } = info
    let greenPixels = 0
    const totalPixels = width * height
    const detectedPixels: { x: number; y: number }[] = []

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const [hue, sat, val] = rgbToHsv(r, g, b)

      // Green color detection criteria
      const hueIsGreen = hue >= 40 && hue <= 200
      const satIsEnough = sat > 5
      const valIsEnough = val > 5 && val < 90
      const greenDominance = g > r * 0.9 && g > b * 0.9

      if (hueIsGreen && satIsEnough && valIsEnough && greenDominance) {
        greenPixels++

        const pixelIndex = i / channels
        const x = pixelIndex % width
        const y = Math.floor(pixelIndex / width)

        detectedPixels.push({
          x: x / width,
          y: y / height,
        })
      }
    }

    const greenFraction = greenPixels / totalPixels

    // At zoom level 18, each pixel is approximately 0.596 meters at the equator
    const baseMetersPerPixelAtZoom18 = 0.596
    const metersPerPixel = baseMetersPerPixelAtZoom18 * Math.pow(2, 18 - zoom)

    let latitudeAdjusted = metersPerPixel

    if (latitude !== 0) {
      const latitudeRadians = (latitude * Math.PI) / 180
      latitudeAdjusted = metersPerPixel / Math.cos(latitudeRadians)
    }

    const areaWidthMeters = mapWidth * latitudeAdjusted
    const areaHeightMeters = mapHeight * latitudeAdjusted
    const totalAreaSquareMeters = areaWidthMeters * areaHeightMeters

    const totalAreaSquareFeet = totalAreaSquareMeters * 10.764

    const estimatedLawnSquareFeet = totalAreaSquareFeet * greenFraction
    const estimatedLawnSquareMeters = estimatedLawnSquareFeet * 0.092903

    return {
      squareFeet: Math.round(estimatedLawnSquareFeet),
      squareMeters: Math.round(estimatedLawnSquareMeters),
      lawnCoverage: Math.min(100, Math.floor(greenFraction * 100)),
      imageUrl,
      detectedPixels,
    }
  } catch (error) {
    console.error("Error estimating lawn area:", error)
    throw new Error("Failed to estimate lawn area")
  }
}

export const estimateLawn = async (params: LawnEstimationParams) => {
  const {
    coordinates,
    zoom = 18,
    address,
    mapWidth = 600,
    mapHeight = 400,
    mapBounds,
  } = params

  if (
    !coordinates ||
    typeof coordinates.lat !== "number" ||
    typeof coordinates.lng !== "number"
  ) {
    throw new Error("Valid coordinates are required")
  }

  const { lat, lng } = coordinates

  const imageUrl = getStaticMapImage(
    lat,
    lng,
    zoom,
    mapWidth,
    mapHeight,
    mapBounds
  )

  const { squareFeet, lawnCoverage, detectedPixels } = await estimateLawnArea(
    imageUrl,
    zoom,
    lat,
    mapWidth,
    mapHeight
  )

  const zoomFactor = Math.pow(2, 18 - zoom)
  const adjustedSquareFeet = squareFeet * zoomFactor
  const adjustedSquareMeters = adjustedSquareFeet * 0.092903

  return {
    address: address || `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
    squareFeet: Math.round(adjustedSquareFeet),
    squareMeters: Math.round(adjustedSquareMeters),
    lawnCoverage,
    imageUrl,
    detectedPixels,
    zoom,
  }
}
