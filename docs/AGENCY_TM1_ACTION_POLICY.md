# TM-1: Action policy Team Manager

Дата реализации: 19 августа 2026

Team Manager действует только при одновременном выполнении двух условий:

1. effective permission разрешает действие;
2. ресурс принадлежит `user.organization_id` и `user.team_id`.

## Разрешённые действия

- Job, Candidate, Application: `create`, `update`, `delete` в своей Team;
- notes, tags, documents, timeline, messages, communication и interviews:
  mutation только после проверки parent Candidate/Application;
- import: создание, запуск и retry только своих batch;
- reports export: только с permission `export` и team-scoped выборкой;
- compensation: `view_compensation` / `edit_compensation` только для своей Team.

## Жёсткие ограничения

Permission Matrix не может предоставить Team Manager:

- `manage_users`;
- `manage_settings`.

Team Manager не может:

- назначать Recruiter из другой Team или tenant;
- менять canonical ownership через body/query IDs;
- читать чужие Team, users, clients, imports или compensation;
- создавать Interview без scoped Application;
- видеть organization-wide dimensions или financial aggregates.

`team_manager_id` остаётся compatibility snapshot. Авторизационная граница всегда
вычисляется по canonical `team_id`.
