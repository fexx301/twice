---
name: baseline-native-onboarding
description: Parse up to five clients from notes, confirm exact names, stages, destination, and task before writes.
user-invocable: true
scope: both
---

# Baseline Native Onboarding

## Purpose
Use a fixed Native SQL CRM connection and list to stage fictional onboarding records only after explicit approval.

## Fixed bindings
- connectionId: f93b4beb-d729-4c98-b1d8-002f0394bbc8
- listId: ae282fde-a6c0-4c83-a549-90e938fa149b

## Workflow
1. Parse up to five clients from notes.
2. Show exact client names, stages, fixed destination, and task before any writes.
3. Leave uncertain stages untouched.
4. Wait for explicit approval.
5. For each approved client, call:
   - create-crm-record(kind="account", displayName=client name, connectionId=fixed connectionId)
   - add-crm-record-to-list(listId=fixed listId, recordId=new recordId, values.stage=client stage)
   - manage-crm-task(recordId=same recordId, title="Send onboarding pack", status="open")
6. Never retry a partial or unknown write.
7. Read back actual records, entries, and tasks after execution.

## Notes
- Client name and stage vary.
- All other settings are fixed.
- Use the exact action names above and keep ID-binding rules fixed.

