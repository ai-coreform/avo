"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@avo/ui/components/ui/dialog";
import { Input } from "@avo/ui/components/ui/input";
import { Label } from "@avo/ui/components/ui/label";
import {
  Check,
  CheckCircle,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getImportStatus, type ImportJobStatus } from "@/api/onboarding";
import { useCheckSlug } from "@/api/onboarding/use-check-slug";
import { useStartImport } from "@/api/onboarding/use-import-venue";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;

function createSlugLocal(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface FieldErrors {
  restaurantName?: string;
  slug?: string;
  restaurantWebsite?: string;
}

function validateFields(fields: {
  restaurantName: string;
  slug: string;
  slugStatus: string;
  restaurantWebsite: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.restaurantName.trim()) {
    errors.restaurantName = "Il nome del ristorante è obbligatorio.";
  }

  if (!fields.slug.trim()) {
    errors.slug = "Lo slug è obbligatorio.";
  } else if (fields.slugStatus === "taken") {
    errors.slug = "Questo slug è già in uso.";
  } else if (fields.slugStatus === "checking") {
    errors.slug = "Verifica disponibilità, attendere.";
  }

  if (fields.restaurantWebsite.trim()) {
    try {
      new URL(
        HTTP_PROTOCOL_REGEX.test(fields.restaurantWebsite)
          ? fields.restaurantWebsite
          : `https://${fields.restaurantWebsite}`
      );
    } catch {
      errors.restaurantWebsite = "Inserisci un URL valido.";
    }
  } else {
    errors.restaurantWebsite = "L'URL del sito web è obbligatorio.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="mt-1.5 text-[13px] text-destructive">{message}</p>;
}

function SlugIndicator({ status }: { status: string }) {
  if (status === "checking") {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }
  if (status === "available") {
    return <Check className="size-4 text-emerald-500" />;
  }
  if (status === "taken") {
    return <X className="size-4 text-destructive" />;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Polling hook
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 2000;

function useJobPoller(jobId: string | null) {
  const [jobStatus, setJobStatus] = useState<ImportJobStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJobStatus(null);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const status = await getImportStatus(jobId);
        if (cancelled) {
          return;
        }
        setJobStatus(status);

        if (
          (status.status === "completed" || status.status === "failed") &&
          intervalRef.current
        ) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch {
        // Ignore poll errors, keep trying
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId]);

  return jobStatus;
}

// ---------------------------------------------------------------------------
// Progress view
// ---------------------------------------------------------------------------

function ImportProgress({ status }: { status: ImportJobStatus }) {
  const progress = (status.completedSteps / status.totalSteps) * 100;

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <Loader2 className="size-8 animate-spin text-primary" />

      <div>
        <p className="font-medium">Importazione venue...</p>
        <p className="mt-1 text-muted-foreground text-sm">
          {status.currentStep ?? "Elaborazione..."}
        </p>
      </div>

      <div className="w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-muted-foreground text-xs">
          Passo {status.completedSteps} di {status.totalSteps}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success view
// ---------------------------------------------------------------------------

function ImportSuccess({
  status,
  onReset,
}: {
  status: ImportJobStatus;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle className="size-7 text-emerald-600" />
      </div>

      <div>
        <h3 className="font-semibold text-lg">Venue creato</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Il menu è stato importato ed è pronto per la revisione.
        </p>
      </div>

      {status.result && (
        <div className="grid w-full grid-cols-3 gap-4 rounded-lg border p-3">
          <div>
            <p className="font-semibold text-xl">
              {status.result.categoryCount}
            </p>
            <p className="text-muted-foreground text-xs">Categorie</p>
          </div>
          <div>
            <p className="font-semibold text-xl">{status.result.groupCount}</p>
            <p className="text-muted-foreground text-xs">Gruppi</p>
          </div>
          <div>
            <p className="font-semibold text-xl">{status.result.itemCount}</p>
            <p className="text-muted-foreground text-xs">Articoli</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onReset} variant="outline">
          <Plus className="size-4" />
          Importa un altro
        </Button>
        {status.venueSlug && (
          <Button asChild>
            <a href={`/venues/${status.venueSlug}`}>
              <ExternalLink className="size-4" />
              Vedi venue
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error view
// ---------------------------------------------------------------------------

function ImportError({
  status,
  onRetry,
}: {
  status: ImportJobStatus;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <X className="size-7 text-destructive" />
      </div>

      <div>
        <h3 className="font-semibold text-lg">Importazione fallita</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          {status.errorMessage ?? "Si è verificato un errore sconosciuto."}
        </p>
      </div>

      <Button onClick={onRetry} variant="outline">
        Riprova
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

type DialogView = "form" | "polling";

function ImportFormContent({
  onJobStarted,
}: {
  onJobStarted: (jobId: string) => void;
}) {
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [restaurantWebsite, setRestaurantWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const { status: slugStatus, normalizedSlug } = useCheckSlug(slug);
  const startMutation = useStartImport();

  const handleNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value;
      setRestaurantName(name);
      if (!slugTouched) {
        setSlug(createSlugLocal(name));
      }
    },
    [slugTouched]
  );

  const handleSlugChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setSlug(createSlugLocal(e.target.value));
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      const fieldErrors = validateFields({
        restaurantName,
        slug,
        slugStatus,
        restaurantWebsite,
      });

      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length > 0) {
        return;
      }

      const formData = new FormData();
      formData.append("restaurantName", restaurantName.trim());
      formData.append("slug", normalizedSlug || slug);
      formData.append("restaurantWebsite", restaurantWebsite.trim());

      startMutation.mutate(formData, {
        onSuccess: (data) => onJobStarted(data.jobId),
      });
    },
    [
      restaurantName,
      slug,
      slugStatus,
      restaurantWebsite,
      normalizedSlug,
      startMutation,
      onJobStarted,
    ]
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="importName">Nome ristorante</Label>
        <Input
          id="importName"
          onChange={handleNameChange}
          placeholder="es. Trattoria da Mario"
          value={restaurantName}
        />
        <FieldError message={errors.restaurantName} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="importSlug">Slug</Label>
        <div className="relative">
          <Input
            className="pr-10"
            id="importSlug"
            onChange={handleSlugChange}
            placeholder="trattoriamario"
            value={slug}
          />
          <div className="absolute inset-y-0 right-3 flex items-center">
            <SlugIndicator status={slugStatus} />
          </div>
        </div>
        {slugStatus === "available" && normalizedSlug && (
          <p className="text-muted-foreground text-xs">
            Sarà disponibile su: /{normalizedSlug}
          </p>
        )}
        <FieldError message={errors.slug} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="importWebsite">
          <Globe className="mr-1 inline size-4" />
          URL sito web
        </Label>
        <Input
          id="importWebsite"
          onChange={(e) => setRestaurantWebsite(e.target.value)}
          placeholder="www.trattoriamario.it"
          value={restaurantWebsite}
        />
        <p className="text-muted-foreground text-xs">
          Scansioneremo il sito per logo, colori e menu automaticamente.
        </p>
        <FieldError message={errors.restaurantWebsite} />
      </div>

      {startMutation.isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
          {startMutation.error.message}
        </div>
      )}

      <Button
        className="w-full"
        disabled={startMutation.isPending}
        type="submit"
      >
        {startMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Avvio...
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Importa venue
          </>
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

interface ImportVenueDialogProps {
  onImported?: () => void;
}

export function ImportVenueDialog({ onImported }: ImportVenueDialogProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DialogView>("form");
  const [jobId, setJobId] = useState<string | null>(null);
  const jobStatus = useJobPoller(jobId);

  const handleReset = useCallback(() => {
    setView("form");
    setJobId(null);
    onImported?.();
  }, [onImported]);

  const handleJobStarted = useCallback((id: string) => {
    setJobId(id);
    setView("polling");
  }, []);

  // When dialog closes, reset if not actively polling
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (
        !isOpen &&
        (!jobStatus ||
          jobStatus.status === "completed" ||
          jobStatus.status === "failed")
      ) {
        setView("form");
        setJobId(null);
        if (jobStatus?.status === "completed") {
          onImported?.();
        }
      }
    },
    [jobStatus, onImported]
  );

  const renderContent = () => {
    if (view === "form") {
      return <ImportFormContent onJobStarted={handleJobStarted} />;
    }

    if (
      !jobStatus ||
      jobStatus.status === "pending" ||
      jobStatus.status === "running"
    ) {
      return (
        <ImportProgress
          status={
            jobStatus ?? {
              jobId: jobId ?? "",
              status: "pending",
              currentStep: "Avvio...",
              totalSteps: 5,
              completedSteps: 0,
              errorMessage: null,
              venueId: null,
              venueSlug: null,
              result: null,
            }
          }
        />
      );
    }

    if (jobStatus.status === "completed") {
      return <ImportSuccess onReset={handleReset} status={jobStatus} />;
    }

    return <ImportError onRetry={handleReset} status={jobStatus} />;
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Importa venue
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={
          view === "form" ||
          jobStatus?.status === "completed" ||
          jobStatus?.status === "failed"
        }
      >
        {view === "form" && (
          <DialogHeader>
            <DialogTitle>Importa venue</DialogTitle>
            <DialogDescription>
              Crea un nuovo venue scansionando il sito web del ristorante.
              Estrarremo logo, colori e menu completo automaticamente.
            </DialogDescription>
          </DialogHeader>
        )}
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
