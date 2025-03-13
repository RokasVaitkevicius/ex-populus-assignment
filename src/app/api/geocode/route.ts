import { NextResponse } from "next/server"
import axios from "axios"

export const POST = async (req: Request) => {
  try {
    const { address } = await req.json()

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      )
    }

    const BING_MAPS_API_KEY = process.env.BING_MAPS_API_KEY

    if (!BING_MAPS_API_KEY) {
      console.error("Bing Maps API key not configured")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

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

      return NextResponse.json({
        lat: coordinates[0],
        lng: coordinates[1],
        address: formattedAddress,
      })
    } else {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 }
    )
  }
}
