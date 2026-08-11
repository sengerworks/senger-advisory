import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Phase 7 migration enforces POC-window and permanent Brief access",async()=>{const sql=await readFile(new URL("../db/migrations/044_executive_brief_release_access.sql",import.meta.url),"utf8");assert.match(sql,/access_mode text CHECK \(access_mode IN \('poc-window','permanent'\)\)/);assert.match(sql,/access_expires_at timestamptz/);assert.match(sql,/status = 'released'.*access_mode = 'permanent'/s);assert.match(sql,/status = 'released'.*access_mode = 'poc-window'.*access_expires_at > released_at/s);assert.match(sql,/sponsor_notification_status/);});
