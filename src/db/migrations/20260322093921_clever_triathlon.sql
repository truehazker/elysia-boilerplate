DO $$
BEGIN
  IF EXISTS (
    SELECT email
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add users_email_unique: duplicate emails exist';
  END IF;
END $$;

ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");