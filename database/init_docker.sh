#!/usr/bin/env bash
set -Eeuo pipefail
SQLCMD=/opt/mssql-tools18/bin/sqlcmd
if [[ ! -x "$SQLCMD" ]]; then echo "ERROR: sqlcmd not installed" >&2; exit 1; fi
run() { "$SQLCMD" -S sqlserver -U sa -P "$MSSQL_SA_PASSWORD" -C -b "$@"; }
# Never overwrite an existing database. On an existing database, verify full schema.
if run -d master -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name=N'PersonalFinanceEducation'" | grep -qx '1'; then
  count="$(run -d PersonalFinanceEducation -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo') AND name IN (N'users',N'categories',N'transactions',N'budgets',N'budget_items',N'financial_goals',N'goal_contributions',N'saving_scenarios',N'learning_lessons',N'learning_attempts',N'recurring_transactions',N'recurring_postings')" | tr -d '\r' | tr -d '[:space:]')"
  if [[ "$count" != '12' ]]; then
    echo "ERROR: Existing PersonalFinanceEducation database has $count of 12 expected tables. Refusing automatic changes. Back up and inspect manually." >&2
    exit 1
  fi
  echo "Existing database has all 12 original tables; applying non-destructive FinanceLab extension."
  # The only SQL source is PersonalFinanceEducation.sql; extract its idempotent extension.
  sed -n '/^-- FINANCELAB_VNEXT_BEGIN$/,/^-- FINANCELAB_VNEXT_END$/p' /database/PersonalFinanceEducation.sql >/tmp/financelab_extension.sql
  run -d PersonalFinanceEducation -i /tmp/financelab_extension.sql
  sed -n '/^-- FINANCELAB_EDUCATION_COMPLETE_BEGIN$/,/^-- FINANCELAB_EDUCATION_COMPLETE_END$/p' /database/PersonalFinanceEducation.sql >/tmp/financelab_final_extension.sql
  run -d PersonalFinanceEducation -i /tmp/financelab_final_extension.sql
  echo "Existing database upgraded without deleting accounts or transactions."
else
  echo "New installation: initializing FinanceLab schema and learning sample data."
  run -d master -i /database/PersonalFinanceEducation.sql
  echo "Database initialized."
fi

# Verify the complete database contract after initial install or upgrade.
expected_tables="N'users',N'categories',N'transactions',N'budgets',N'budget_items',N'financial_goals',N'goal_contributions',N'saving_scenarios',N'learning_lessons',N'learning_attempts',N'recurring_transactions',N'recurring_postings',N'budget_plans',N'learning_questions',N'learning_question_attempts',N'learning_profiles',N'learning_topics',N'learning_assessments',N'budget_reviews',N'practice_attempts',N'budget_change_history'"
actual_tables="$(run -d PersonalFinanceEducation -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables WHERE schema_id=SCHEMA_ID(N'dbo') AND name IN ($expected_tables)" | tr -d '\r' | tr -d '[:space:]')"
if [[ "$actual_tables" != '21' ]]; then
  echo "ERROR: database has $actual_tables/21 expected FinanceLab tables. Backend will not start." >&2
  exit 1
fi
echo "FinanceLab schema verified: 21/21 expected tables."
