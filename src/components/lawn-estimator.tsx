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
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import axios from "axios"
import { LawnVisualization } from "./lawn-visualized"

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
}

export const LawnEstimator = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post("/api/estimate-lawn", data)
      setResult(response.data)
    } catch (err) {
      console.error(err)
      setError(
        "Failed to estimate lawn area. Please check the address and try again."
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
          Enter a property address to get an estimate of the lawn area
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter property address (e.g., 123 Main St, City, State)"
              {...register("address", { required: "Address is required" })}
              className="w-full"
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
            {isLoading ? "Estimating..." : "Get Estimate"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium">Estimation Results</h3>
            <p className="text-gray-500">{result.address}</p>

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

            {result.imageUrl && (
              <LawnVisualization
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
