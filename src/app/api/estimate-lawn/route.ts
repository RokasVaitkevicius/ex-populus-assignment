import { NextResponse } from "next/server"
import axios from "axios"
import sharp from "sharp"

interface GeocodingResult {
  lat: number
  lng: number
  formatted_address: string
}

interface LawnEstimate {
  squareFeet: number
  squareMeters: number
  lawnCoverage: number
  imageUrl?: string
  detectedPixels?: { x: number; y: number }[]
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

const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  const MAPBOX_ACCESS_TOKEN =
    process.env.MAPBOX_ACCESS_TOKEN || "YOUR_MAPBOX_ACCESS_TOKEN"
  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json`,
      {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          limit: 1,
        },
      }
    )
    const result = response.data.features[0]
    if (!result) {
      throw new Error("No results found for the provided address.")
    }
    const [lng, lat] = result.geometry.coordinates
    const formatted = result.place_name
    return {
      lat,
      lng,
      formatted_address: formatted,
    }
  } catch (error) {
    console.error("Error geocoding address:", error)
    throw new Error("Failed to geocode address")
  }
}

const getStaticMapImage = async (lat: number, lng: number): Promise<string> => {
  const MAPBOX_ACCESS_TOKEN =
    process.env.MAPBOX_ACCESS_TOKEN || "YOUR_MAPBOX_ACCESS_TOKEN"
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},18/600x400?access_token=${MAPBOX_ACCESS_TOKEN}`
}

const estimateLawnArea = async (imageUrl: string): Promise<LawnEstimate> => {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
    const imageBuffer = Buffer.from(response.data, "binary")

    const { data, info } = await sharp(imageBuffer)
      .resize(300, 200)
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

      const hueIsGreen = hue >= 55 && hue <= 190
      const satIsEnough = sat > 10
      const valIsEnough = val > 5

      if (hueIsGreen && satIsEnough && valIsEnough) {
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
    const totalAreaSquareFeet = 556450
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

const getLawnEstimateFromAddress = async (
  address: string
): Promise<LawnEstimate & { address: string }> => {
  const geocodeResult = await geocodeAddress(address)
  const imageUrl = await getStaticMapImage(geocodeResult.lat, geocodeResult.lng)
  const estimate = await estimateLawnArea(imageUrl)
  return {
    ...estimate,
    address: geocodeResult.formatted_address,
  }
}

export const POST = async (request: Request) => {
  try {
    const { address, coordinates } = await request.json()
    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      )
    }

    let result

    if (coordinates && coordinates.lng && coordinates.lat) {
      console.log("HE")
      const imageUrl = await getStaticMapImage(coordinates.lat, coordinates.lng)
      const estimate = await estimateLawnArea(imageUrl)
      result = {
        ...estimate,
        address: address,
      }
    } else {
      result = await getLawnEstimateFromAddress(address)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error in POST /api/estimate-lawn:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
