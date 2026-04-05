import { OffEyeIcon, OnEyeIcon } from "../../icons";

interface Props {
  setShowPassword: () => void;
  showPassword: boolean;
}

export default function PasswordToggle({ setShowPassword, showPassword }: Props) {
  return (
    <button
      type="button"
      onClick={setShowPassword}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-gold-light transition-colors cursor-pointer"
    >
      {showPassword ? (
        <span>
          <OffEyeIcon />
        </span>
      ) : (
        <span>
          <OnEyeIcon />
        </span>
      )}
    </button>
  );
}
