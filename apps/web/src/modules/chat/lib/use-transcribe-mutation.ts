"use client";

import { useMutation } from "@tanstack/react-query";
import { transcribeAudioBlob } from "./transcribe-audio";

export function useTranscribeMutation() {
  return useMutation({
    mutationFn: transcribeAudioBlob,
  });
}
