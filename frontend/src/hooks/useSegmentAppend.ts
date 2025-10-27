import { useState } from "react";
import { appendSegment } from "../services/api";
import { AppendSegmentPayload } from "../types";

export function useSegmentAppend(storyId: string, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: AppendSegmentPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await appendSegment(storyId, payload);
      onSuccess?.();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}

