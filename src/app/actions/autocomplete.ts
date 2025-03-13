"use server"

import axios from "axios"

interface BingAddress {
  formattedAddress?: string
  addressLine?: string
  locality?: string
  adminDistrict?: string
  countryRegion?: string
  postalCode?: string
}

interface BingPoint {
  type: string
  coordinates: [number, number]
}

interface BingSuggestion {
  __type: string
  name: string
  address: BingAddress
  point?: BingPoint
  entityType?: string
}

interface BingAutosuggestResource {
  __type: string
  value: BingSuggestion[]
}

interface BingResourceSet {
  estimatedTotal: number
  resources: BingAutosuggestResource[]
}

interface BingAutosuggestResponse {
  authenticationResultCode: string
  brandLogoUri: string
  copyright: string
  resourceSets: BingResourceSet[]
  statusCode: number
  statusDescription: string
  traceId: string
}

export const getAddressSuggestions = async (query: string) => {
  if (!query) {
    throw new Error("Query parameter is required")
  }

  const BING_MAPS_API_KEY = process.env.BING_MAPS_API_KEY

  if (!BING_MAPS_API_KEY) {
    console.error("Bing Maps API key not configured")
    throw new Error("Server configuration error")
  }

  try {
    const response = await axios.get<BingAutosuggestResponse>(
      `https://dev.virtualearth.net/REST/v1/Autosuggest`,
      {
        params: {
          query: query,
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
      return data.resourceSets[0].resources[0].value.map(
        (suggestion: BingSuggestion) => ({
          address:
            suggestion.address.formattedAddress ||
            suggestion.address.addressLine ||
            suggestion.name,
          latitude: suggestion.point?.coordinates?.[0],
          longitude: suggestion.point?.coordinates?.[1],
        })
      )
    } else {
      return []
    }
  } catch (error) {
    console.error("Autocomplete error:", error)
    throw new Error("Failed to get address suggestions")
  }
}
