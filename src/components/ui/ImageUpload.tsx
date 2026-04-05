import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X } from "../../icons";
import type { FieldError } from "react-hook-form";

interface ImageUploadProps {
  onImageSelected: (file: File | null) => void;
  error?: FieldError;
  initialPreview?: string | null;
}

export default function ImageUpload({
  onImageSelected,
  error,
  initialPreview = null,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(initialPreview);

  useEffect(() => {
    setPreview(initialPreview);
  }, [initialPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cria uma URL temporária só para mostrar a preview na hora
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Manda o arquivo real para o formulário pai
      onImageSelected(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onImageSelected(null);
  };


  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-1 text-label">
        {t("form.imageLabel")}
      </label>

      {!preview ? (
        // Estado: Nenhuma imagem selecionada
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-default border-dashed rounded-lg hover:bg-hover-bg transition-colors cursor-pointer relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-text-secondary" />
            <div className="flex text-sm text-text-secondary">
              <span className="font-medium text-primary-light">
                {t("form.imagePlaceholder")}
              </span>
              <p className="pl-1">{t("form.imageDragDrop")}</p>
            </div>
            <p className="text-xs text-text-secondary">{t("form.imageFormat")}</p>
          </div>
        </div>
      ) : (
        // Estado: Imagem selecionada (Preview)
        <div className="relative mt-2 w-full h-48 bg-hover-bg rounded-lg overflow-hidden border border-border-subtle group">
          <img
            src={preview}
            alt={t("common.imagePreviewAlt", { defaultValue: "Preview" })}
            className="w-full h-full object-cover"
          />

          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
            title={t("form.removeImage")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <span className="text-red-500 text-sm mt-1 ml-1">{error.message}</span>
      )}
    </div>
  );
}
