import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Upload,
  UserIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
} from "../../icons";
import Button from "../ui/Button";
import useSupabaseStore from "../../store/useSupabaseStore";
import type { UserRole } from "../../utils/access";
import { translateProvinceName } from "../../utils/provinceLabels";

interface AccountSectionProps {
  name: string;
  email: string | null | undefined;
  province?: string | null;
  avatarUrl?: string | null;
  role?: UserRole | null;
}

const AVATAR_VIEWPORT_SIZE = 192;
const AVATAR_EXPORT_SIZE = 512;
const MIN_AVATAR_ZOOM = 1;
const MAX_AVATAR_ZOOM = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRangeProgress(value: number, min: number, max: number) {
  if (max <= min) {
    return 50;
  }

  return ((value - min) / (max - min)) * 100;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Nao foi possivel carregar a imagem."));
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

export function AccountSection({
  name,
  email,
  province,
  avatarUrl,
  role,
}: AccountSectionProps) {
  const { t } = useTranslation();
  const updateAvatar = useSupabaseStore((state) => state.updateAvatar);
  const shouldShowProvince = Boolean(province) && role !== "admin";

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [zoom, setZoom] = useState(MIN_AVATAR_ZOOM);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      setImageSize(null);
      setZoom(MIN_AVATAR_ZOOM);
      setOffsetX(0);
      setOffsetY(0);
      setIsDragging(false);
      dragRef.current = null;
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    let isActive = true;

    setPreviewUrl(objectUrl);
    setImageSize(null);
    setZoom(MIN_AVATAR_ZOOM);
    setOffsetX(0);
    setOffsetY(0);
    setIsDragging(false);
    dragRef.current = null;

    void loadImage(objectUrl)
      .then((image) => {
        if (!isActive) return;

        setImageSize({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      })
      .catch(() => {
        if (!isActive) return;
        setImageSize(null);
      });

    return () => {
      isActive = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const previewImageSize =
    imageSize ??
    (previewUrl
      ? { width: AVATAR_VIEWPORT_SIZE, height: AVATAR_VIEWPORT_SIZE }
      : null);
  const baseScale = previewImageSize
    ? Math.max(
        AVATAR_VIEWPORT_SIZE / previewImageSize.width,
        AVATAR_VIEWPORT_SIZE / previewImageSize.height,
      )
    : 1;
  const renderedWidth = previewImageSize
    ? previewImageSize.width * baseScale * zoom
    : AVATAR_VIEWPORT_SIZE;
  const renderedHeight = previewImageSize
    ? previewImageSize.height * baseScale * zoom
    : AVATAR_VIEWPORT_SIZE;
  const maxOffsetX = Math.max(0, (renderedWidth - AVATAR_VIEWPORT_SIZE) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - AVATAR_VIEWPORT_SIZE) / 2);
  const clampedOffsetX = clamp(offsetX, -maxOffsetX, maxOffsetX);
  const clampedOffsetY = clamp(offsetY, -maxOffsetY, maxOffsetY);
  const zoomProgress = getRangeProgress(zoom, MIN_AVATAR_ZOOM, MAX_AVATAR_ZOOM);
  const horizontalProgress = getRangeProgress(
    clampedOffsetX,
    -maxOffsetX,
    maxOffsetX,
  );
  const verticalProgress = getRangeProgress(
    clampedOffsetY,
    -maxOffsetY,
    maxOffsetY,
  );
  const isEditorReady = Boolean(previewUrl && imageSize && selectedFile);

  useEffect(() => {
    setOffsetX((current) => clamp(current, -maxOffsetX, maxOffsetX));
    setOffsetY((current) => clamp(current, -maxOffsetY, maxOffsetY));
  }, [maxOffsetX, maxOffsetY]);

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    event.target.value = "";
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditorReady) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: clampedOffsetX,
      startOffsetY: clampedOffsetY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;

    setOffsetX(
      clamp(dragRef.current.startOffsetX + dx, -maxOffsetX, maxOffsetX),
    );
    setOffsetY(
      clamp(dragRef.current.startOffsetY + dy, -maxOffsetY, maxOffsetY),
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(MIN_AVATAR_ZOOM);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleSaveAvatar = async () => {
    if (!previewUrl || !imageSize || !selectedFile) return;
    setIsSaving(true);

    try {
      const sourceImage = await loadImage(previewUrl);
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_EXPORT_SIZE;
      canvas.height = AVATAR_EXPORT_SIZE;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Nao foi possivel preparar a imagem.");

      const exportBaseScale = Math.max(
        AVATAR_EXPORT_SIZE / imageSize.width,
        AVATAR_EXPORT_SIZE / imageSize.height,
      );
      const exportWidth = imageSize.width * exportBaseScale * zoom;
      const exportHeight = imageSize.height * exportBaseScale * zoom;
      const scaleFactor = AVATAR_EXPORT_SIZE / AVATAR_VIEWPORT_SIZE;
      const drawX =
        (AVATAR_EXPORT_SIZE - exportWidth) / 2 + clampedOffsetX * scaleFactor;
      const drawY =
        (AVATAR_EXPORT_SIZE - exportHeight) / 2 + clampedOffsetY * scaleFactor;

      context.clearRect(0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE);
      context.drawImage(sourceImage, drawX, drawY, exportWidth, exportHeight);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((fileBlob) => {
          if (fileBlob) {
            resolve(fileBlob);
            return;
          }
          reject(new Error("Nao foi possivel exportar a imagem."));
        }, "image/png");
      });

      const avatarFile = new File([blob], "avatar.png", { type: "image/png" });
      const success = await updateAvatar(avatarFile);
      if (success) setSelectedFile(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section className="flex-col bg-surface rounded-2xl p-6 shadow-sm border border-border-subtle">
        <h2 className="self text-lg font-semibold mb-6">
          {t("config.account")}
        </h2>
        <div className="flex justify-around">
          <div className="flex flex-col">
            <div className="flex flex-col lg:flex-row">
              <div>
                <p className="text-xl font-semibold text-text-primary">
                  {name}
                </p>
                <p className="text-text-secondary">{email}</p>
                {shouldShowProvince && (
                  <p className="text-sm text-text-secondary mt-1 opacity-70">
                    {t("config.province")}: {translateProvinceName(province)}
                  </p>
                )}
                {role && (
                  <p className="text-sm text-text-secondary mt-1 opacity-70">
                    {t("config.role", { defaultValue: "Perfil" })}:{" "}
                    {t(`roles.${role}`, { defaultValue: role })}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Avatar atual + botão de upload */}

          <div className="flex flex-col gap-4">
            <div
              className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-border-subtle bg-hover-bg shadow-md"
              style={{
                boxShadow:
                  "0 0 0 4px var(--color-surface), 0 0 0 5px var(--color-border-subtle)",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={t("config.avatarAlt")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon className="h-14 w-14 text-text-secondary" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className=" inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border-subtle px-2 py-2 text-sm font-medium text-text-primary transition-all hover:bg-hover-bg hover:border-text-secondary"
            >
              <Upload className="h-4 w-4" />
              {t("config.changeAvatar")}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleSelectFile}
            />
          </div>
        </div>
      </section>

      {previewUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]" />

          <div className="relative flex min-h-full items-center justify-center">
            <div
              className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.45)]"
              style={{ background: "var(--color-background, #0f0f0f)" }}
            >
              {/* Header do editor */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <span className="text-xs font-medium text-text-secondary tracking-widest uppercase">
                  {t("config.avatarEditorTitle")}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  title={t("config.avatarReset")}
                  className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <RotateCcwIcon className="h-3.5 w-3.5" />
                  {t("config.avatarReset")}
                </button>
              </div>

              <div className="flex flex-col xl:flex-row">
                {/* Área de preview + drag */}
                <div
                  className="flex flex-col items-center justify-center gap-3 p-6 xl:w-64 xl:border-r border-border-subtle"
                  style={{
                    background:
                      "repeating-conic-gradient(#1a1a1a 0% 25%, #141414 0% 50%) 0 0 / 16px 16px",
                  }}
                >
                  <div
                    className="relative overflow-hidden rounded-full select-none"
                    style={{
                      width: AVATAR_VIEWPORT_SIZE,
                      height: AVATAR_VIEWPORT_SIZE,
                      cursor: isEditorReady
                        ? isDragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                      touchAction: "none",
                      boxShadow:
                        "0 0 0 2px rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.6)",
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    <img
                      src={previewUrl}
                      alt={t("config.avatarPreviewAlt")}
                      draggable={false}
                      className="absolute max-w-none pointer-events-none"
                      style={{
                        width: `${renderedWidth}px`,
                        height: `${renderedHeight}px`,
                        left: `calc(50% - ${renderedWidth / 2}px + ${clampedOffsetX}px)`,
                        top: `calc(50% - ${renderedHeight / 2}px + ${clampedOffsetY}px)`,
                      }}
                    />
                    {/* Grid overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none rounded-full"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                      }}
                    />
                    {/* Rule of thirds */}
                    <div
                      className="absolute inset-0 pointer-events-none rounded-full"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                        backgroundPosition: "64px 64px",
                      }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary opacity-60 select-none">
                    {isDragging
                      ? t("config.avatarDragging")
                      : t("config.avatarDragHint")}
                  </p>
                </div>

                {/* Controles */}
                <div className="flex-1 p-5 space-y-5">
                  {/* Zoom */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                        {t("config.avatarZoom")}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) =>
                              Math.max(MIN_AVATAR_ZOOM, +(z - 0.1).toFixed(2)),
                            )
                          }
                          className="rounded-md p-1 hover:bg-hover-bg text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <ZoomOutIcon className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-mono text-text-primary w-10 text-center">
                          {(zoom * 100).toFixed(0)}%
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) =>
                              Math.min(MAX_AVATAR_ZOOM, +(z + 0.1).toFixed(2)),
                            )
                          }
                          className="rounded-md p-1 hover:bg-hover-bg text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <ZoomInIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={MIN_AVATAR_ZOOM}
                        max={MAX_AVATAR_ZOOM}
                        step="0.01"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary-light"
                        style={{
                          background: `linear-gradient(to right, var(--color-primary-light, #6366f1) 0%, var(--color-primary-light, #6366f1) ${zoomProgress}%, var(--color-border-subtle) ${zoomProgress}%, var(--color-border-subtle) 100%)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Posição horizontal */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                        {t("config.avatarHorizontal")}
                      </label>
                      <span className="text-xs font-mono text-text-primary">
                        {clampedOffsetX > 0
                          ? `+${Math.round(clampedOffsetX)}`
                          : Math.round(clampedOffsetX)}
                        px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-maxOffsetX}
                      max={maxOffsetX}
                      step="0.1"
                      value={clampedOffsetX}
                      onChange={(e) => setOffsetX(Number(e.target.value))}
                      disabled={maxOffsetX === 0}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary-light disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: `linear-gradient(to right, var(--color-primary-light, #6366f1) 0%, var(--color-primary-light, #6366f1) ${horizontalProgress}%, var(--color-border-subtle) ${horizontalProgress}%, var(--color-border-subtle) 100%)`,
                      }}
                    />
                  </div>

                  {/* Posição vertical */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                        {t("config.avatarVertical")}
                      </label>
                      <span className="text-xs font-mono text-text-primary">
                        {clampedOffsetY > 0
                          ? `+${Math.round(clampedOffsetY)}`
                          : Math.round(clampedOffsetY)}
                        px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-maxOffsetY}
                      max={maxOffsetY}
                      step="0.1"
                      value={clampedOffsetY}
                      onChange={(e) => setOffsetY(Number(e.target.value))}
                      disabled={maxOffsetY === 0}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary-light disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: `linear-gradient(to right, var(--color-primary-light, #6366f1) 0%, var(--color-primary-light, #6366f1) ${verticalProgress}%, var(--color-border-subtle) ${verticalProgress}%, var(--color-border-subtle) 100%)`,
                      }}
                    />
                  </div>

                  {/* Separador + info */}
                  <div className="rounded-xl border border-border-subtle px-3 py-2 text-xs text-text-secondary flex items-center gap-2">
                    <span className="opacity-60">✦</span>
                    <span>{t("config.avatarExportHint")}</span>
                  </div>

                  {/* Botões */}
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button
                      onClick={handleSaveAvatar}
                      disabled={isSaving || !isEditorReady}
                    >
                      {isSaving ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("config.avatarSaving")}
                        </span>
                      ) : (
                        t("config.avatarSave")
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="cursor-pointer rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-hover-bg hover:text-text-primary"
                    >
                      {t("config.avatarCancel")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
