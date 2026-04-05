import * as z from "zod";
import { USER_REGISTRATION_PROVINCES } from "../constants/provinces";

export const loginSchema = z.object({
  email: z.email({ error: "Formato de e-mail inválido" })
    .min(1, { error: "Esse campo é obrigatório" }),
  password: z.string({ error: "Senha incorreta" })
    .min(1, { error: "Este campo é obrigatório" }),
})

export const registerSchema = z.object({
  name: z.string({ error: "Este campo é obrigatório." })
    .min(3, { error: "O nome deve ter pelo menos 3 caracteres." })
    .max(100, { error: "O nome é muito longo." }),

  email: z.string().trim().check(z.email({ error: "E-mail inválido" })).toLowerCase(),

  province: z.enum(USER_REGISTRATION_PROVINCES, {
    error: "Selecione uma província válida.",
  }),

  password: z.string({ error: "Este campo é obrigatório." })
    .min(8, { error: "A senha precisa ter no mínimo 8 caracteres." })
    .regex(/[A-Z]/, { error: "A senha deve conter pelo menos uma letra maiúscula." })
    .regex(/[a-z]/, { error: "A senha deve conter pelo menos uma letra minúscula." })
    .regex(/[0-9]/, { error: "A senha deve conter pelo menos um número." })
    .regex(/[^A-Za-z0-9]/, { error: "A senha deve conter pelo menos um caractere especial." }),

  confirmPassword: z.string({ error: "Este campo é obrigatório." })
    .min(1, { error: "Este campo é obrigatório." })
}).refine((data) => data.password === data.confirmPassword, {
  error: "As senhas não coincidem.", // Atualizado para 'error'
  path: ["confirmPassword"],
});

export type loginFormData = z.infer<typeof loginSchema>;
export type registerFormData = z.infer<typeof registerSchema>;
