import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Input from "../../components/ui/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMaskInput } from "react-imask";
import useSupabaseStore from "../../store/useSupabaseStore";
import {
  PROVINCES,
  UNIT_TYPES,
  STATUS_TYPES,
  unitSchema,
  type UnitFormData,
} from "../../schemas/formSchema";
import Select from "../../components/ui/Select";
import AddressAutocomplete from "../../components/ui/AddressAutocomplete";
import { Phone, Mail, Globe, FileText, ArrowLeft } from "../../icons";
import ImageUpload from "../../components/ui/ImageUpload";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import type { AddressSelection } from "../../types/unit";
import { getUserProvince, isGeneralAdmin } from "../../utils/access";
import { translateProvinceName } from "../../utils/provinceLabels";

export default function ImovelForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { insertUnit, clearMessage, uploadImage, setError, erro, user, profile } =
    useSupabaseStore();
  const userProvince = getUserProvince(profile, user) ?? undefined;
  const hasGlobalAccess = isGeneralAdmin(profile, user);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoading } = useSupabaseStore();
  const isSavingUnit = isLoading || isSubmitting;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema) as Resolver<UnitFormData>,
  });

  useEffect(() => {
    if (userProvince) {
      setValue("province", userProvince as UnitFormData["province"]);
    }
  }, [setValue, userProvince]);

  const onSubmit = async (data: UnitFormData) => {
    clearMessage();
    setIsSubmitting(true);

    let imageUrl = "https://placehold.co/600x400?text=Sem+Imagem";

    // ✅ Faz o upload ANTES de inserir no banco
    if (selectedFile) {
      try {
        imageUrl = await uploadImage(selectedFile);
      } catch (e) {
        console.error(e);
        setIsSubmitting(false);
        setError(t("form.errorUpload"));
        return;
      }
    }

    // ✅ Inclui image_url no objeto final
    const success = await insertUnit({ ...data, image_url: imageUrl });

    if (success) {
      navigate("/imoveis");
      return;
    }

    setIsSubmitting(false);
  };

  const handleAddressSelect = (data: AddressSelection) => {
    setValue("address", data.display_name);
    setValue("city", data.city);
    setValue("state", data.state);
    setValue("country", data.country);
    setValue("zip_code", data.zip_code);
    setValue("latitude", parseFloat(data.latitude));
    setValue("longitude", parseFloat(data.longitude));
  };

  return (
    <div className="bg-background min-h-screen py-10 flex justify-center items-center">
      <div className="w-full max-w-4xl rounded-lg shadow-lg overflow-hidden my-6">
        {/* Header Visual */}
        <div className="relative flex flex-col items-center bg-linear-to-r from-primary-dark to-primary-light text-white">
          <span className="h-1 w-full bg-linear-to-r from-gold-dark to-gold-light" />
          <button
            onClick={() => navigate("/imoveis")}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium mt-0.5 cursor-pointer"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t("form.back")}</span>
          </button>
          <p className="p-3 font-bold text-xl tracking-wider">
            {t("form.createTitle")}
          </p>
        </div>

        <div className="bg-surface p-8">
          <form className="w-full space-y-8" onSubmit={handleSubmit(onSubmit)}>
            {/* --- SEÇÃO 1: IDENTIFICAÇÃO --- */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-primary-dark dark:text-gold-light border-b border-border-subtle pb-2">
                {t("form.identification")}
              </h2>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1 text-label"
                >
                  {t("form.unitName")}
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("form.namePlaceholder")}
                  errors={errors.name}
                  register={register}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium mb-1 text-label"
                  >
                    {t("form.type")}
                  </label>
                  <Select
                    id="type"
                    errors={errors.type}
                    placeholder={t("form.selectPlaceholder")}
                    register={register}
                  >
                    {UNIT_TYPES.map((unit, index) => (
                      <option key={index} value={unit}>
                        {t(`types.${unit}`, unit)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium mb-1 text-label"
                  >
                    {t("form.status")}
                  </label>
                  <Select
                    id="status"
                    errors={errors.status}
                    placeholder={t("form.selectPlaceholder")}
                    register={register}
                  >
                    {STATUS_TYPES.map((stat, index) => (
                      <option key={index} value={stat}>
                        {t(`status.${stat}`, stat)}
                      </option>
                    ))}
                  </Select>
                </div>

                {hasGlobalAccess && (
                  <div>
                    <label
                      htmlFor="province"
                      className="block text-sm font-medium mb-1 text-label"
                    >
                      {t("form.province")}
                    </label>
                    <Select
                      id="province"
                      errors={errors.province}
                      placeholder={t("form.selectPlaceholder")}
                      register={register}
                    >
                      {PROVINCES.map((province) => (
                        <option key={province} value={province}>
                          {translateProvinceName(province)}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                </div>
              </div>

            {/* --- SEÇÃO 2: LOCALIZAÇÃO --- */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-primary-dark dark:text-gold-light border-b border-border-subtle pb-2">
                {t("form.location")}
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1 text-label">
                  {t("form.addressSearch")}
                </label>
                <AddressAutocomplete
                  onSelectAddress={handleAddressSelect}
                  error={errors.address}
                />
                {!hasGlobalAccess && <input type="hidden" {...register("province")} />}
                <input type="hidden" {...register("address")} />
                <input type="hidden" {...register("latitude")} />
                <input type="hidden" {...register("longitude")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium mb-1 text-label"
                  >
                    {t("form.country")}
                  </label>
                  <Input
                    id="country"
                    type="text"
                    errors={errors.country}
                    register={register}
                    placeholder={t("form.countryPlaceholder")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium mb-1 text-label"
                  >
                    {t("form.state")}
                  </label>
                  <Input
                    id="state"
                    type="text"
                    errors={errors.state}
                    register={register}
                    placeholder={t("form.statePlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium mb-1 text-label"
                  >
                    {t("form.city")}
                  </label>
                  <Input
                    id="city"
                    type="text"
                    errors={errors.city}
                    register={register}
                    placeholder={t("form.cityPlaceholder")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="zip_code"
                    className="block text-sm font-medium mb-1 text-label"
                  >
                    {t("form.zipCode")}
                  </label>
                  <Controller
                    name="zip_code"
                    control={control}
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                      <IMaskInput
                        mask="00000-000" // No imask, '0' representa qualquer número
                        value={value || ""}
                        unmask={false} // Mantém a máscara visualmente
                        onAccept={(value: string) => onChange(value)} // Envia o valor digitado pro form
                        onBlur={onBlur}
                        inputRef={ref} // Conecta a referência pro focus automático em caso de erro
                        id="zip_code"
                        placeholder={t("form.zipPlaceholder")}
                        className={`bg-surface w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-text-primary ${
                          errors.zip_code
                            ? "border-red-500 focus:ring-red-500/20"
                            : "border-border-default focus:ring-gold-light"
                        }`}
                      />
                    )}
                  />
                  {errors.zip_code && (
                    <span className="text-red-500 text-sm mt-1 ml-1">
                      {errors.zip_code.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* --- SEÇÃO 3: CONTATO E MÍDIA --- */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-primary-dark dark:text-gold-light border-b border-border-subtle pb-2">
                {t("form.contact")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lado Esquerdo: Inputs de Texto */}
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium mb-1 text-label"
                    >
                      {t("form.phone")}
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <Phone className="text-gold-dark w-5 h-5" />
                      </div>

                      <Controller
                        name="phone"
                        control={control}
                        render={({
                          field: { onChange, onBlur, value, ref },
                        }) => (
                          <IMaskInput
                            mask="+00 (00) 00000-0000" // '0' representa número
                            value={value || ""}
                            onAccept={(value: string) => onChange(value)}
                            onBlur={onBlur}
                            inputRef={ref}
                            id="phone"
                            placeholder={t("form.phonePlaceholder")}
                            className={`bg-surface w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-text-primary ${
                              errors.phone
                                ? "border-red-500 focus:ring-red-500/20"
                                : "border-border-default focus:ring-gold-light"
                            }`}
                          />
                        )}
                      />
                    </div>
                    {errors.phone && (
                      <span className="text-red-500 text-sm mt-1 ml-1">
                        {errors.phone.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-1 text-label"
                    >
                      {t("form.email")}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      errors={errors.email}
                      register={register}
                      placeholder={t("form.emailPlaceholder")}
                      Icon={Mail}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium mb-1 text-label"
                    >
                      {t("form.website")}
                    </label>
                    <Input
                      id="website"
                      type="url"
                      errors={errors.website}
                      register={register}
                      placeholder={t("form.websitePlaceholder")}
                      Icon={Globe}
                    />
                  </div>
                </div>

                {/* Lado Direito: Upload de Imagem */}
                <div className="h-full">
                  <ImageUpload
                    onImageSelected={(file) => setSelectedFile(file)}
                    error={errors.image_url}
                  />
                </div>
              </div>

              {/* Descrição em baixo de tudo */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-1 text-label"
                >
                  {t("form.description")}
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="text-gold-dark w-5 h-5" />
                  </div>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={4}
                    className={`bg-surface w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-text-primary ${
                      errors.description
                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                        : "border-border-default focus:ring-gold-light focus:border-gold-light"
                    }`}
                    placeholder={t("form.descPlaceholder")}
                  />
                </div>
                {errors.description && (
                  <span className="text-red-500 text-sm mt-1 ml-1">
                    {errors.description.message}
                  </span>
                )}
              </div>
            </div>

            {erro && (
              <div className="p-3 light:bg-red-50 dark:bg-red-900/20 border light:border-red-300 dark:border-red-800 rounded-lg light:text-red-700 dark:text-red-400 text-sm">
                {erro}
              </div>
            )}

            {/* BOTÃO DE SALVAR */}
            <div className="pt-4 flex justify-end">
              <Button disabled={isSavingUnit} type="submit">
                {isSavingUnit ? t("form.saving") : t("form.save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
