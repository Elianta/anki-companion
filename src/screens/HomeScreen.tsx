import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { disambiguate } from "@/lib/llm"
import { useSessionStore } from "@/stores/session"

export function HomeScreen() {
  const [term, setTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const language = useSessionStore((state) => state.language)
  const setSessionTerm = useSessionStore((state) => state.setTerm)
  const setSenses = useSessionStore((state) => state.setSenses)
  const navigate = useNavigate({ from: "/" })

  const handleSearch = async () => {
    const normalized = term.trim()
    if (!normalized || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await disambiguate(normalized, language)
      setSessionTerm(response.term)
      setSenses(response.senses)
      await navigate({ to: "/senses" })
    } catch (error) {
      console.warn("Failed to disambiguate term", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <Input
        data-test-id="term-input"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Enter a word or chunk (context in [brackets])"
      />
      <Button
        type="button"
        variant="default"
        onClick={handleSearch}
        disabled={isSubmitting}
        data-test-id="search-button"
      >
        Search
      </Button>
    </section>
  )
}
