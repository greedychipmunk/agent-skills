# Permission model detail

## Media state semantics

| State | Listings | Direct URL | Notes |
| ----- | -------- | ---------- | ----- |
| `public` | Yes (when listable) | Yes | Default when `PORTAL_WORKFLOW = 'public'` |
| `unlisted` | No | Yes | "Hidden but reachable" |
| `private` | No | No (permission required) | Optional `password` field for private media |

`listable` is recomputed on every save: `state == "public" and encoding_status == "success" and is_reviewed`. A public video stuck in `pending` encoding, or awaiting review (`MEDIA_IS_REVIEWED = False`), will not list.

## MediaPermission

Model fields: `media`, `user` (grantee), `owner_user` (who granted), `permission` (`viewer`/`editor`/`owner`). Created via the media page share UI, bulk actions (`set_ownership`), or the LTI share endpoint. `viewer` = watch private media; `editor` = also edit metadata; `owner` = full control including deletion.

## RBAC models (rbac/models.py)

- `RBACGroup` — named group; associated with categories
- `RBACRole` — TextChoices: `member`, `contributor`, `manager`
- `RBACMembership` — unique (user, rbac_group, role); a user can hold different roles in different groups

Categories can be flagged RBAC-controlled (`is_rbac_category`); the category page then lists all its media for group members regardless of state. Category management (edit title/description/thumbnail) extends to group managers for their categories.

## Permission-check code paths

- `files/permissions.py` — DRF permission classes (e.g. `IsMediaContributorOrEditor`)
- `users/models.py` — the `has_*_access_to_media/category` methods used by views and the API
- `files/views/media.py` `MediaList.get` — builds the union queryset: listable ∪ own ∪ shared-with-me ∪ RBAC categories
- `files/views/media_auth.py` — the `/_media_auth` check behind protected-media serving (skill `media-pipeline`)

## API effects

| Action | Who |
| ------ | --- |
| GET media list/detail | Public media anonymous; own/shared/RBAC when authenticated |
| Edit/delete media | Owner, editor, manager, admin |
| `set_state`, bulk category/tag edits | Owner or editor+ |
| `change_owner`, ownership bulk actions | Admin/manage surface |
| `add_to_category` (RBAC categories) | Contributor/manager of a group covering the category |

## Design guidance

- Simple portals: states + direct shares are enough; leave `USE_RBAC` off
- Team/course portals: RBAC groups per team, categories per topic; map SAML groups if SSO exists
- One-off exceptions: MediaPermission viewer/editor grants, not groups
- Review workflows: `MEDIA_IS_REVIEWED = False` + editors; RBAC does not replace review
