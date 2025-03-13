"use client"

import {
  type ChangeEvent,
  type InputHTMLAttributes,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react"
import { Input } from "./ui/input"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { getAddressSuggestions } from "@/app/actions/autocomplete"

interface Suggestion {
  address: string
  latitude?: number
  longitude?: number
}

interface ComboboxInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSuggestionSelected?: (suggestion: Suggestion) => void
}

export const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
  (
    {
      className,
      onSuggestionSelected,
      value: propValue,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const [query, setQuery] = useState<string>(
      (propValue as string) || (defaultValue as string) || ""
    )
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const debouncedQuery = useDebounce(query, 300)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (propValue !== undefined && propValue !== null) {
        setQuery(propValue as string)
      }
    }, [propValue])

    useEffect(() => {
      const fetchSuggestions = async () => {
        if (!debouncedQuery || debouncedQuery.length < 3) {
          setSuggestions([])
          return
        }

        try {
          setIsLoading(true)
          const result = await getAddressSuggestions(debouncedQuery)
          setSuggestions(result || [])
        } catch (error) {
          console.error("Failed to fetch suggestions:", error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      }

      fetchSuggestions()
    }, [debouncedQuery])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setQuery(newValue)
      setShowSuggestions(true)

      if (onChange) {
        onChange(e)
      }
    }

    const handleSuggestionClick = (suggestion: Suggestion) => {
      setQuery(suggestion.address)
      setShowSuggestions(false)

      if (onSuggestionSelected) {
        onSuggestionSelected(suggestion)
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: suggestion.address },
          currentTarget: { value: suggestion.address },
        } as ChangeEvent<HTMLInputElement>

        onChange(syntheticEvent)
      }
    }

    return (
      <div className="relative w-full" ref={containerRef}>
        <Input
          ref={ref}
          className={className}
          value={query}
          onChange={handleInputChange}
          onClick={() => setShowSuggestions(true)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          aria-autocomplete="none"
          {...props}
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.address}
              </li>
            ))}
          </ul>
        )}

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          </div>
        )}
      </div>
    )
  }
)

ComboboxInput.displayName = "ComboboxInput"
