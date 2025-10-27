import { useState } from "react";
import { createStory } from "../services/api";
import { CreateStoryPayload } from "../types";

export function useStoryCreation(onSuccess?: (storyId: string) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: CreateStoryPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createStory(payload);
      setLoading(false);
      // Navigate immediately after story creation - don't wait for video to complete
      onSuccess?.(result.storyId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      throw err;
    }
  };

  return { submit, loading, error };
}

