-- Update blog posts to remove author names
UPDATE blog_posts SET author_name = NULL WHERE author_name IS NOT NULL;

-- Update team members to remove names
UPDATE team_members SET name = NULL WHERE name IS NOT NULL;

-- Update educational resources to remove any author information
UPDATE educational_resources SET author = NULL WHERE author IS NOT NULL;