# Frozen demo build — November 2

Code commit `ed5d7a4`, image `twice:ec2-demo-polish`; ARM archive SHA256 `5bbd9fc68644800b679c3613f676a5d1747fe53c4c6e04ceaefa07498106daee`. Private upload/host checksum verified; deployment `bde18daa-69cd-411a-ab5d-68300dfe1e65` replaced only the app. Runtime checks: ARM64, updated copy and Toolkit repair present, project dotenv excluded, zero OOM/restarts at startup.

631tests, typecheck and14-guard doctor pass. Earlier six real-component queue cases remain applicable; the patch did not change. Astra/medium reviewed the UI diff and comparison: PROCEED to freeze/deploy, with no general speed/reliability claim.

Verified after deployment:

- Trusted HTTPS200; anonymous action401 and uninvited signup403.
- Fresh first-screen guidance at390px, document width390, dark mode: [screenshot](first-screen-polish-mobile-2026-11-02.png). This visual check used isolated local data and made no model call.
- Real production preparation saved Juniper/Alder drafts and Hazel blocked in4s, after the excluded comparison fixture was archived.
- UI table confirmation displayed the pre-execution notice. The same mounted page remained open while Claude Code/OpenRouter GPT5.4Mini previewed and requested native approval. Review `0ad16ca2-dc6a-4cac-8e47-98e6f7234239` was granted once; the exact retained JSON executed without another preview.
- External execution yielded **2Done/1Blocked/0Partial**. The original UI updated without reload and the obsolete confirmation notice disappeared. [Independent readback](polish-mcp-outcomes-2026-11-02.json) verifies IDs, Hazel unstarted/no record and exact approved version/hash. [Final UI](frozen-release-2026-11-02.png).
- The excluded in-app baseline resource was converted to an inert archive, its command disabled, then moved to `comparison-archive/invalid-in-app-baseline.md` using Core's public resource API. Same ID/owner/visibility/content preserved; removed from operational skill paths. Move verification `1ef9b4d1-f1bd-4c47-9ac0-138d4f62f6b4` passed.

Backend/state behavior is also covered by the [fresh-data UI rehearsal](fresh-rehearsal-2026-11-02.md) and [fair native-skill control](comparison-2026-11-02.md). Current app-level rubric estimate7.5/10 is a judgment, not a judge result or winning probability. Demand/time savings and the skill-plus-helper comparison remain unproven.

No further feature work is planned. Eligibility, creator/contact confirmation, public Clips recording/access check and submission/receipt remain separate gates. No recording, posting, public repository or submission performed.

Final health/backup check `5476fff9-a488-4ef1-9337-4d296a2a44e0`: private encrypted backup uploaded, app313.1MiB/DB63.05MiB/Caddy27.83MiB, zero OOM/restarts. Checked Nov2 before final handoff.
