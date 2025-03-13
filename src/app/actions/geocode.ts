"use server"

import axios from "axios"

interface GeocodeResult {
  lat: number
  lng: number
  address: string
}

export const geocodeAddress = async (
  address: string
): Promise<GeocodeResult> => {
  if (!address) {
    throw new Error("Address is required")
  }

  const BING_MAPS_API_KEY = process.env.BING_MAPS_API_KEY

  if (!BING_MAPS_API_KEY) {
    console.error("Bing Maps API key not configured")
    throw new Error("Server configuration error")
  }

  try {
    const response = await axios.get(
      `https://dev.virtualearth.net/REST/v1/Locations`,
      {
        params: {
          query: address,
          key: BING_MAPS_API_KEY,
        },
      }
    )

    const data = response.data

    if (
      data.resourceSets &&
      data.resourceSets.length > 0 &&
      data.resourceSets[0].resources &&
      data.resourceSets[0].resources.length > 0
    ) {
      const location = data.resourceSets[0].resources[0]
      const coordinates = location.point.coordinates
      const formattedAddress = location.address.formattedAddress

      return {
        lat: coordinates[0],
        lng: coordinates[1],
        address: formattedAddress,
      }
    } else {
      throw new Error("Address not found")
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    throw new Error("Failed to geocode address")
  }
}
