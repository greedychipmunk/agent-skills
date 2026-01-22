# Realtime

## Overview

Supabase Realtime provides three main features:
- **Postgres Changes**: Listen to database INSERT, UPDATE, DELETE events
- **Broadcast**: Publish and subscribe to messages between clients
- **Presence**: Track and sync online user state

## Postgres Changes

### Enable Realtime for Tables
```sql
-- Enable in Dashboard or via SQL
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- Check enabled tables
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

### Subscribe to All Changes
```typescript
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',           // INSERT, UPDATE, DELETE, or *
      schema: 'public',
      table: 'messages'
    },
    (payload) => {
      console.log('Change received:', payload)
      // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      // payload.new: new row data (INSERT/UPDATE)
      // payload.old: old row data (UPDATE/DELETE)
    }
  )
  .subscribe()
```

### Subscribe to Specific Events
```typescript
// Only INSERT events
const channel = supabase
  .channel('new-messages')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      console.log('New message:', payload.new)
    }
  )
  .subscribe()

// Only UPDATE events
const channel = supabase
  .channel('updated-messages')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'messages' },
    (payload) => {
      console.log('Updated:', payload.old, '->', payload.new)
    }
  )
  .subscribe()

// Only DELETE events
const channel = supabase
  .channel('deleted-messages')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'messages' },
    (payload) => {
      console.log('Deleted:', payload.old)
    }
  )
  .subscribe()
```

### Filter Changes
```typescript
// Filter by column value
const channel = supabase
  .channel('room-messages')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: 'room_id=eq.123'
    },
    (payload) => {
      console.log('Room 123 message:', payload)
    }
  )
  .subscribe()

// Multiple filters (use in clause)
const channel = supabase
  .channel('my-notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      showNotification(payload.new)
    }
  )
  .subscribe()
```

### Listen to Multiple Tables
```typescript
const channel = supabase
  .channel('all-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => handleMessageChange(payload)
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'users' },
    (payload) => handleUserChange(payload)
  )
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications' },
    (payload) => handleNewNotification(payload)
  )
  .subscribe()
```

## Broadcast

### Send Messages
```typescript
const channel = supabase.channel('room-1')

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    // Send message to all subscribers
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: { text: 'Hello everyone!' }
    })
  }
})
```

### Receive Messages
```typescript
const channel = supabase.channel('room-1')

channel
  .on('broadcast', { event: 'message' }, (payload) => {
    console.log('Received:', payload)
  })
  .on('broadcast', { event: 'typing' }, (payload) => {
    console.log('User typing:', payload)
  })
  .subscribe()
```

### Cursor Tracking Example
```typescript
// Send cursor position
const channel = supabase.channel('cursors')

channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    document.addEventListener('mousemove', (e) => {
      channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId: currentUser.id,
          x: e.clientX,
          y: e.clientY
        }
      })
    })
  }
})

// Receive cursors from others
channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
  if (payload.userId !== currentUser.id) {
    updateCursor(payload.userId, payload.x, payload.y)
  }
})
```

## Presence

### Track User State
```typescript
const channel = supabase.channel('online-users')

// Track this user
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      user_id: currentUser.id,
      username: currentUser.username,
      online_at: new Date().toISOString()
    })
  }
})
```

### Listen to Presence Changes
```typescript
const channel = supabase.channel('online-users')

// Sync event - fired when state changes
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  console.log('Online users:', Object.keys(state).length)

  // state structure: { <presence_key>: [{ ...payload }] }
  for (const [key, presences] of Object.entries(state)) {
    for (const presence of presences) {
      console.log('User:', presence.username)
    }
  }
})

// Join event - when a user joins
channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
  console.log('User joined:', newPresences)
})

// Leave event - when a user leaves
channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
  console.log('User left:', leftPresences)
})

channel.subscribe()
```

### Update Presence State
```typescript
// Update tracked state
await channel.track({
  user_id: currentUser.id,
  username: currentUser.username,
  status: 'away',
  updated_at: new Date().toISOString()
})

// Untrack (go offline)
await channel.untrack()
```

## React Hooks

### useRealtimeMessages
```typescript
function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    // Load initial messages
    supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data)
      })

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((m) => m.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return messages
}
```

### usePresence
```typescript
function usePresence(channelName: string) {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const channelRef = useRef<RealtimeChannel>()

  useEffect(() => {
    const channel = supabase.channel(channelName)
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat() as User[]
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            username: currentUser.username,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [channelName])

  const updateStatus = async (status: string) => {
    await channelRef.current?.track({
      user_id: currentUser.id,
      username: currentUser.username,
      status,
      updated_at: new Date().toISOString()
    })
  }

  return { onlineUsers, updateStatus }
}
```

### useBroadcast
```typescript
function useBroadcast<T>(channelName: string, eventName: string) {
  const [messages, setMessages] = useState<T[]>([])
  const channelRef = useRef<RealtimeChannel>()

  useEffect(() => {
    const channel = supabase.channel(channelName)
    channelRef.current = channel

    channel
      .on('broadcast', { event: eventName }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as T])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, eventName])

  const send = async (payload: T) => {
    await channelRef.current?.send({
      type: 'broadcast',
      event: eventName,
      payload
    })
  }

  return { messages, send }
}
```

## Channel Management

### Connection Status
```typescript
const channel = supabase
  .channel('my-channel')
  .subscribe((status, err) => {
    switch (status) {
      case 'SUBSCRIBED':
        console.log('Connected to channel')
        break
      case 'CHANNEL_ERROR':
        console.error('Channel error:', err)
        break
      case 'TIMED_OUT':
        console.error('Connection timed out')
        break
      case 'CLOSED':
        console.log('Channel closed')
        break
    }
  })
```

### Cleanup
```typescript
// Remove specific channel
supabase.removeChannel(channel)

// Remove all channels
supabase.removeAllChannels()

// Get all active channels
const channels = supabase.getChannels()
```

## RLS with Realtime

### Secure Realtime Access
```sql
-- Enable RLS on realtime
-- Messages only visible if user is member of room
create policy "Room members can receive messages"
  on public.messages
  for select
  using (
    exists (
      select 1 from public.room_members
      where room_id = messages.room_id
      and user_id = auth.uid()
    )
  );
```

### Authorized Channels
```typescript
// Client must be authenticated
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  const channel = supabase
    .channel('private-room')
    .on('postgres_changes', {...}, handler)
    .subscribe()
}
```

## Best Practices

### 1. Always Clean Up Channels
```typescript
useEffect(() => {
  const channel = supabase.channel('my-channel').subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### 2. Debounce High-Frequency Events
```typescript
import { debounce } from 'lodash'

const sendCursorPosition = debounce((x, y) => {
  channel.send({
    type: 'broadcast',
    event: 'cursor',
    payload: { x, y }
  })
}, 50)
```

### 3. Handle Reconnection
```typescript
supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') {
    // Channels automatically reconnect with new token
  }
})
```

### 4. Limit Subscriptions
```typescript
// Don't create multiple channels for same subscription
// Bad
messages.forEach(m => {
  supabase.channel(`message-${m.id}`).subscribe()
})

// Good
supabase.channel('all-messages')
  .on('postgres_changes', { table: 'messages' }, handler)
  .subscribe()
```

### 5. Use Filters to Reduce Traffic
```typescript
// Don't subscribe to all changes, use filters
const channel = supabase
  .channel('my-messages')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `user_id=eq.${currentUser.id}` // Only my messages
    },
    handler
  )
  .subscribe()
```

## Debugging

### Enable Debug Logging
```typescript
const supabase = createClient(url, key, {
  realtime: {
    params: {
      log_level: 'debug'
    }
  }
})
```

### Monitor Channel State
```typescript
const channel = supabase.channel('debug-channel')

console.log('Channel state:', channel.state)
// 'joined' | 'joining' | 'leaving' | 'closed'
```
