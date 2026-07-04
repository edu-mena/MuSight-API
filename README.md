# MuSight-API

Backend do GiraSightin — plataforma de jornalismo cívico angolano (artigos em 3 níveis, debates com especialistas, assistente de IA "Weza").

## Stack

- Node.js (ESM, `"type": "module"`) + Express 5
- Prisma ORM + MySQL
- JWT (`jsonwebtoken`) + `bcryptjs` para autenticação
- Zod para validação
- Winston para logging
- Multer + `file-type` para upload de áudio/imagem (validação real de MIME por magic bytes)
- `@google/genai` (Gemini) para a Weza
- Vitest + ESLint + Prettier

## Setup local

1. `npm install`
2. Copiar `.env.example` para `.env` e preencher todas as variáveis (ver secção abaixo)
3. `npm run prisma:migrate` — cria as tabelas
4. `npm run prisma:seed` — cria a conta admin por omissão (`ADMIN_EMAIL`/`ADMIN_PASSWORD`, ou `admin@musight.local` / `admin123456` se não definires nada — **muda a password antes de ires para produção**)
5. `npm run dev`

## Variáveis de ambiente

| Variável                            | Obrigatória | Notas                                                                                                         |
| ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                          | sim         | `development` ou `production`                                                                                 |
| `PORT`                              | sim         | porta local; em produção o Hostinger injeta a sua própria                                                     |
| `JWT_SECRET`                        | sim         | string aleatória ≥32 caracteres; **nunca reutilizar entre ambientes**                                         |
| `JWT_EXPIRES_IN`                    | sim         | ex: `30d`                                                                                                     |
| `DATABASE_URL`                      | sim         | `mysql://user:password@host:3306/db` — caracteres especiais na password têm de ser percent-encoded            |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | sim         | envio de emails (confirmação/reset), usa app password do Gmail, não a password normal                         |
| `API_URL`                           | sim         | usado para montar o link de confirmação de email                                                              |
| `FRONTEND_URL`                      | sim         | usado para montar o link de reset de password                                                                 |
| `CORS_ORIGINS`                      | sim         | lista separada por vírgulas, sem espaços; nunca usar wildcard `*` (a app usa cookies com `credentials: true`) |
| `UPLOAD_MAX_SIZE_MB`                | sim         | default sensato: `50`                                                                                         |
| `GEMINI_API_KEY`                    | sim         | chave da Gemini para a Weza                                                                                   |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`    | não         | só usadas pelo `prisma:seed`; se omitidas, usa valores por omissão (só para dev)                              |

A app falha a arrancar (fail-fast) se qualquer variável obrigatória estiver em falta — isto é intencional.

## Scripts

```
npm run dev             # desenvolvimento, com reinício automático
npm start                # produção
npm run prisma:migrate  # aplica migrations (dev)
npm run prisma:generate # gera o Prisma Client
npm run prisma:seed     # cria a conta admin por omissão
npm run prisma:studio   # explorador visual da BD
npm run lint / lint:fix
npm run format / format:check
npm test
```

## Deployment (Hostinger — Node.js App Manager)

1. Criar o `.env` de produção diretamente no servidor (nunca via git — está no `.gitignore`).
2. `npm install` (o `postinstall` já corre `prisma generate` sozinho).
3. `npx prisma migrate deploy` — versão de produção do migrate, não interativa, só aplica migrations já criadas (**nunca `migrate dev` em produção**). Requer acesso a um terminal/SSH nesse servidor.
4. `npm run prisma:seed` (uma vez, para garantir que existe conta admin).
5. Arrancar via `npm start`, gerido pelo Node.js App Manager do Hostinger (equivalente a ter PM2 — reinicia sozinho em caso de crash).
6. Confirmar que `CORS_ORIGINS` inclui o domínio real do frontend em produção (ex: `https://musight.vercel.app`), e que `NODE_ENV=production` (isto ativa `secure`/`sameSite:'none'` nos cookies de sessão — necessário porque a API e o frontend vivem em domínios diferentes).

### Limitação conhecida — uploads em disco local

Os ficheiros de `uploads/audio` e `uploads/images` vivem no disco local do servidor. Se o plano Hostinger reiniciar o processo/container sem disco persistente garantido, os ficheiros já enviados podem perder-se. Se isto acontecer em produção, a alternativa é migrar `src/config/upload.js` para um storage externo (Cloudinary/S3) — é uma troca isolada, só esse ficheiro muda.

### Em aberto

- Confirmar se o plano Hostinger dá acesso a terminal/SSH para correr `prisma migrate deploy` — se não, a migration tem de ser corrida a partir de outra máquina apontando temporariamente o `DATABASE_URL` para a BD de produção.
