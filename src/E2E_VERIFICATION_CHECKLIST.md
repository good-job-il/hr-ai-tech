# End-to-End Verification Checklist - General Pool Flow

## Test Scenario

Send CV to: `r.rodion2802+pool@gmail.com`

## Pre-Test State

- Candidates from pool: 0
- Last candidate ID: `6a0608e1a08583fb5b624803` (israel.israeliv@validtest.com)

## Post-Test Verification Steps

### 1. Check Candidate Created

```
Query: { "source": "pool" }
Expected: 1 new candidate
Check fields:
- full_name ✓
- email ✓
- phone ✓
- skills (array) ✓
- domain_name ✓
- role_name ✓
- experience_years ✓
- desired_salary_min/max ✓ (if in CV)
- languages ✓ (if in CV)
- previous_companies ✓ (if in CV)
- resume_url ✓
- resume_filename ✓
- parsing_status: "success" ✓
```

### 2. Check CandidateDocument Created

```
Query: { "candidate_email": "<candidate_email>", "doc_type": "cv" }
Expected: 1 document
Check fields:
- file_url ✓
- filename ✓
- original_file_type ✓
- uploaded_by: "system_pool_intake" ✓
- conversion_status: "not_needed" ✓
```

### 3. Check Timeline Event Created

```
Query: { "candidate_email": "<candidate_email>", "event_type": "imported" }
Expected: 1 event with description containing "נכנס למאגר הכללי"
Check fields:
- performed_by: "system" ✓
- performed_by_role: "system" ✓
- metadata.source: "general_pool" ✓
- metadata.has_resume: true ✓
```

### 4. Verify NO Application Created

```
Query: { "candidate_email": "<candidate_email>" }
Expected: 0 applications
```

### 5. Check Candidate Appears in /crm/pool

```
Navigate to: /crm/pool
Expected: New candidate visible in list
Search by: name, email, skills
```

### 6. Test "Assign to Job" Button

```
1. Click candidate from pool
2. Click "שייך מועמד למשרה"
3. Select open job
4. Verify Application created
5. Verify Timeline event: "מועמדות נוצרה למשרת X"
6. Try assigning again to same job → Should prevent duplicate
```

### 7. Verify Both +job_code and +pool Work

```
Send to +{job_code}@gmail.com → Creates Application
Send to +pool@gmail.com → No Application, pool only
Check: No conflicts, separate flows
```

## Results Template

```
=== VERIFICATION RESULTS ===

Test Date: [DATE]
CV Sent To: r.rodion2802+pool@gmail.com
Subject: [SUBJECT]

PASS/FAIL: [OVERALL]

Candidate:
- ID: [ID]
- full_name: [NAME]
- email: [EMAIL]
- phone: [PHONE] ✓/✗
- skills: [COUNT] ✓/✗
- domain_name: [DOMAIN] ✓/✗
- role_name: [ROLE] ✓/✗
- experience_years: [YEARS] ✓/✗
- parsing_status: [STATUS] ✓/✗

Document:
- ID: [ID]
- file_url: [URL] ✓/✗
- filename: [FILENAME] ✓/✗
- original_file_type: [TYPE] ✓/✗

Timeline:
- ID: [ID]
- event_type: imported ✓/✗
- description: [DESC] ✓/✗
- metadata.source: general_pool ✓/✗

Application:
- Count: [0 expected] ✓/✗
- ID: [N/A - pool]

Pool Page:
- Visible: ✓/✗
- Searchable: ✓/✗

Manual Assignment:
- Application Created: [ID or N/A] ✓/✗
- Timeline Updated: ✓/✗
- Duplicate Prevention: ✓/✗

=== END RESULTS ===
```

## Troubleshooting

### If Candidate Not Created:

1. Check Gmail webhook: Dashboard → Code → Automations
2. Check function logs: Dashboard → Code → Functions → emailPoolIntakeHandler
3. Verify alias detection: `+pool` in To header
4. Check attachment detection

### If Parsing Failed:

1. Check LLM integration credits
2. Verify CV format (PDF/DOC/DOCX)
3. Check file size (<25MB)
4. Review function logs for LLM errors

### If Document Not Created:

1. Check UploadFile integration
2. Verify attachment was detected
3. Check binary conversion

### If Timeline Not Created:

1. Check CandidateTimeline entity exists
2. Verify candidate was created first
3. Review function error logs
