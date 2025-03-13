"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { ComboboxInput } from "@/components/combobox-input"
import { geocodeAddress } from "@/app/actions/geocode"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"

interface AddressFormProps {
  onAddressFound: (location: {
    lat: number
    lng: number
    address: string
  }) => void
  onError?: (error: string) => void
}

interface FormData {
  address: string
}

export const AddressForm = ({ onAddressFound, onError }: AddressFormProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    defaultValues: {
      address: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)

    try {
      const result = await geocodeAddress(data.address)
      onAddressFound(result)
    } catch (err: Error | unknown) {
      console.error(err)
      if (onError) {
        onError(
          err instanceof Error
            ? err.message
            : "Failed to find the address. Please check and try again."
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionSelected = (suggestion: {
    address: string
    latitude?: number
    longitude?: number
  }) => {
    form.setValue("address", suggestion.address)

    if (suggestion.latitude && suggestion.longitude) {
      onAddressFound({
        lat: suggestion.latitude,
        lng: suggestion.longitude,
        address: suggestion.address,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          rules={{ required: "Address is required" }}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ComboboxInput
                  {...field}
                  placeholder="Enter property address (e.g., 123 Main St, City, State)"
                  className="w-full"
                  onSuggestionSelected={handleSuggestionSelected}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isLoading}
        >
          {isLoading ? "Searching..." : "Find Location"}
        </Button>
      </form>
    </Form>
  )
}
