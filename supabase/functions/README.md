## `delete-auth-user`

Edge Function para:

1. remover arquivos do usuario nos buckets configurados
2. apagar o usuario do Supabase Auth

### Variaveis de ambiente

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `USER_STORAGE_BUCKETS`
  - lista separada por virgula com os buckets que podem ser limpos
  - exemplo: `unit-images`
- `ADMIN_USER_IDS` (opcional)
  - lista separada por virgula com UUIDs de super-admin para bypass operacional
  - a regra principal agora usa `public.profiles.role = 'admin'` na mesma provincia do usuario alvo

### Deploy

```bash
supabase functions deploy delete-auth-user
```

### Secrets

```bash
supabase secrets set \
  USER_STORAGE_BUCKETS="unit-images"
```

### Chamada

Use o access token de um usuario admin autorizado na mesma provincia do usuario alvo:

```ts
const { data, error } = await supabase.functions.invoke("delete-auth-user", {
  body: { userId: "UUID_DO_USUARIO" },
});
```

### Resposta esperada

```json
{
  "success": true,
  "deletedUserId": "UUID_DO_USUARIO",
  "deletedFiles": 3,
  "skippedBuckets": []
}
```

### Observacoes

- A function remove apenas arquivos de buckets listados em `USER_STORAGE_BUCKETS`.
- Se o usuario tiver arquivos em outros buckets, eles vao aparecer em `skippedBuckets` e a exclusao pode continuar bloqueada.
- Nao exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend.
