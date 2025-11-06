import { useNavigate } from "react-router";

export function Form() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    fetch("https://formsubmit.co/matheus797915@gmail.com", {
      method: "POST",
      body: formData,
    })
      .then(() => {
        navigate("/thanks");
      })
      .catch((error) => {
        console.error("Erro ao enviar:", error);
      });
  };

  return (
    <form
      className="max-w-[532px] w-full flex flex-col gap-[22px]"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="_captcha" value="false" />
      <input type="text" name="_honey" style={{ display: "none" }} />

      <div className="flex flex-col gap-[25px]">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-p mb-1"
          >
            Nome
          </label>
          <input
            placeholder="Digite seu nome"
            required
            type="text"
            name="name"
            className="text-text-p w-full border border-text-p rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-p mb-1"
          >
            Email
          </label>
          <input
            placeholder="Digite um email"
            required
            type="email"
            name="email"
            className="text-text-p w-full border border-text-p rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-text-p mb-1"
          >
            Mensagem
          </label>
          <textarea
            required
            placeholder="Digite sua mensagem aqui..."
            name="message"
            className="px-3 py-2 text-text-p w-full border border-text-p rounded-lg h-[165px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-x text-text-btn text-[16px] py-2 px-4 rounded-lg hover:opacity-75"
      >
        Enviar
      </button>
    </form>
  );
}
