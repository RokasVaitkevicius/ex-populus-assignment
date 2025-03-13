"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BingMap } from "./bing-map"
import { LawnVisualizer } from "./lawn-visualizer"
import { AddressForm } from "./form/address-form"
import { estimateLawn } from "@/app/actions/estimate-lawn"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, AlertCircleIcon } from "lucide-react"

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
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

  const handleAddressFound = (loc: {
    lat: number
    lng: number
    address: string
  }) => {
    setLocation(loc)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
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
      const result = await estimateLawn({
        coordinates: { lat, lng },
        zoom,
        address: location?.address,
        mapWidth,
        mapHeight,
        mapBounds,
      })

      setResult(result)
    } catch (err: Error | unknown) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze lawn area. Please try a different location."
      )
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
        <AddressForm
          onAddressFound={handleAddressFound}
          onError={handleError}
        />

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md mb-4">
          <p className="text-sm font-medium flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            How to use:
          </p>
          <ol className="text-sm list-decimal pl-5 mt-1 space-y-1">
            <li>
              Enter an address to center the map and click &quot;Find
              Location&quot;
            </li>
            <li>Adjust the selected viewport on the map</li>
            <li>
              Click &quot;Analyze Selected Point&quot; to calculate the lawn
              area
            </li>
          </ol>
        </div>

        <div className="h-[400px] w-full rounded-md overflow-hidden border border-gray-200">
          <BingMap
            initialLocation={location}
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
