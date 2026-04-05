import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { EmailIcon, PasswordIcon, UserIcon } from "../../icons";
import Input from "../../components/ui/Input";
import PasswordToggle from "../../components/ui/PasswordToggle";
import {
  registerSchema,
  type registerFormData,
} from "../../schemas/authSchema";
import { useClickOutside } from "../../hooks/useClickOutside";
import useSupabaseStore from "../../store/useSupabaseStore";
import imgLogo from "../../assets/sao-camilo-logo.png";
import { USER_REGISTRATION_PROVINCES } from "../../constants/provinces";
import { translateProvinceName } from "../../utils/provinceLabels";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isProvinceMenuOpen, setIsProvinceMenuOpen] = useState(false);
  const provinceMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, registerUser, isLoading, clearMessage } = useSupabaseStore();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<registerFormData>({
    resolver: zodResolver(registerSchema),
  });

  useClickOutside(provinceMenuRef, () => setIsProvinceMenuOpen(false), isProvinceMenuOpen);

  useEffect(() => {
    clearMessage();
  }, [clearMessage]);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const onSubmit = async (data: registerFormData) => {
    const hasRegistered = await registerUser(data);

    if (hasRegistered) {
      clearMessage();
      navigate("/login", {
        state: { registrationPending: true },
      });
    }
  };

  return (
    <div className="gap-6 flex min-h-screen flex-col items-center justify-center bg-background p-6/s">
      <img
        src={imgLogo}
        alt={t("common.logoAlt", { defaultValue: "Logo da Sao Camilo" })}
        className="h-16 drop-shadow-md"
      />

      <div className="w-full overflow-hidden rounded-2xl border border-border-default bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.12)] sm:max-w-xl">
        <div className="relative flex flex-col items-center bg-linear-to-r from-primary-dark to-primary-light text-white">
          <span className="absolute left-0 top-0 h-1.5 w-full bg-linear-to-r from-gold-dark to-gold-light" />
          <p className="py-4 text-[16px] font-bold tracking-widest text-white/90">
            {t("register.registerTitle")}
          </p>
        </div>

        <div className="bg-surface p-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col items-center gap-5"
          >
            <Input
              id="name"
              type="text"
              placeholder={t("register.name")}
              Icon={UserIcon}
              errors={errors.name}
              register={register}
            />

            <Input
              id="email"
              type="email"
              placeholder={t("register.email")}
              Icon={EmailIcon}
              errors={errors.email}
              register={register}
            />

            <Controller
              name="province"
              control={control}
              render={({ field }) => (
                <div className="mb-4 flex w-full flex-col">
                  <div className="relative w-full" ref={provinceMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsProvinceMenuOpen((current) => !current)}
                      className={`flex w-full items-center justify-between rounded-lg border bg-surface px-4 py-2 text-left text-text-primary transition-colors focus:outline-none focus:ring-2 ${
                        errors.province
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border-default focus:border-gold-light focus:ring-gold-light"
                      } ${!field.value ? "text-text-secondary" : ""}`}
                      aria-haspopup="listbox"
                      aria-expanded={isProvinceMenuOpen}
                    >
                      <span>
                        {field.value
                          ? translateProvinceName(field.value)
                          : t("register.province")}
                      </span>
                      <span
                        className={`ml-3 text-sm text-text-secondary transition-transform ${
                          isProvinceMenuOpen ? "rotate-180" : ""
                        }`}
                      >
                        v
                      </span>
                    </button>

                    {isProvinceMenuOpen && (
                      <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-lg border border-border-default bg-surface shadow-lg">
                        <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
                          {USER_REGISTRATION_PROVINCES.map((province) => {
                            const isSelected = field.value === province;

                            return (
                              <li key={province}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(province);
                                    setIsProvinceMenuOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-hover-bg ${
                                    isSelected
                                      ? "bg-gold-light/10 font-semibold text-text-primary"
                                      : "text-text-primary"
                                  }`}
                                >
                                  {translateProvinceName(province)}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {errors.province && (
                    <span className="ml-1 mt-1 text-sm text-red-500">
                      {errors.province.message}
                    </span>
                  )}
                </div>
              )}
            />

            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("register.password")}
              Icon={PasswordIcon}
              errors={errors.password}
              register={register}
            >
              <PasswordToggle
                setShowPassword={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
              />
            </Input>

            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder={t("register.confirmPassword")}
              Icon={PasswordIcon}
              errors={errors.confirmPassword}
              register={register}
            >
              <PasswordToggle
                setShowPassword={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
              />
            </Input>

            <button
              className="mt-4 w-full cursor-pointer rounded-xl bg-linear-to-r from-gold-dark to-gold-light py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:brightness-112 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? t("register.loading") : t("register.submit")}
            </button>

            <Link
              className="mt-3 font-medium text-gold-dark transition-colors hover:text-gold-light hover:underline"
              onClick={() => clearMessage()}
              to="/login"
            >
              {t("register.backToLogin")}
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
