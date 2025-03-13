import React, { useState, useEffect, useRef } from "react"

export const LawnVisualizer = ({
  imageUrl,
  estimatedArea,
  detectedPixels,
}: {
  imageUrl: string
  estimatedArea: {
    squareFeet: number
    squareMeters: number
  }
  detectedPixels?: { x: number; y: number }[]
}) => {
  const [showOverlay, setShowOverlay] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  })

  const handleImageLoad = () => {
    if (!imgRef.current) return

    const naturalWidth = imgRef.current.naturalWidth
    const naturalHeight = imgRef.current.naturalHeight

    setImageDimensions({
      width: naturalWidth,
      height: naturalHeight,
    })

    if (canvasRef.current) {
      canvasRef.current.width = naturalWidth
      canvasRef.current.height = naturalHeight

      if (detectedPixels && showOverlay) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          drawOverlay(ctx, detectedPixels, naturalWidth, naturalHeight)
        }
      }
    }

    setImageLoaded(true)
  }

  const drawOverlay = (
    ctx: CanvasRenderingContext2D,
    pixels: { x: number; y: number }[],
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "rgba(144, 238, 144, 0.5)"

    if (pixels.length > 5000) {
      ctx.beginPath()
      for (const pixel of pixels) {
        const x = pixel.x * width
        const y = pixel.y * height
        ctx.rect(x - 1, y - 1, 2, 2)
      }
      ctx.fill()
    } else {
      pixels.forEach((pixel) => {
        const x = pixel.x * width
        const y = pixel.y * height

        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }

  useEffect(() => {
    if (!canvasRef.current || !detectedPixels || !imageLoaded) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (!showOverlay) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    drawOverlay(ctx, detectedPixels, canvas.width, canvas.height)
  }, [detectedPixels, showOverlay, imageLoaded])

  // Calculate aspect ratio to preserve image dimensions
  const aspectRatio =
    imageDimensions.width && imageDimensions.height
      ? (imageDimensions.height / imageDimensions.width) * 100
      : 66.67 // Default aspect ratio (2:3)

  return (
    <div
      className="relative w-full border rounded-md overflow-hidden bg-gray-100 min-h-[300px] max-h-[600px]"
      style={{
        paddingBottom: `${aspectRatio}%`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {imageLoaded && (
            <div className="absolute top-2 left-2 bg-white/70 text-xs p-1 z-20 rounded">
              Image: {imageDimensions.width}x{imageDimensions.height} | Canvas:{" "}
              {canvasRef.current?.width || 0}x{canvasRef.current?.height || 0} |
              Points: {detectedPixels?.length || 0}
            </div>
          )}

          <img
            ref={imgRef}
            src={imageUrl}
            alt="Satellite view"
            className="absolute inset-0 w-full h-full object-contain"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
          />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>

      <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow-md text-sm z-10">
        <p className="font-bold">Estimated Lawn Area</p>
        <p>
          {estimatedArea.squareFeet.toLocaleString()} sq ft /{" "}
          {estimatedArea.squareMeters.toLocaleString()} sq m
        </p>
      </div>

      <button
        onClick={() => setShowOverlay((prev) => !prev)}
        className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded z-10"
      >
        {showOverlay ? "Hide Lawn Detection" : "Show Lawn Detection"}
      </button>
    </div>
  )
}
