"use client";

import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import {
  visualiseGarden,
  type VisualiserHotspot,
} from "@/server/actions/garden-visualiser";
import type { SanityDepartment, SanityProduct } from "@/types/sanity-content";

interface CategoryWithProducts {
  slug: string;
  name: string;
  departmentSlug: string;
  products: SanityProduct[];
}

type Step = "room" | "products" | "upload" | "result";

// Vercel's serverless functions enforce a hard ~4.5MB request body limit that
// can't be raised in config — a phone photo easily exceeds that. Downscaling
// and re-encoding client-side keeps uploads well under it regardless of what
// the visitor picks.
const MAX_UPLOAD_DIMENSION = 1600;
const UPLOAD_JPEG_QUALITY = 0.82;

async function compressPhoto(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(
    1,
    MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", UPLOAD_JPEG_QUALITY),
  );
  if (!blob) return file;

  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export function GardenVisualiserTool({
  departments,
  categories,
}: {
  departments: SanityDepartment[];
  categories: CategoryWithProducts[];
}) {
  const [step, setStep] = React.useState<Step>("room");
  const [room, setRoom] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"manual" | "auto" | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    imageDataUrl: string;
    hotspots: VisualiserHotspot[];
  } | null>(null);
  const [activeHotspot, setActiveHotspot] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const roomCategories = categories.filter((c) => c.departmentSlug === room);
  const roomsWithProducts = new Set(categories.map((c) => c.departmentSlug));

  function toggleProduct(slug: string) {
    setSelected((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length >= 4
          ? prev
          : [...prev, slug],
    );
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const compressed = await compressPhoto(file);
    setPhotoFile(compressed);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(compressed);
    });
  }

  async function onGenerate() {
    if (!photoFile || !mode) return;
    setPending(true);
    setError(null);
    try {
      const selection =
        mode === "auto"
          ? { mode: "auto" as const }
          : { mode: "manual" as const, productSlugs: selected };
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("selection", JSON.stringify(selection));

      const response = await visualiseGarden(formData);
      if (!response.ok || !response.imageDataUrl) {
        setError(response.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult({
        imageDataUrl: response.imageDataUrl,
        hotspots: response.hotspots ?? [],
      });
      setStep("result");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function startOver() {
    setStep("room");
    setRoom(null);
    setMode(null);
    setSelected([]);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setResult(null);
    setActiveHotspot(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <StepIndicator step={step} />

      {step === "room" ? (
        <RoomStep
          departments={departments}
          roomsWithProducts={roomsWithProducts}
          onSelect={(slug) => {
            setRoom(slug);
            setStep("products");
          }}
        />
      ) : null}

      {step === "products" && room ? (
        <ProductsStep
          categories={roomCategories}
          selected={selected}
          onToggle={toggleProduct}
          onAuto={() => {
            setMode("auto");
            setStep("upload");
          }}
          onManualContinue={() => {
            setMode("manual");
            setStep("upload");
          }}
          onBack={() => setStep("room")}
        />
      ) : null}

      {step === "upload" ? (
        <UploadStep
          photoPreview={photoPreview}
          pending={pending}
          error={error}
          mode={mode}
          selectedCount={selected.length}
          onFileChange={onFileChange}
          onGenerate={onGenerate}
          onBack={() => setStep(mode === "auto" ? "room" : "products")}
        />
      ) : null}

      {step === "result" && result ? (
        <ResultStep
          before={photoPreview}
          result={result}
          activeHotspot={activeHotspot}
          onHotspotToggle={(slug) =>
            setActiveHotspot((prev) => (prev === slug ? null : slug))
          }
          onStartOver={startOver}
        />
      ) : null}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "room", label: "Room" },
    { key: "products", label: "Products" },
    { key: "upload", label: "Your photo" },
    { key: "result", label: "Result" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);
  return (
    <div className="mb-10 flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 sm:gap-4">
          <span
            className={`flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase ${
              i <= activeIndex ? "text-brass" : "text-canvas/35"
            }`}
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full border text-[10px] ${
                i <= activeIndex ? "border-brass" : "border-canvas/25"
              }`}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </span>
          {i < steps.length - 1 ? (
            <span aria-hidden className="bg-canvas/15 h-px w-4 sm:w-8" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RoomStep({
  departments,
  roomsWithProducts,
  onSelect,
}: {
  departments: SanityDepartment[];
  roomsWithProducts: Set<string>;
  onSelect: (slug: string) => void;
}) {
  return (
    <div>
      <p className="text-canvas font-display mb-6 text-center text-xl">
        Which room are you designing?
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {departments.map((dept) => {
          const available = roomsWithProducts.has(dept.slug);
          return (
            <button
              key={dept.slug}
              type="button"
              disabled={!available}
              onClick={() => onSelect(dept.slug)}
              className={`bg-basalt-raise rounded-lg border border-white/8 p-4 text-center transition-colors ${
                available
                  ? "hover:border-brass/40 cursor-pointer"
                  : "cursor-not-allowed opacity-40"
              }`}
            >
              <p className="text-canvas text-[13px] font-medium">{dept.name}</p>
              {!available ? (
                <p className="text-canvas/45 mt-1 text-[10px] tracking-[0.08em] uppercase">
                  Coming soon
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductsStep({
  categories,
  selected,
  onToggle,
  onAuto,
  onManualContinue,
  onBack,
}: {
  categories: CategoryWithProducts[];
  selected: string[];
  onToggle: (slug: string) => void;
  onAuto: () => void;
  onManualContinue: () => void;
  onBack: () => void;
}) {
  const [activeCategory, setActiveCategory] = React.useState(
    categories[0]?.slug,
  );
  const current =
    categories.find((c) => c.slug === activeCategory) ?? categories[0];

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-canvas/50 hover:text-canvas mb-6 text-[12px]"
      >
        ← Choose a different room
      </button>

      <div className="border-brass/30 bg-brass/5 mb-8 flex flex-col items-center gap-3 rounded-lg border p-6 text-center">
        <p className="text-canvas font-display text-lg">
          Not sure what you want yet?
        </p>
        <Button type="button" onClick={onAuto} className="mt-1">
          Let Kaiku design my space for me
        </Button>
      </div>

      <p className="text-canvas/50 mb-4 text-center text-[12px] tracking-[0.1em] uppercase">
        Or choose products yourself (up to 4)
      </p>

      {categories.length > 1 ? (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setActiveCategory(c.slug)}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                c.slug === activeCategory
                  ? "border-brass bg-brass text-white"
                  : "border-canvas/20 text-canvas/70 hover:border-canvas/40"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {current?.products.map((product) => {
          const isSelected = selected.includes(product.slug);
          return (
            <button
              key={product.slug}
              type="button"
              onClick={() => onToggle(product.slug)}
              className={`group relative overflow-hidden rounded-lg border text-left transition-colors ${
                isSelected
                  ? "border-brass"
                  : "border-white/8 hover:border-white/20"
              }`}
            >
              <div className="bg-basalt-card relative aspect-square">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : null}
                {isSelected ? (
                  <span className="bg-brass absolute top-2 right-2 flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white">
                    ✓
                  </span>
                ) : null}
              </div>
              <div className="p-2.5">
                <p className="text-canvas text-[12px] leading-snug font-medium">
                  {product.name}
                </p>
                <p className="text-brass mt-0.5 text-[12px]">
                  {formatPrice(product.price)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          type="button"
          onClick={onManualContinue}
          disabled={!selected.length}
        >
          Continue with {selected.length}{" "}
          {selected.length === 1 ? "product" : "products"}
        </Button>
      </div>
    </div>
  );
}

function UploadStep({
  photoPreview,
  pending,
  error,
  mode,
  selectedCount,
  onFileChange,
  onGenerate,
  onBack,
}: {
  photoPreview: string | null;
  pending: boolean;
  error: string | null;
  mode: "manual" | "auto" | null;
  selectedCount: number;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <button
        type="button"
        onClick={onBack}
        className="text-canvas/50 hover:text-canvas mb-6 text-[12px]"
      >
        ← Back
      </button>

      <p className="text-canvas font-display mb-2 text-xl">
        Now, upload a photo of your space
      </p>
      <p className="text-canvas/55 mb-6 text-[13px]">
        {mode === "auto"
          ? "Kaiku will choose the products."
          : `${selectedCount} product${selectedCount === 1 ? "" : "s"} selected.`}
      </p>

      <label className="bg-basalt-raise hover:border-brass/40 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 p-10 transition-colors">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: object URL preview, not a static asset
          <img
            src={photoPreview}
            alt="Your space"
            className="max-h-64 rounded-md object-contain"
          />
        ) : (
          <span className="text-canvas/60 text-[13px]">
            Click to upload a photo
          </span>
        )}
      </label>

      <Button
        type="button"
        onClick={onGenerate}
        disabled={pending || !photoPreview}
        className="mt-6"
      >
        {pending ? "Designing your space…" : "Generate my design"}
      </Button>

      {error ? (
        <p className="text-canvas/60 mt-4 text-[13px]">{error}</p>
      ) : null}
    </div>
  );
}

function ResultStep({
  before,
  result,
  activeHotspot,
  onHotspotToggle,
  onStartOver,
}: {
  before: string | null;
  result: { imageDataUrl: string; hotspots: VisualiserHotspot[] };
  activeHotspot: string | null;
  onHotspotToggle: (slug: string) => void;
  onStartOver: () => void;
}) {
  return (
    <div>
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a static asset */}
        <img
          src={result.imageDataUrl}
          alt="Your space, redesigned"
          className="w-full"
        />

        {result.hotspots.map((spot) => (
          <button
            key={spot.slug}
            type="button"
            onClick={() => onHotspotToggle(spot.slug)}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            aria-label={`View ${spot.name}`}
          >
            <span
              className={`bg-brass/90 block size-5 rounded-full ring-2 ring-white/80 ${
                activeHotspot === spot.slug ? "" : "animate-pulse"
              }`}
            />
          </button>
        ))}

        {result.hotspots.map((spot) =>
          activeHotspot === spot.slug ? (
            <AppLink
              key={spot.slug}
              href={`/shop/${spot.category}/${spot.slug}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className="bg-basalt/95 absolute z-10 flex w-48 -translate-x-1/2 translate-y-4 items-center gap-3 rounded-lg border border-white/10 p-3 backdrop-blur-md"
            >
              {spot.image ? (
                <Image
                  src={spot.image}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-md object-cover"
                />
              ) : null}
              <span>
                <span className="text-canvas block text-[12px] font-medium">
                  {spot.name}
                </span>
                <span className="text-brass mt-0.5 block text-[12px]">
                  {formatPrice(spot.price)}
                </span>
              </span>
            </AppLink>
          ) : null,
        )}
      </div>

      {before ? (
        <div className="mx-auto mt-6 max-w-[200px]">
          <p className="text-canvas/45 mb-2 text-center text-[10px] tracking-[0.1em] uppercase">
            Before
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not a static asset */}
          <img src={before} alt="Your space, before" className="rounded-md" />
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <Button type="button" onClick={onStartOver}>
          Start over
        </Button>
      </div>
    </div>
  );
}
