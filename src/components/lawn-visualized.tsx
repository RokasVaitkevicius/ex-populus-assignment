import React, { useState } from "react"

interface LawnVisualizationProps {
  imageUrl: string
  estimatedArea: {
    squareFeet: number
    squareMeters: number
  }
  detectedPixels?: { x: number; y: number }[]
}

export const LawnVisualization: React.FC<LawnVisualizationProps> = ({
  imageUrl,
  estimatedArea,
  detectedPixels,
}) => {
  const [showOverlay, setShowOverlay] = useState(true)

  return (
    <div className="relative w-full h-64 border rounded-md overflow-hidden bg-gray-100">
      <img
        src={imageUrl}
        alt="Satellite view"
        className="absolute inset-0 object-cover w-full h-full"
      />

      {showOverlay && (
        <div className="absolute inset-0 pointer-events-none">
          {detectedPixels?.map((pixel, index) => (
            <div
              key={index}
              className="absolute w-[3px] h-[3px] bg-green-500 rounded-full opacity-80"
              style={{
                left: `${pixel.x * 100}%`,
                top: `${pixel.y * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
          <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow-md text-sm pointer-events-auto">
            <p className="font-bold">Estimated Lawn Area</p>
            <p>
              {estimatedArea.squareFeet.toLocaleString()} sq ft /{" "}
              {estimatedArea.squareMeters.toLocaleString()} sq m
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowOverlay((prev) => !prev)}
        className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded z-20 pointer-events-auto"
      >
        {showOverlay ? "Hide Overlay" : "Show Overlay"}
      </button>
    </div>
  )
}
