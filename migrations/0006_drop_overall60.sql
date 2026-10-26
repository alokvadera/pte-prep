-- The "overall score out of 60" column predates the 10-90 scale used
-- everywhere in the product. Nothing read it, and the value written to it was
-- simply `overall + 50`, so a perfect run stored 140. Attempts are now scored
-- and reported on the published 10-90 scale only.
ALTER TABLE attempts DROP COLUMN overall_score_60;
