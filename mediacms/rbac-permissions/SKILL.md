---
name: rbac-permissions
description: Understand and configure MediaCMS media permissions — public/private/unlisted states, user roles (advanced user, editor, manager, admin), per-user MediaPermission shares, and category-based RBAC groups with member/contributor/manager roles. Use when deciding why a user can or cannot see, edit, or publish a media item, setting up group-based access through categories, or debugging 401/403 API responses.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS Permissions and RBAC

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). Code: `users/models.py`, `rbac/models.py`, `files/permissions.py`; docs: `docs/media_permissions.md`, `docs/admins_docs.md` §22.

## The three layers

1. **Media states** — `public` (listed, visible to all), `private` (owner + explicit grants), `unlisted` (direct link only). Private media can also carry a `password`.
2. **Direct grants** — `MediaPermission` rows: a specific user gets `viewer`, `editor`, or `owner` access to one media item.
3. **RBAC** (`USE_RBAC = True`) — groups associated with categories; members inherit access to category media by role.

## User roles (flags on the User model)

| Role | Capability |
| ---- | ----------- |
| Regular user | Own media: upload, edit, delete, set state |
| `advancedUser` | Unlocks `CAN_ADD_MEDIA`/`CAN_COMMENT` when those are set to `advancedUser`; set by editors/managers/admins on the profile |
| `is_editor` ("MediaCMS Editor") | Edit/review any media, manage comments, mark reviewed |
| `is_manager` ("MediaCMS Manager") | Editor capabilities + user management |
| superuser/admin | Everything |

## RBAC model

`RBACGroup` ↔ `Category` (many-to-many) ↔ `RBACMembership` (user + group + role). Roles: **member** (view category media, even private), **contributor** (view + edit + publish to the category), **manager** (same, currently). Workflow: create Group → associate Category → add User with a role.

Enabled cases:
- View a private media published to a category your group covers
- Edit media / publish to categories where you are contributor
- See **all** media of a category on its page, regardless of state
- See all categories associated with your groups on the categories listing

## Check order (why user X can/cannot see media Y)

1. Media `public` (and `listable`) → allow
2. Requester is the owner → full access
3. `MediaPermission` row for the user → grant that level (viewer/editor/owner)
4. RBAC enabled and user is member/contributor/manager of a group covering one of the media's categories → grant
5. Otherwise deny

`User` methods (users/models.py): `has_member_access_to_media`, `has_contributor_access_to_media`, `has_owner_access_to_media`, `has_member/contributor/manager_access_to_category`.

## Listing visibility

A media appears in listings only when `listable`: `state=public` AND `encoding_status=success` AND `is_reviewed=True`. API listings additionally union in the caller's own media, media shared with them, and (with RBAC) their categories' media — see `MediaList` in `files/views/media.py`.

## Setup

```python
# local_settings.py
USE_RBAC = True
```

Restart `web`, `celery_worker`, `celery_beat`. Then manage groups and memberships through the Django admin (or map them from SAML — skill `auth-identity`).

## Additional resources

- [references/permission-model.md](references/permission-model.md)
- `docs/media_permissions.md` (upstream reference), `docs/admins_docs.md` §22, §8–9
- Skills: `auth-identity` (SAML → role/group mapping), `dev-api` (bulk ownership actions), `portal-configuration` (CAN_* settings)
