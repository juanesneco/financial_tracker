"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ScanResult {
  date?: string;
  subcategory_id?: string;
  title?: string;
  amount?: string;
  payment_method?: "card" | "cash" | null;
}

export default function ScanReceiptPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Resize image to fit sessionStorage (~5MB limit) and reduce API payload
  const resizeImage = (file: File, maxWidth = 1200): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImage = async (file: File) => {
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/receipts/scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to analyze receipt");
        setIsExtracting(false);
        return;
      }

      const result: ScanResult = await res.json();

      // Resize for sessionStorage (base64 of full-res photo can exceed 5MB limit)
      const preview = await resizeImage(file);
      const scanData = {
        ...result,
        receiptPreview: preview,
      };
      sessionStorage.setItem("scanResult", JSON.stringify(scanData));
      router.push("/add?from=scan");
    } catch {
      toast.error("Something went wrong");
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImage(file);
    }
  };

  if (isExtracting) {
    return (
      <>
        <Header title="Scan Receipt" showBackButton />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Analyzing receipt...</p>
            <p className="text-sm text-muted-foreground">
              Extracting date, amount, and category
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Scan Receipt" showBackButton />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center space-y-2 mb-4">
          <p className="text-lg font-semibold">Upload a receipt</p>
          <p className="text-sm text-muted-foreground">
            Take a photo or pick from your gallery
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            size="lg"
            className="h-14 text-base gap-3"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={22} />
            Take Photo
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-14 text-base gap-3"
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImageIcon size={22} />
            Choose from Gallery
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </main>
    </>
  );
}
