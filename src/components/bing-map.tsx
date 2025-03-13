"use client"

import React, { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    Microsoft: any
    GetMap: () => void
    bingMapsLoaded: boolean
  }
}

export const BingMap = ({
  initialLocation,
  onLocationSelected,
  onMapReady,
}: {
  initialLocation?: { lat: number; lng: number } | null
  onLocationSelected: (
    lat: number,
    lng: number,
    zoom: number,
    width: number,
    height: number,
    bounds?: {
      north: number
      south: number
      east: number
      west: number
    }
  ) => void
  onMapReady?: () => void
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [currentZoom, setCurrentZoom] = useState(18)
  const [mapDimensions, setMapDimensions] = useState({
    width: 600,
    height: 400,
  })

  const defaultLatitude = 38.8977
  const defaultLongitude = -77.0365

  useEffect(() => {
    if (window.Microsoft && window.Microsoft.Maps) {
      initMap()
      return
    }

    const bingMapsScript = document.createElement("script")
    const bingMapsKey = process.env.NEXT_PUBLIC_BING_MAPS_KEY || ""
    bingMapsScript.src = `https://www.bing.com/api/maps/mapcontrol?callback=GetMap&key=${bingMapsKey}`
    bingMapsScript.async = true
    bingMapsScript.defer = true

    window.GetMap = () => {
      window.bingMapsLoaded = true
      initMap()
    }

    document.body.appendChild(bingMapsScript)

    return () => {
      document.body.removeChild(bingMapsScript)
    }
  }, [])

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return

    const Microsoft = window.Microsoft
    if (!Microsoft || !Microsoft.Maps) return

    mapInstanceRef.current = new Microsoft.Maps.Map(mapRef.current, {
      credentials: process.env.NEXT_PUBLIC_BING_MAPS_KEY,
      center: new Microsoft.Maps.Location(defaultLatitude, defaultLongitude),
      mapTypeId: Microsoft.Maps.MapTypeId.aerial,
      zoom: currentZoom,
    })

    Microsoft.Maps.Events.addHandler(
      mapInstanceRef.current,
      "click",
      (e: any) => {
        const point = new Microsoft.Maps.Point(e.pageX, e.pageY)
        const location = e.target.tryPixelToLocation(point)

        setSelectedLocation({
          lat: location.latitude,
          lng: location.longitude,
        })

        updatePushpin(location.latitude, location.longitude)
      }
    )

    Microsoft.Maps.Events.addHandler(
      mapInstanceRef.current,
      "viewchangeend",
      () => {
        if (mapInstanceRef.current) {
          setCurrentZoom(mapInstanceRef.current.getZoom())
        }
      }
    )

    setIsMapReady(true)
    if (onMapReady) onMapReady()
  }

  const updatePushpin = (lat: number, lng: number) => {
    if (!mapInstanceRef.current || !window.Microsoft) return

    const Microsoft = window.Microsoft
    const location = new Microsoft.Maps.Location(lat, lng)

    mapInstanceRef.current.entities.clear()
    const pushpin = new Microsoft.Maps.Pushpin(location, {
      color: "green",
    })
    mapInstanceRef.current.entities.push(pushpin)
  }

  useEffect(() => {
    if (!isMapReady || !initialLocation) return

    const Microsoft = window.Microsoft
    if (!Microsoft || !Microsoft.Maps || !mapInstanceRef.current) return

    const { lat, lng } = initialLocation
    setSelectedLocation({ lat, lng })

    const location = new Microsoft.Maps.Location(lat, lng)

    mapInstanceRef.current.setView({
      center: location,
      zoom: 18,
    })

    updatePushpin(lat, lng)
  }, [initialLocation, isMapReady])

  useEffect(() => {
    if (!mapRef.current) return

    const updateDimensions = () => {
      if (mapRef.current) {
        setMapDimensions({
          width: mapRef.current.clientWidth,
          height: mapRef.current.clientHeight,
        })
      }
    }

    updateDimensions()

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(mapRef.current)

    return () => {
      if (mapRef.current) {
        resizeObserver.unobserve(mapRef.current)
      }
    }
  }, [])

  const getMapBounds = () => {
    if (!mapInstanceRef.current || !window.Microsoft) return null

    const bounds = mapInstanceRef.current.getBounds()
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    }
  }

  const handlePointAnalysisClick = () => {
    if (selectedLocation && mapInstanceRef.current) {
      const bounds = getMapBounds() || undefined

      onLocationSelected(
        selectedLocation.lat,
        selectedLocation.lng,
        mapInstanceRef.current.getZoom(),
        mapDimensions.width,
        mapDimensions.height,
        bounds
      )
    }
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full">
        {!isMapReady && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p>Loading map...</p>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handlePointAnalysisClick}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-md flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            Analyze Selected Point
          </button>
        </div>
      )}
    </div>
  )
}
