-- Hire Israel — MySQL init script
-- Run automatically on first docker-compose up

CREATE DATABASE IF NOT EXISTS hire_israel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hire_israel;

-- Full-text search support hint:
-- After migrations run, add FULLTEXT indexes manually if needed:
-- ALTER TABLE candidates ADD FULLTEXT INDEX ft_candidate_search (full_name, email, summary);
-- ALTER TABLE jobs ADD FULLTEXT INDEX ft_job_search (title, description, company);

