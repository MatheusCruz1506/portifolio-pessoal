import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { EmailIcon, PasswordIcon } from "../../icons";
import Footer from "../../components/ui/Footer";
import Input from "../../components/ui/Input";
import PasswordToggle from "../../components/ui/PasswordToggle";
import { loginSchema, type loginFormData } from "../../schemas/authSchema";
import useSupabaseStore from "../../store/useSupabaseStore";
import logo from "../../assets/sao-camilo-logo.png"


export default function Login() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { user, isLoading, loginUser, setError, setMessage } = useSupabaseStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<loginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!location.state || typeof location.state !== "object") {
      return;
    }

    if ("registrationPending" in location.state && location.state.registrationPending) {
      setError(null);
      setMessage(
        t("feedback.auth.pendingApproval", {
          defaultValue:
            "Seu cadastro está pendente de aprovação. Aguarde a liberação da Administração geral para fazer login.",
        }),
      );

      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate, setError, setMessage, t]);

  const onSubmit = async (data: loginFormData) => {
    await loginUser(data);
  };

  return (
    <div className=" gap-6 min-h-screen bg-background relative flex w-full flex-col items-center justify-between overflow-hidden p-6 sm:p-12">
      <div className="relative flex w-full flex-col items-center gap-4 justify-center ">
        <img src={logo} alt="" className="sm:h-36 h-24"/>
      </div>

      <div className="flex w-full items-center justify-center">
        <div className="w-full overflow-hidden rounded-2xl border border-border-default bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.12)] sm:max-w-105">
          <div className="relative flex flex-col items-center justify-center bg-linear-to-r from-primary-dark to-primary-light text-white">
            <span className="left-0 top-0 h-1.5 w-full bg-linear-to-r from-gold-dark to-gold-light" />
            <p className="py-2.5 text-[16px] font-bold tracking-widest text-white/90">
              {t("login.loginTitle")}
            </p>
          </div>

          <div className="p-8 pb-10">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              autoComplete="on"
            >
              <Input
                id="email"
                type="email"
                placeholder={t("login.email")}
                name="email"
                autoComplete="email"
                ariaLabel={t("login.email")}
                autoCapitalize="none"
                spellCheck={false}
                Icon={EmailIcon}
                errors={errors.email}
                register={register}
              />

              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("login.password")}
                name="password"
                autoComplete="current-password"
                ariaLabel={t("login.password")}
                spellCheck={false}
                Icon={PasswordIcon}
                errors={errors.password}
                register={register}
              >
                <PasswordToggle
                  setShowPassword={() => setShowPassword(!showPassword)}
                  showPassword={showPassword}
                />
              </Input>

              <button
                className="mt-4 w-full cursor-pointer rounded-xl bg-linear-to-r from-gold-dark to-gold-light py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:brightness-112 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? t("login.loading") : t("login.submit")}
              </button>

              <div className=" text-center">
                <Link
                  className="font-medium text-gold-dark transition-colors hover:text-gold-light hover:underline"
                  to="/register"
                >
                  {t("login.registerLink")}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
