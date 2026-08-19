# הרשאות משתמשים - בדיקה מקיפה

## תפקידים במערכת:

1. **super_admin** - מנהל עליון (פלטפורמה)
2. **admin** - מנהל פלטפורמה
3. **org_admin** - מנהל ארגון
4. **recruitment_manager** - מנהל גיוס
5. **team_manager** - מנהל צוות
6. **recruiter** - מגייס (חברת השמה)
7. **hr_manager** - מנהל HR (ארגון)
8. **internal_recruiter** - מגייס פנימי (ארגון)

---

## ✅ super_admin / admin

**גישה:** כל הפלטפורמה

| Entity           | Create | Read      | Update | Delete |
| ---------------- | ------ | --------- | ------ | ------ |
| Candidate        | ✅     | ✅ (כולם) | ✅     | ✅     |
| Application      | ✅     | ✅ (כולם) | ✅     | ✅     |
| Job              | ✅     | ✅ (כולם) | ✅     | ✅     |
| Interview        | ✅     | ✅ (כולם) | ✅     | ✅     |
| CompensationPlan | ✅     | ✅ (כולם) | ✅     | ✅     |
| Organization     | ✅     | ✅ (כולם) | ✅     | ✅     |
| User             | ❌     | ✅ (כולם) | ✅     | ✅     |

**הערות:**

- רואים את כל הנתונים בכל הארגונים
- יכולים לבצע Impersonation
- גישה ל-Platform Dashboard ו-Audit Logs

---

## ✅ org_admin (מנהל ארגון)

**גישה:** כל הארגון שלו בלבד

| Entity           | Create | Read           | Update | Delete |
| ---------------- | ------ | -------------- | ------ | ------ |
| Candidate        | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| Application      | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| Job              | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| Interview        | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| CompensationPlan | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| User             | ✅     | ✅ (כל הארגון) | ✅     | ❌     |
| PermissionMatrix | ✅     | ✅             | ✅     | ❌     |
| RoleTemplate     | ❌     | ✅             | ✅     | ❌     |

**הערות:**

- רואה את כל המועמדים בארגון שלו (ללא קשר ל-recruiter_id)
- יכול לנהל משתמשים בארגון שלו
- יכול לשנות הרשאות (PermissionMatrix)
- **לא יכול** למחוק משתמשים (רק admin)
- **לא יכול** ליצור תפקידים חדשים (RoleTemplate - גלובלי)

---

## ✅ recruitment_manager (מנהל גיוס)

**גישה:** כל הארגון שלו (כמו org_admin אבל ללא ניהול משתמשים)

| Entity           | Create | Read           | Update | Delete |
| ---------------- | ------ | -------------- | ------ | ------ |
| Candidate        | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| Application      | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| Job              | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| Interview        | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| CompensationPlan | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| User             | ❌     | ✅ (כל הארגון) | ❌     | ❌     |

**הערות:**

- רואה את כל המועמדים בארגון שלו (ללא קשר ל-recruiter_id)
- **לא יכול** לנהל משתמשים
- **לא יכול** לשנות הרשאות
- יכול לנהל את כל פעולות הגיוס (מועמדים, משרות, ראיונות, תגמולים)

---

## ⚠️ team_manager (מנהל צוות)

**גישה:** רק המועמדים של הצוות שלו

| Entity           | Create | Read                              | Update | Delete |
| ---------------- | ------ | --------------------------------- | ------ | ------ |
| Candidate        | ✅     | ✅ (רק team_manager_id = user.id) | ✅     | ✅     |
| Application      | ✅     | ✅ (רק team_manager_id = user.id) | ✅     | ✅     |
| Job              | ✅     | ✅ (כל הארגון)                    | ✅     | ✅     |
| Interview        | ✅     | ✅ (רק recruiter_id = user.id)    | ✅     | ✅     |
| CompensationPlan | ✅     | ✅ (כל הארגון)                    | ✅     | ✅     |

**הערות:**

- **רואה רק מועמדים שמשויכים אליו** (team_manager_id = user.id)
- **רואה רק ראיונות של המגייסים שלו** (recruiter_id = user.id)
- יכול לראות את כל המשרות בארגון
- יכול לראות Compensation Plans (כל הארגון)

**בעיה פוטנציאלית:**

- ב-Interview RLS כתוב `data.recruiter_id: {{user.id}}` אבל צריך גם `data.team_manager_id: {{user.id}}`

---

## ⚠️ recruiter (מגייס - חברת השמה)

**גישה:** רק המועמדים שלו

| Entity           | Create | Read                           | Update | Delete |
| ---------------- | ------ | ------------------------------ | ------ | ------ |
| Candidate        | ✅     | ✅ (רק recruiter_id = user.id) | ✅     | ✅     |
| Application      | ✅     | ✅ (רק recruiter_id = user.id) | ✅     | ✅     |
| Job              | ✅     | ✅ (כל הארגון)                 | ✅     | ✅     |
| Interview        | ✅     | ✅ (רק recruiter_id = user.id) | ✅     | ❌     |
| CompensationPlan | ❌     | ❌                             | ❌     | ❌     |

**הערות:**

- **רואה רק מועמדים שמשויכים אליו** (recruiter_id = user.id)
- **רואה רק ראיונות שלו** (recruiter_id = user.id)
- יכול לראות את כל המשרות בארגון
- **לא רואה Compensation Plans** (חסום ב-RLS)

---

## ✅ hr_manager (מנהל HR - ארגון)

**גישה:** כל הארגון שלו

| Entity           | Create | Read           | Update | Delete |
| ---------------- | ------ | -------------- | ------ | ------ |
| Candidate        | ✅     | ✅ (כל הארגון) | ✅     | ❌     |
| Application      | ✅     | ✅ (כל הארגון) | ✅     | ❌     |
| Job              | ✅     | ✅ (כל הארגון) | ✅     | ✅     |
| Interview        | ✅     | ✅ (כל הארגון) | ✅     | ❌     |
| CompensationPlan | N/A    | N/A            | N/A    | N/A    |

**הערות:**

- רואה את כל המועמדים בארגון שלו (ללא קשר ל-recruiter_id)
- **לא יכול למחוק** מועמדים/מועמדויות/ראיונות
- Compensation לא רלוונטי (לארגון רגיל אין חברת השמה)

---

## ⚠️ internal_recruiter (מגייס פנימי - ארגון)

**גישה:** רק המועמדים שלו

| Entity           | Create | Read                           | Update | Delete |
| ---------------- | ------ | ------------------------------ | ------ | ------ |
| Candidate        | ✅     | ✅ (רק recruiter_id = user.id) | ✅     | ❌     |
| Application      | ✅     | ✅ (רק recruiter_id = user.id) | ✅     | ❌     |
| Job              | ✅     | ✅ (כל הארגון)                 | ✅     | ✅     |
| Interview        | ✅     | ✅ (רק recruiter_id = user.id) | ✅     | ❌     |
| CompensationPlan | N/A    | N/A                            | N/A    | N/A    |

**הערות:**

- **רואה רק מועמדים שמשויכים אליו** (recruiter_id = user.id)
- **לא יכול למחוק** מועמדים/מועמדויות/ראיונות
- Compensation לא רלוונטי

---

# 🚨 בעיות שזוהו:

## 1. team_manager - חוסר עקביות ב-Interview RLS

**קיים:**

```json
{
  "user_condition": { "role": "team_manager" },
  "data.organization_id": "{{user.data.organization_id}}",
  "data.recruiter_id": "{{user.id}}"
}
```

**צריך להיות:**

```json
{
  "user_condition": { "role": "team_manager" },
  "data.organization_id": "{{user.data.organization_id}}",
  "data.team_manager_id": "{{user.id}}"
}
```

**השפעה:** מנהל צוות לא יראה ראיונות של המגייסים שלו אלא אם כן recruiter_id = user.id שלו (שגוי).

---

## 2. Job RLS - חסר פילוח לפי תפקידים

**קיים:**

```json
"read": {"$or": [{"data.organization_id": "{{user.data.organization_id}}"}, {"user_condition": {"role": "admin"}}, {"user_condition": {"role": "super_admin"}}]}
```

**הערה:** זה תקין - כל התפקידים רואים את כל המשרות בארגון שלהם.

---

## 3. CompensationPlan - חסר גישה ל-hr_manager

**קיים:**

```json
"read": {"$and": [..., {"$or": [{"user_condition": {"org_type": "staffing_agency"}}, ...]}]}
```

**הערה:** זה תקין - Compensation רלוונטי רק לחברות השמה, לא לארגונים רגילים.

---

# ✅ סיכום הרשאות info@good-job.co.il

**תפקיד:** recruitment_manager  
**ארגון:** 6a0d7291e1bc86f20a5aef28 (staffing_agency)

**מה המשתמש יכול לעשות:**

- ✅ לראות את כל המועמדים בארגון (לא רק שלו)
- ✅ ליצור/לעדכן/למחוק מועמדים
- ✅ לראות את כל המשרות בארגון
- ✅ ליצור/לעדכן/למחוק משרות
- ✅ לראות את כל המועמדויות (Applications)
- ✅ ליצור/לעדכן/למחוק מועמדויות
- ✅ לראות את כל הראיונות
- ✅ ליצור/לעדכן/למחוק ראיונות
- ✅ לראות Compensation Plans
- ✅ ליצור/לעדכן/למחוק Compensation Plans
- ❌ לנהל משתמשים (רק org_admin ו-admin)
- ❌ לשנות הרשאות (רק org_admin ו-admin)
- ❌ למחוק ארגון (רק admin)

**האם זה מספיק?** ✅ כן, עבור מנהל גיוס זה התפקיד הנכון.

---

# 🔧 תיקון נדרש

**קובץ:** entities/Interview.json  
**שורה:** RLS read/update/delete עבור team_manager  
**תיקון:** לשנות מ-`data.recruiter_id: {{user.id}}` ל-`data.team_manager_id: {{user.id}}
