# Study Progress Tracker — Features

A plain-language walkthrough of what this app does and how it's built. Written for both technical and non-technical readers — useful for explaining the project in an interview.

## Accounts & Sign-in

**What it does:** You can create an account with an email and password, or sign in with Google. Once signed in, everything you add — subjects, topics, sessions, goals — belongs only to you. Someone else using the app has their own completely separate set of data.

**Why it's useful:** This turns the app from something only one person could ever use into something anyone can sign up for. It also means your study data is private — no one else can see or touch it, even though everyone shares the same app and database.

**How it works:** When you log in, the server gives your browser two small pieces of signed, tamper-proof information (called tokens) instead of a plain password — one that expires quickly and one that lasts longer to keep you logged in without re-entering your password constantly. Every piece of data in the app (a subject, a topic, a study session) is stamped with an invisible owner ID the moment it's created, and every time the app fetches or changes data, the server double-checks that owner ID matches whoever is logged in — so it's not just that the app *doesn't show* other people's data, it's that the server *refuses* to hand it over or let it be modified, even if someone tried to access it directly.

## Subjects & Topics (curriculum tracking)

**What it does:** You create a "Subject" (like "Mathematics" or "Organic Chemistry"), and break it into "Topics" (like "Derivatives" or "Chapter 3: Alkanes"). Each topic has a status — To Do, In Progress, or Done — plus optional notes and a target date.

**Why it's useful:** Most study plans live in someone's head or a messy notes app. This turns a syllabus into a checklist you can actually track completion against, subject by subject.

**How it works:** Under the hood, subjects and topics are stored as two linked database tables — every topic points back to the subject it belongs to. Marking a topic "Done" automatically stamps the exact time it was completed and kicks off the spaced-repetition review schedule (see below) — no extra step required.

## Study Session Logging

**What it does:** You log study sessions — which subject/topic you studied, the date, how many minutes you spent, and optional notes.

**Why it's useful:** Completion status alone doesn't tell you where your time actually went. Logging sessions separately means you can later see "I spent 6 hours on Chemistry this week but only 20 minutes on Math" — the kind of insight that helps you rebalance effort.

**How it works:** Each session is its own record, linked to a subject and (optionally) a specific topic, with a date and duration. Because dates are stored explicitly, you can also log sessions after the fact (e.g. backfilling yesterday's study time).

## Goals & Deadlines

**What it does:** You can set a goal with a target date, attached either to a whole subject or one specific topic (e.g. "Finish the calculus unit by Jan 1st"). The app can tell you which goals are overdue.

**Why it's useful:** Deadlines without visibility are easy to miss. Surfacing "overdue" automatically means you don't have to manually check dates against today — the system does it for you.

**How it works:** A goal is never manually marked "overdue" — instead, the app compares each open goal's target date against today's date every time you ask, so the status is always accurate without needing background jobs or reminders. Every goal is tied to exactly one target — either a whole subject or one specific topic, never neither or both — which the database itself enforces.

## Progress Dashboard & Charts

**What it does:** A home screen with four stat tiles (subjects, topics completed, total time studied, current study streak), a bar chart showing completion percentage per subject, and a bar chart showing minutes studied per day. It also surfaces anything overdue in one place.

**Why it's useful:** Raw data in a database isn't useful until it's summarized. This turns "a bunch of database rows" into an at-a-glance answer to "how am I doing?" — without having to open each subject individually.

**How it works:** Nothing is pre-calculated or stored — every number on the dashboard is computed fresh from the underlying subjects/topics/sessions data each time the page loads, using aggregate database queries (sums, counts, groupings). "Current streak" counts backward from today through consecutive days that have at least one logged session.

## Spaced Repetition Review

**What it does:** Once you mark a topic "Done," it automatically enters a review cycle — the app reminds you to revisit it after 1 day, then asks how well you remembered it (Again / Good / Easy), and adjusts how long it waits before the next reminder.

**Why it's useful:** This is the same idea behind flashcard apps like Anki: things you learn are forgotten unless revisited, and the best time to revisit is right before you'd otherwise forget. Rather than reviewing everything constantly (wasteful) or never (you forget it), the app waits longer between reviews each time you remember something well, and resets to short intervals when you don't.

**How it works:** Every topic gets its own "next review date." When you review it, picking "Good" roughly doubles the wait until the next review, "Easy" increases it even more, and "Again" resets it back to reviewing tomorrow. A full history of every review (and how it went) is kept, so long-term retention trends could be analyzed later.

---
*(A section for future AI Insights will be added once that feature is built.)*
