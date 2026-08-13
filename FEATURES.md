# Study Progress Tracker — Features

A plain-language walkthrough of what this app does and how it's built. Written for both technical and non-technical readers — useful for explaining the project in an interview.

## Accounts & Sign-in

**What it does:** You can create an account with an email and password, or sign in with Google. Once signed in, everything you add — subjects, topics, sessions, goals — belongs only to you. Someone else using the app has their own completely separate set of data.

**Why it's useful:** This turns the app from something only one person could ever use into something anyone can sign up for. It also means your study data is private — no one else can see or touch it, even though everyone shares the same app and database.

**How it works:** When you log in, the server gives your browser two small pieces of signed, tamper-proof information (called tokens) instead of a plain password — one that expires quickly and one that lasts longer to keep you logged in without re-entering your password constantly. Every piece of data in the app (a subject, a topic, a study session) is stamped with an invisible owner ID the moment it's created, and every time the app fetches or changes data, the server double-checks that owner ID matches whoever is logged in — so it's not just that the app *doesn't show* other people's data, it's that the server *refuses* to hand it over or let it be modified, even if someone tried to access it directly.

## Subjects & Topics (curriculum tracking)

**What it does:** You create a "Subject" (like "Mathematics" or "Organic Chemistry"), and break it into "Topics" (like "Derivatives" or "Chapter 3: Alkanes"). Each topic has a status — To Do, In Progress, or Done — plus optional notes and a target date. You can edit or delete any subject or topic at any time, and give each subject its own color, which then shows up consistently everywhere that subject appears (its row, and its bar on the dashboard chart) so you can recognize it at a glance.

**Why it's useful:** Most study plans live in someone's head or a messy notes app. This turns a syllabus into a checklist you can actually track completion against, subject by subject.

**How it works:** Under the hood, subjects and topics are stored as two linked database tables — every topic points back to the subject it belongs to. Marking a topic "Done" automatically stamps the exact time it was completed and kicks off the spaced-repetition review schedule (see below) — no extra step required.

## Study Session Logging

**What it does:** You log study sessions — which subject/topic you studied, the date, how many minutes you spent, and optional notes.

**Why it's useful:** Completion status alone doesn't tell you where your time actually went. Logging sessions separately means you can later see "I spent 6 hours on Chemistry this week but only 20 minutes on Math" — the kind of insight that helps you rebalance effort.

**How it works:** Each session is its own record, linked to a subject and (optionally) a specific topic, with a date and duration. Because dates are stored explicitly, you can also log sessions after the fact (e.g. backfilling yesterday's study time). Any note you attach to a session is shown right in the session list, and can be edited later without re-logging the whole session.

## Bulk Topic Import

**What it does:** Instead of adding topics one at a time, you can paste a whole list — one topic per line, like a table of contents or a syllabus — and the app creates them all at once, in the order you pasted them.

**Why it's useful:** Setting up a new subject with 20+ topics one-by-one is tedious. This turns "copy a syllabus, paste it in" into the whole setup step.

**How it works:** The pasted text is split into lines on the server; blank lines are ignored, and each remaining line becomes its own topic, numbered to preserve the order you pasted them in.

## Goals & Deadlines

**What it does:** You can set a goal with a target date, attached either to a whole subject or one specific topic (e.g. "Finish the calculus unit by Jan 1st"). The app can tell you which goals are overdue.

**Why it's useful:** Deadlines without visibility are easy to miss. Surfacing "overdue" automatically means you don't have to manually check dates against today — the system does it for you.

**How it works:** A goal is never manually marked "overdue" — instead, the app compares each open goal's target date against today's date every time you ask, so the status is always accurate without needing background jobs or reminders. Every goal is tied to exactly one target — either a whole subject or one specific topic, never neither or both — which the database itself enforces.

## Progress Dashboard & Charts

**What it does:** A home screen with four stat tiles (subjects, topics completed, total time studied, current study streak), a bar chart showing completion percentage per subject, and a bar chart showing minutes studied per day. It also surfaces anything overdue in one place.

**Why it's useful:** Raw data in a database isn't useful until it's summarized. This turns "a bunch of database rows" into an at-a-glance answer to "how am I doing?" — without having to open each subject individually.

**How it works:** Nothing is pre-calculated or stored — every number on the dashboard is computed fresh from the underlying subjects/topics/sessions data each time the page loads, using aggregate database queries (sums, counts, groupings). "Current streak" counts backward from today through consecutive days that have at least one logged session. The "time spent" chart can be toggled between daily and weekly buckets, and a GitHub-style activity heatmap below it shows the last ~6 months at a glance, with darker squares meaning more time studied that day.

## Spaced Repetition Review

**What it does:** Once you mark a topic "Done," it automatically enters a review cycle — the app reminds you to revisit it after 1 day, then asks how well you remembered it (Again / Good / Easy), and adjusts how long it waits before the next reminder.

**Why it's useful:** This is the same idea behind flashcard apps like Anki: things you learn are forgotten unless revisited, and the best time to revisit is right before you'd otherwise forget. Rather than reviewing everything constantly (wasteful) or never (you forget it), the app waits longer between reviews each time you remember something well, and resets to short intervals when you don't.

**How it works:** Every topic gets its own "next review date." When you review it, picking "Good" roughly doubles the wait until the next review, "Easy" increases it even more, and "Again" resets it back to reviewing tomorrow. A full history of every review (and how it went) is kept, so long-term retention trends could be analyzed later.

## Dark Mode

**What it does:** A button in the top-right lets you cycle between light, dark, and "match my system" appearance, independent of what your operating system is set to.

**Why it's useful:** Some people prefer dark mode always, regardless of their OS setting (e.g. studying at night with a light-mode OS), or vice versa. Giving an explicit override respects that instead of forcing one behavior.

**How it works:** Your choice is remembered in the browser (not tied to your account), so it persists across visits on that device without needing a server round-trip.

## Study Timer

**What it does:** A start/pause/stop timer on the session-log page. Start it before you begin studying, and when you stop it, it fills in the minutes for you — you just confirm (or adjust) and log the session, instead of estimating or doing the math yourself.

**Why it's useful:** Manually guessing how long you studied is inaccurate and easy to skip. A running timer captures the real number with zero mental math, while still letting you review and edit before it's saved.

**How it works:** The timer tracks elapsed time using the actual clock (not a naive counter), so it stays accurate even if you switch away from the tab while it's running.

## Data Export

**What it does:** An "Export data" button downloads everything you've ever entered — every subject, topic, session, goal, and review — as a single file you can keep for yourself.

**Why it's useful:** It's your data; you shouldn't need to ask anyone for a copy of it. It's also a sensible thing to do before making any large change, and useful if you ever want to analyze your own study patterns outside the app.

**How it works:** The button asks the server for everything tied to your account, packages it as one JSON file, and has your browser save it directly — nothing is emailed or stored anywhere else in the process.

## Last Synced Indicator

**What it does:** A small "Updated Xs ago" label in the top bar shows how fresh the data on screen is.

**Why it's useful:** If you have the app open on your phone and your laptop, this gives you a quick, honest signal for whether what you're looking at is current, rather than silently trusting a number that might be stale.

**How it works:** Every time any part of the app successfully fetches data from the server, the timestamp of that fetch updates the label — so it reflects real activity, not a fixed refresh schedule.

---
*(A section for future AI Insights will be added once that feature is built.)*
