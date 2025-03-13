"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"

interface MicrosoftMapsLocation {
  latitude: number
  longitude: number
}

interface MicrosoftMapsPoint {
  x: number
  y: number
}

interface MicrosoftMapsPushpinOptions {
  color?: string
  title?: string
  subTitle?: string
  text?: string
  icon?: string
}

interface MicrosoftMapsPushpin {
  location: MicrosoftMapsLocation
  options?: MicrosoftMapsPushpinOptions
}

interface MicrosoftMapsLocationRect {
  getNorth(): number
  getSouth(): number
  getEast(): number
  getWest(): number
}

interface MicrosoftMapsMapClickEvent {
  pageX: number
  pageY: number
  target: MicrosoftMapsMap
}

interface MicrosoftMapsMapEntities {
  clear(): void
  push(pushpin: MicrosoftMapsPushpin): void
}

interface MicrosoftMapsMap {
  setView(options: { center: MicrosoftMapsLocation; zoom: number }): void
  getZoom(): number
  getBounds(): MicrosoftMapsLocationRect
  entities: MicrosoftMapsMapEntities
  tryPixelToLocation(point: MicrosoftMapsPoint): MicrosoftMapsLocation
}

interface MicrosoftMaps {
  Maps: {
    Map: new (
      element: HTMLElement,
      options: Record<string, unknown>
    ) => MicrosoftMapsMap
    Location: new (latitude: number, longitude: number) => MicrosoftMapsLocation
    Point: new (x: number, y: number) => MicrosoftMapsPoint
    Pushpin: new (
      location: MicrosoftMapsLocation,
      options: MicrosoftMapsPushpinOptions
    ) => MicrosoftMapsPushpin
    Events: {
      addHandler: (
        target: MicrosoftMapsMap | MicrosoftMapsPushpin,
        eventName: string,
        handler: (e: MicrosoftMapsMapClickEvent) => void
      ) => void
    }
    MapTypeId: {
      aerial: string
    }
  }
}

declare global {
  interface Window {
    Microsoft: MicrosoftMaps
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
  const mapInstanceRef = useRef<MicrosoftMapsMap | null>(null)
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

  const initMap = useCallback(() => {
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
      (e: MicrosoftMapsMapClickEvent) => {
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
  }, [currentZoom, onMapReady, defaultLatitude, defaultLongitude])

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
      if (document.body.contains(bingMapsScript)) {
        document.body.removeChild(bingMapsScript)
      }
    }
  }, [initMap])

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
    const currentMapRef = mapRef.current
    resizeObserver.observe(currentMapRef)

    return () => {
      if (currentMapRef) {
        resizeObserver.unobserve(currentMapRef)
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
