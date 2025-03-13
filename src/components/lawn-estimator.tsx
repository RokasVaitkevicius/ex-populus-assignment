"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ComboboxInput } from "@/components/combobox-input"
import { useForm, Controller } from "react-hook-form"
import axios from "axios"
import { BingMap } from "./bing-map"
import { LawnVisualizer } from "./lawn-visualizer"

interface FormData {
  address: string
}

interface EstimateResult {
  address: string
  squareFeet: number
  squareMeters: number
  lawnCoverage: number
  imageUrl?: string
  detectedPixels?: { x: number; y: number }[]
  zoom?: number
}

export const LawnEstimator = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [_, setMapReady] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post("/api/geocode", data)
      const { lat, lng } = response.data
      setLocation({ lat, lng })
    } catch (err) {
      console.error(err)
      setError("Failed to find the address. Please check and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionSelected = (suggestion: {
    address: string
    latitude?: number
    longitude?: number
  }) => {
    setValue("address", suggestion.address)

    if (suggestion.latitude && suggestion.longitude) {
      setLocation({
        lat: suggestion.latitude,
        lng: suggestion.longitude,
      })
    }
  }

  const handlePointSelected = async (
    lat: number,
    lng: number,
    zoom: number,
    mapWidth?: number,
    mapHeight?: number,
    mapBounds?: {
      north: number
      south: number
      east: number
      west: number
    }
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post("/api/estimate-lawn", {
        coordinates: { lat, lng },
        zoom: zoom,
        mapWidth: mapWidth,
        mapHeight: mapHeight,
        mapBounds: mapBounds,
      })
      setResult(response.data)
    } catch (err) {
      console.error(err)
      setError("Failed to analyze lawn area. Please try a different location.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Estimate Lawn Area</CardTitle>
        <CardDescription>
          Enter a property address, then click on a specific point to analyze
          its lawn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-4">
          <div className="space-y-2">
            <Controller
              name="address"
              control={control}
              rules={{ required: "Address is required" }}
              render={({ field }) => (
                <ComboboxInput
                  {...field}
                  placeholder="Enter property address (e.g., 123 Main St, City, State)"
                  className="w-full"
                  onSuggestionSelected={handleSuggestionSelected}
                />
              )}
            />
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Find Location"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md mb-4">
          <p className="text-sm font-medium">How to use:</p>
          <ol className="text-sm list-decimal pl-5 mt-1 space-y-1">
            <li>
              Enter an address to center the map and click "Find Location"
            </li>
            <li>Adjust the selected viewport on the map</li>
            <li>Click "Analyze Selected Point" to calculate the lawn area</li>
          </ol>
        </div>

        <div className="h-[400px] w-full rounded-md overflow-hidden border border-gray-200">
          <BingMap
            initialLocation={location}
            onMapReady={() => setMapReady(true)}
            onLocationSelected={handlePointSelected}
          />
        </div>

        {isLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-500">Analyzing lawn area...</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium">Analysis Results</h3>
            <p className="text-gray-500">
              {result.address || "Selected Location"}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Square Feet</p>
                <p className="text-2xl font-bold">
                  {result.squareFeet.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Square Meters</p>
                <p className="text-2xl font-bold">
                  {result.squareMeters.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Lawn Coverage Level</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${result.lawnCoverage}%` }}
                ></div>
              </div>
              <p className="text-right text-sm mt-1">{result.lawnCoverage}%</p>
            </div>

            {result.imageUrl && result.detectedPixels && (
              <LawnVisualizer
                imageUrl={result.imageUrl}
                estimatedArea={{
                  squareFeet: result.squareFeet,
                  squareMeters: result.squareMeters,
                }}
                detectedPixels={result.detectedPixels}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
