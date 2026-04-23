/**
 * Tipos do banco de dados.
 *
 * **Placeholder** até rodarmos `supabase gen types typescript` contra o projeto
 * real. Usar `any` mantém a compilação simples enquanto não há tipos gerados;
 * a segurança de tipos real chega quando fizermos:
 *
 *   npx supabase gen types typescript --project-id <id> --schema public \
 *     > types/database.ts
 *
 * Enquanto isso, a tipagem efetiva do domínio vem de `types/index.ts`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = any;
