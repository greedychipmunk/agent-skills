# Layout Reference

## Build a Layout Outside-In

Four steps: scaffold the shell, structure content, tune spacing, then adapt across widths.

### 1. Scaffold

Pick the shell first. It defines the persistent frame and what's left to design.

| Shell | When |
| --- | --- |
| AppShell (with SideNav and/or TopNav) | Navigation apps — most products |
| Layout + LayoutPanel | Multi-pane tools (editor + detail, list + inspector) |
| Plain content column | Documents, forms, single-purpose pages |

```tsx
<AppShell sideNav={<SideNav>{/* nav items */}</SideNav>}>
  <Layout
    content={<LayoutContent>{/* main region */}</LayoutContent>}
    end={<LayoutPanel width={380} hasDivider>{/* detail */}</LayoutPanel>}
  />
</AppShell>
```

### 2. Structure

One lead per region. Rank with weight and color, not size. Reach for the weakest container that reads as a group.

| Container | When |
| --- | --- |
| Spacing | Default. Group by gap, not by border |
| Divider | When spacing alone doesn't separate |
| Section | When a group needs a heading or label |
| Card | For widgets, galleries, settings groups — not for every list item |

### 3. Spacing

Container owns padding and child gaps. One content line per region. Contrast tight and generous gaps so grouping reads without borders.

- Tight gaps (1–2) for related controls
- Medium gaps (3–4) for sections within a region
- Generous gaps (6–8) between regions

### 4. Breakpoints

Lock what each region does as width changes.

| Action | When |
| --- | --- |
| Divide | Split a region into two at a width threshold |
| Reveal | Show/hide secondary content based on available space |
| Resize | Change panel widths or content density |
| Swap | Replace one component with another (e.g., side panel → Dialog/BottomSheet) |

```tsx
const isMobile = useMediaQuery('(max-width: 768px)');

<Layout
  content={<LayoutContent>{/* table */}</LayoutContent>}
  end={isMobile ? <Dialog>{/* detail as dialog */}</Dialog> : <LayoutPanel width={380}>{/* detail */}</LayoutPanel>}
/>
```

## Navigation

### SideNav vs TopNav

| Nav | When |
| --- | --- |
| SideNav | Default. Absorbs unplanned destinations. Collapsible. Supports nested groups |
| TopNav | Shallow nav that must stay visible. Good for suites with 3–5 top-level products |
| Both | Genuine suites: TopNav for product identity and global actions, SideNav for in-product navigation |

### MobileNav

AppShell handles mobile navigation automatically at its `mobileNav` breakpoint. SideNav becomes MobileNav (drawer). Verify focus, close behavior, and route changes on narrow viewports.

### Nav Items

```tsx
import {SideNav, NavItem, NavSection} from '@astryxdesign/core/SideNav';

<SideNav>
  <NavSection label="Workspace">
    <NavItem label="Dashboard" href="/dashboard" active />
    <NavItem label="Projects" href="/projects" />
    <NavItem label="Settings" href="/settings" />
  </NavSection>
  <NavSection label="Account">
    <NavItem label="Profile" href="/profile" />
  </NavSection>
</SideNav>
```

## Layout Components

### AppShell

Persistent frame for navigation apps. Owns SideNav, TopNav, and mobile behavior.

```tsx
<AppShell
  sideNav={<SideNav>{/* ... */}</SideNav>}
  topNav={<TopNav>{/* ... */}</TopNav>}
>
  {children}
</AppShell>
```

### Layout

Multi-pane content arrangement. Use `content`, `start`, `end` props.

```tsx
<Layout
  content={<LayoutContent>{/* main */}</LayoutContent>}
  start={<LayoutPanel>{/* filters */}</LayoutPanel>}
  end={<LayoutPanel width={380} hasDivider>{/* detail */}</LayoutPanel>}
/>
```

### LayoutPanel

A pane within Layout. Accepts `width`, `hasDivider`, `isCollapsible`.

### LayoutContent

The main content region. Fills available space.

### VStack / HStack

Flexbox layout primitives with `gap` prop (accepts spacing step values 0–12).

```tsx
import {VStack, HStack} from '@astryxdesign/core/Layout';

<VStack gap={4}>
  <HStack gap={2} align="center">
    <Button label="Save" />
    <Button label="Cancel" variant="ghost" />
  </HStack>
</VStack>
```

## Density

| Density | When |
| --- | --- |
| Compact | Data-heavy tools, dashboards, tables |
| Comfortable | Most product UIs |
| Spacious | Marketing pages, onboarding, content-first pages |

Control density via spacing tokens and component `size` props, not by overriding individual padding.

## Responsive Design

### useMediaQuery

```tsx
import {useMediaQuery} from '@astryxdesign/core';

const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(max-width: 1024px)');
```

### Breakpoint Strategy

1. Design for the narrowest width first
2. Add panels and columns as width allows
3. Swap components (not just hide/show) when the experience changes fundamentally
4. Test at: 375px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop)

## Common Patterns

### Dashboard

```tsx
<AppShell sideNav={<SideNav>{/* ... */}</SideNav>}>
  <VStack gap={6}>
    <HStack gap={4}>
      <StatCard label="Revenue" value="$12.4k" />
      <StatCard label="Users" value="1,234" />
    </HStack>
    <Card>
      <Table data={data} columns={columns} />
    </Card>
  </VStack>
</AppShell>
```

### List + Detail

```tsx
<Layout
  content={<LayoutContent><Table data={items} columns={columns} /></LayoutContent>}
  end={<LayoutPanel width={380} hasDivider>{detail}</LayoutPanel>}
/>
```

### Settings

```tsx
<VStack gap={6}>
  <Section title="Appearance">
    <Switch label="Dark mode" value={isDark} onChange={setDark} />
  </Section>
  <Section title="Notifications">
    <Switch label="Email alerts" value={emailAlerts} onChange={setEmailAlerts} />
  </Section>
</VStack>
```
