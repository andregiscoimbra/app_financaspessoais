-- =============================================================================
-- CONFIGURAÇÃO DO CRON DIÁRIO (pg_cron)
--
-- Este arquivo é OPCIONAL e só precisa rodar se você quer que as recorrências
-- sejam geradas AUTOMATICAMENTE todo dia. Alternativa: usar o botão
-- "Executar agora" na página /recorrencias.
--
-- PASSO A PASSO:
--
-- 1) No painel do Supabase → Database → Extensions → procure "pg_cron"
--    → clique em "Enable extension".
--
-- 2) Depois da extensão habilitada, abra o SQL Editor e cole este arquivo
--    inteiro. Clique em Run.
--
-- 3) Para verificar se o agendamento foi criado:
--    select * from cron.job where jobname = 'recurring-transactions-daily';
--
-- HORÁRIO: 06:00 UTC = 03:00 Brasília (baixa atividade).
-- Se quiser mudar, ajuste a expressão cron abaixo. Formato: minuto hora * * *
-- =============================================================================

-- Remove agendamento antigo se existir (idempotência — seguro rodar várias vezes)
select cron.unschedule('recurring-transactions-daily')
where exists (
  select 1 from cron.job where jobname = 'recurring-transactions-daily'
);

-- Agenda a chamada diária (06:00 UTC)
select cron.schedule(
  'recurring-transactions-daily',
  '0 6 * * *',
  $$select public.generate_recurring_transactions_today();$$
);
