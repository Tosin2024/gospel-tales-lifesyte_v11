
# GOSPEL TALES LIFESYTE — STAGE 6
## Complete Bible Content System

Stage 6 expands the Stage 5 online foundation into a structured Bible learning/content platform.

### Included

**Content database**
- Bible Stories
- Story Sections
- Bible Lessons
- Memory Verses
- Daily Devotionals
- Content Categories
- Favorites
- Learner Progress

**Learner features**
- Bible Tales listing
- Search/filter Bible stories
- Story detail pages
- Lesson listing and detail pages
- Daily devotional listing and detail pages
- Memory verse library
- Save stories/devotionals to Favorites
- Mark stories/lessons completed
- Learning Progress dashboard

**Admin content foundation**
- Story management
- Lesson management
- Devotional management
- Memory verse management
- Publish/unpublish controls
- Supabase RLS + admin protection

### Database setup

Run these SQL files in order in Supabase:

1. `supabase/schema.sql`
2. `supabase/stage5.sql`
3. `supabase/stage6_content.sql`

Stage 6 seed data includes:
- Noah and the Ark
- David and Goliath
- Esther
- Joseph
- The Good Samaritan
- The Lost Sheep
- Growing in Faith
- Forgiveness and Healing
- Walking in Wisdom
- Sample memory verses
- Sample devotional

### Environment

Create `.env.local` from `.env.example` and add your Supabase project URL and anonymous key.

Never put a Supabase service-role key, payment secret, admin secret, or other private credential in browser code.

### Routes

Learner:
- `/stories`
- `/stories/[slug]`
- `/lessons`
- `/lessons/[slug]`
- `/devotional`
- `/devotional/[id]`
- `/memory-verses`
- `/favorites`
- `/progress`

Admin:
- `/admin/content/stories`
- `/admin/content/lessons`
- `/admin/content/devotionals`
- `/admin/content/memory-verses`

### Important production note

This package is the Stage 6 production foundation, not a publicly hosted application by itself. It becomes a live online app after the project is connected to the user's Supabase project and deployed to a hosting provider.

### Next stage

Stage 7 should add:
- real competition engine
- registration/entry rules
- paid competition support
- prizes and winner workflows
- notifications
- certificates generation and verification
- stronger admin CRUD/editor forms
- audit trails for content changes
- analytics
- mobile deployment preparation
