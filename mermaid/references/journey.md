# User Journey Reference

## Declaration

```
journey
    title User shops online
    section Browse
        Visit homepage: 5: User
        Search product: 4: User
    section Purchase
        Add to cart: 5: User
        Checkout: 3: User, System
```

## Syntax

Each journey starts with the `journey` keyword, followed by an optional title and sections.

### Title

```
title Journey title
```

Optional. Rendered at the top of the diagram.

### Sections

```
section Section Name
    Task 1: 5: User
    Task 2: 3: User, System
```

Sections group related tasks. Each section gets a distinct color.

### Tasks

```
Task name: score: actor
Task name: score: actor1, actor2
```

- **Task name**: Description of the step
- **Score**: Number 1–5 (higher = more positive sentiment). Rendered as a face icon: 😊 (5), 🙂 (4), 😐 (3), 🙂 (2), 😞 (1)
- **Actor**: Who performs the step. Multiple actors separated by commas.

## Example

```
journey
    title Hiring process
    section CV Submission
        Submit CV: 5: Applicant
        Review CV: 3: Recruiter
    section Interview
        Phone screen: 4: Applicant, Recruiter
        Technical interview: 2: Applicant, Engineer
        Culture fit: 4: Applicant, Manager
    section Offer
        Make offer: 5: Recruiter
        Accept offer: 5: Applicant
```
