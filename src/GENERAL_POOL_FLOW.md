# General Candidate Pool - Flow Documentation

## Overview

The **General Candidate Pool** flow allows the system to accept CVs without associating them with a specific job. This is essential for importing candidates from the existing Civi database and for general candidate intake.

## Email Addresses

### 1. Job-Specific Application Email
**Format:** `headhunter.jobs+{job_code}@gmail.com`  
**Example:** `headhunter.jobs+hhLADG4@gmail.com`

**Flow:**
- CV received → Creates **Candidate** + **Application** + **CandidateDocument** + **Timeline**
- Automatically associated with specific job
- Application status: `new`

### 2. General Pool Email
**Format:** `headhunter.jobs+pool@gmail.com`  
**Address:** `r.rodion2802+pool@gmail.com`

**Flow:**
- CV received → Creates **Candidate** + **CandidateDocument** + **Timeline**
- **NO Application created**
- Candidate marked with `source: 'pool'`
- Full AI parsing: domain, role, skills, experience, salary expectations, languages, previous companies
- Duplicate detection (email + phone)
- Suggested jobs matching (keyword-based)

## Technical Implementation

### Backend Functions

#### `emailIntakeHandler` (Existing)
- Triggered by Gmail webhook on job-specific aliases
- Extracts `job_code` from `+{job_code}` alias
- Creates Application automatically
- Path: `functions/emailIntakeHandler`

#### `emailPoolIntakeHandler` (NEW)
- Triggered by Gmail webhook on `+pool` alias
- **No job_code** → General pool intake
- Comprehensive CV parsing via LLM:
  - `domain_name` (e.g., "פיתוח תוכנה")
  - `role_name` (e.g., "מפתח Full Stack")
  - `skills` (array)
  - `experience_years`
  - `desired_salary_min/max`
  - `languages` (array)
  - `previous_companies` (array)
  - `summary`
- Duplicate detection (email + phone)
- Creates Candidate with `source: 'pool'`
- Creates CandidateDocument
- Creates Timeline event: "נכנס למאגר הכללי"
- **NO Application created**
- Path: `functions/emailPoolIntakeHandler`

### Automation

**Name:** General Pool CV Intake  
**Type:** Connector (Gmail)  
**Events:** `mailbox`  
**Function:** `emailPoolIntakeHandler`  
**Status:** Active

The automation triggers on all Gmail messages. The function filters internally based on the `+pool` alias.

### Frontend Components

#### `GeneralPoolPage` (NEW)
- **Route:** `/crm/pool`
- Displays pool email address prominently
- Copy-to-clipboard functionality
- Lists all candidates from general pool
- Search by: name, email, role, domain, skills
- Shows: role, domain, experience, score, status
- **Access:** recruiter, team_manager, recruitment_manager, admin, employer

#### `AssignToJobModal` (NEW)
- Manual job assignment modal
- Searchable job list
- Creates Application on assignment
- Creates Timeline event
- Prevents duplicate applications
- **Usage:** Click "שייך מועמד למשרה" in RecruiterWorkspacePanel

#### `RecruiterWorkspacePanel` (Updated)
- New button: "שייך מועמד למשרה"
- Opens `AssignToJobModal`
- Available for all CRM users

## Data Flow

### Job-Specific Flow
```
Email → +{job_code}@gmail.com
  ↓
emailIntakeHandler
  ↓
Extract job_code → Find Job
  ↓
Parse CV → Duplicate Check
  ↓
Create Candidate (if new)
Create CandidateDocument
Create Application (job_id assigned)
Create Timeline event
  ↓
Mark email as read
```

### General Pool Flow
```
Email → +pool@gmail.com
  ↓
emailPoolIntakeHandler
  ↓
Detect pool alias (no job_code)
  ↓
Comprehensive CV Parsing (LLM)
  ↓
Parse: domain, role, skills, experience, salary, languages, companies
  ↓
Duplicate Check (email + phone)
  ↓
Create Candidate (source: 'pool')
Create CandidateDocument
Create Timeline event: "נכנס למאגר הכללי"
  ↓
Find suggested jobs (keyword matching)
  ↓
NO Application created
  ↓
Mark email as read
```

### Manual Assignment Flow
```
Recruiter views candidate in General Pool
  ↓
Clicks "שייך מועמד למשרה"
  ↓
AssignToJobModal opens
  ↓
Search and select job
  ↓
Create Application (job_id assigned)
Create Timeline event: "מועמדות נוצרה למשרת X"
  ↓
Candidate now has application
```

## Candidate Entity Fields

### Pool-Specific Fields
```json
{
  "source": "pool",  // or "import" for CSV imports
  "domain_name": "פיתוח תוכנה",
  "role_name": "מפתח Full Stack",
  "skills": ["React", "Node.js", "PostgreSQL"],
  "experience_years": 5,
  "desired_salary_min": 15000,
  "desired_salary_max": 20000,
  "languages": ["עברית", "אנגלית"],
  "previous_companies": ["חברת טכנולוגיה בע\"מ"],
  "summary": "מפתח מנוסה עם ניסיון ב-SaaS"
}
```

## Timeline Events

### Pool Intake
```json
{
  "event_type": "imported",
  "description": "מועמד חדש נכנס למאגר הכללי ממייל (Subject)",
  "performed_by": "system",
  "performed_by_name": "מערכת Pool Intake",
  "performed_by_role": "system",
  "metadata": {
    "source": "general_pool",
    "email_message_id": "...",
    "is_duplicate": false,
    "has_resume": true,
    "parsing_confidence": 80
  }
}
```

### Manual Assignment
```json
{
  "event_type": "application_submitted",
  "description": "מועמדות נוצרה למשרת X ב-Y (שיוך ידני מהמאגר הכללי)",
  "performed_by": "system",
  "performed_by_name": "מערכת",
  "performed_by_role": "system",
  "metadata": {
    "job_id": "...",
    "job_title": "...",
    "source": "manual_pool_assignment",
    "application_id": "..."
  }
}
```

## Usage Instructions

### For Recruiters

1. **Import from Civi:**
   - Send CVs to: `r.rodion2802+pool@gmail.com`
   - Use BCC to protect candidate privacy
   - Attach CVs as PDF/DOC/DOCX

2. **View General Pool:**
   - Navigate to: `/crm/pool`
   - See all candidates without job assignments
   - Search by skills, domain, role

3. **Assign to Job:**
   - Open candidate profile
   - Click "שייך מועמד למשרה"
   - Search and select job
   - Application created automatically

4. **Send to Employer:**
   - After assignment, use "שלח למעסיק"
   - Select documents to attach
   - Add recruiter note
   - Send email

### For Admin

- Monitor pool intake: `/crm/pool`
- View all candidates: `/crm/candidates`
- Manage jobs: `/admin/jobs`
- Check automations: Dashboard → Code → Automations

## Duplicate Detection

The system checks for duplicates using:
1. **Email match** (exact)
2. **Phone match** (normalized, digits only)

If duplicate found:
- Updates existing candidate with new CV
- Sets `is_duplicate_suspected: true`
- Creates Timeline event (not new candidate)
- **No duplicate Application created**

## AI Parsing

The LLM extracts the following from CVs:
- **Personal:** name, email, phone, location
- **Professional:** domain, role, skills, experience years
- **Expectations:** salary min/max
- **Languages:** spoken languages
- **History:** previous companies
- **Summary:** 2-3 line professional summary

Parsing confidence is stored in `parsing_confidence` (0-100).

## Security & Permissions

### Access Control
- **General Pool:** recruiter, team_manager, recruitment_manager, admin, employer
- **Assign to Job:** same roles
- **Send to Employer:** recruiter, team_manager, recruitment_manager, admin

### Data Visibility
- Employers see only their own candidates
- Recruiters see assigned + unassigned (if permitted)
- Managers see all candidates

## Monitoring

### Gmail Webhook
- Check automation status: Dashboard → Code → Automations
- View logs: Dashboard → Code → Functions → emailPoolIntakeHandler
- Test: Use `test_backend_function` tool

### Metrics to Track
- Candidates per day (source: 'pool')
- Duplicate rate
- Assignment rate (pool → job)
- Parsing success rate

## Future Enhancements

1. **AI Job Matching:**
   - Enhanced scoring algorithm
   - Semantic matching (not just keywords)
   - Auto-suggest top 3 jobs

2. **Bulk Assignment:**
   - Select multiple candidates
   - Assign to same job

3. **Pool Analytics:**
   - Skills distribution
   - Domain trends
   - Salary expectations analysis

4. **Automated Outreach:**
   - Email templates for pool candidates
   - Job alerts based on skills

## Troubleshooting

### CV Not Appearing in Pool
1. Check Gmail webhook is active
2. Verify email alias is `+pool`
3. Check function logs for errors
4. Confirm attachment was detected

### Duplicate Not Detected
1. Verify email/phone format
2. Check normalization logic
3. Review duplicate detection thresholds

### Assignment Fails
1. Check if Application already exists
2. Verify job is not closed
3. Check user permissions

## Support

For issues or questions:
- Check logs: Dashboard → Code → Functions
- Review automations: Dashboard → Code → Automations
- Test function: Use backend function testing tool