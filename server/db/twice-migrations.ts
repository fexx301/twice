function owned(name: string, columns: string) {
  return `CREATE TABLE IF NOT EXISTS ${name} (id TEXT PRIMARY KEY, ${columns}, owner_email TEXT NOT NULL, org_id TEXT, visibility TEXT NOT NULL DEFAULT 'private', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
}
function shares(name: string) {
  return `CREATE TABLE IF NOT EXISTS ${name} (id TEXT PRIMARY KEY, resource_id TEXT NOT NULL, principal_type TEXT NOT NULL, principal_id TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, notified_at TEXT)`;
}
export const twiceInitialSchema = [
  owned("twice_recipes", "title TEXT NOT NULL, demonstration_id TEXT, proposal_json TEXT NOT NULL DEFAULT '[]', exclusions_json TEXT NOT NULL DEFAULT '[]', proposal_summary TEXT NOT NULL DEFAULT '', proposal_actor_json TEXT NOT NULL DEFAULT '{}', active_version_id TEXT, revision INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"),
  owned("twice_demonstrations", "recipe_id TEXT NOT NULL, title TEXT NOT NULL, trace_json TEXT NOT NULL DEFAULT '[]', revision INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"),
  owned("twice_recipe_versions", "recipe_id TEXT NOT NULL, title TEXT NOT NULL, definition_json TEXT NOT NULL, content_hash TEXT NOT NULL, history_id TEXT, provenance_json TEXT NOT NULL, accepted_at TEXT"),
  owned("twice_batches", "recipe_id TEXT NOT NULL, title TEXT NOT NULL, source_text TEXT NOT NULL DEFAULT '', is_sample INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, preparation_actor_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"),
  owned("twice_rows", "batch_id TEXT NOT NULL, client_name TEXT NOT NULL, stage TEXT, uncertain INTEGER NOT NULL DEFAULT 1, uncertainty TEXT NOT NULL DEFAULT '', source_text TEXT NOT NULL DEFAULT '', state TEXT NOT NULL DEFAULT 'Draft', position INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, confirmed_revision INTEGER, recipe_version_id TEXT, started_at TEXT, finished_at TEXT, execution_state TEXT NOT NULL DEFAULT 'unstarted', run_id TEXT, record_id TEXT, entry_id TEXT, task_id TEXT, error TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"),
  owned("twice_runs", "batch_id TEXT NOT NULL, recipe_version_id TEXT NOT NULL, payload_hash TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'running', result_json TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"),
  ...["recipe", "demonstration", "version", "batch", "row", "run"].map(name => shares(`twice_${name}_shares`)),
  "CREATE INDEX IF NOT EXISTS twice_recipes_owner_idx ON twice_recipes(owner_email, org_id)",
  "CREATE INDEX IF NOT EXISTS twice_versions_recipe_idx ON twice_recipe_versions(recipe_id, owner_email)",
  "CREATE INDEX IF NOT EXISTS twice_rows_batch_idx ON twice_rows(batch_id, owner_email, position)",
  "CREATE INDEX IF NOT EXISTS twice_runs_batch_idx ON twice_runs(batch_id, owner_email)",
].join(";\n");
