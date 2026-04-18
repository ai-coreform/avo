import { getOpenAiClient } from "@/lib/openrouter";

/**
 * Transcribes an audio blob using OpenAI Whisper.
 * Expects audio in webm/opus format.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const client = getOpenAiClient();

  const file = new File([audioBlob], "voice.webm", { type: "audio/webm" });

  const transcription = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "it",
  });

  return transcription.text;
}
