# AI Vibe Coding - Full Stack JavaScript Techdegree Project 11

## Created By

- Name: Todd Shevlin
- Date Completed:

---

## Tools Used

- Cursor (primary)
- Github Copilot (code completion)
- Windsurf (code completion)

- Claude was considered, but most good features come with paid subscription

---

## What Worked

Overall the tool worked very well.  Saved a lot of time and wrote pretty good code, while also good at resolving issues.

- Building db models, and connecting and syncing worked great.  Though it would have been better if I had it build ALL models initially, rather than waiting to add Loans.
- I love that it automatically creates pug views from html markup and adds them to routes and renders.
- Creating standard routes and API calls with minimal prompting.  It knows CRUD are going to be standard, so it knows to create them and builds them consistently
- Picks up on some features without specifically prompting.  For example, it saw pages listed at the bottom of the html markup so it added pagination functionality. 

---

## What Didn't Work

If a prompt isn't very specific, several follow-up prompts are needed to fix the misses. I typically asked it what a good prompt looks like for larger tasks.  Some fixes didn't work.  At one point the project got corrupted, I'm not sure if this is due to AI, node or something else.

- A lot of follow-up prompts for missed details (partially user error)
- Some fixes didn't work despite numerous attempts
- The further down the "prompt rabbit hole" you go, the more code is added making it more difficult to read, debug, and modify.

---

## Pros / Cons of Using an AI Coding Assistant

### Pros

Overall using the AI tools is a huge help.  It takes care most of the setup grind so you can focus on what the app actually needs to do.  It also plans ahead for features you will likely ask for and as much as possible keeps patterns and syntax similar across files of the same type.

- Huge time saver.  It built in an hour what would typically take several days.  

- It looks at the entire code base to get the context, reads existing patterns, naming conventions, etc.

- It is pretty good (though not infallible) at fixing issues and errors.  At one point in a follow-up prompt it found one of it's previous syntax errors and corrected it.

- It writes pretty good code using modern syntax and design patterns (ternary and spread operators, async/await, etc.).

### Cons

Cons are relatively few, versus not using any AI tools.

- Limited number of prompts for free users.  Though most tools are $20 a month or less, which is definitely worth the time it saves you if you will be doing any development.

- Some of the code can get "bloated" and difficult to read when attempting to add features or fix issues, especially if they don't work the first time.  It continues to re-write and add additional code.

- It tries to match existing syntax, which may not be idea.  For example, the Express builder uses *var* for declarations, when that was deprecated years ago in favor of *let* and *const*. So it created new variables using *var*, which causes scoping and renaming issues.  

- By default it responds assuming you are about an intermediate developer.  If you are a beginner prompting can be more difficult, and understanding the responses and code will be challenging if you need to modify or debug it.  You still have to understand the stack and where different functions are performed in order to tell the AI where to look and what to do.

- The biggest con of them all. It almost works too well.  If we become too reliant on AI, developers will become lazy and forget the skills they learned.  As it becomes more ubiquitous, I foresee a time when systems break and there is no one left that knows how to fix them.
