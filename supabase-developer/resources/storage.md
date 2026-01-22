# Storage

## Overview

Supabase Storage provides S3-compatible object storage with:
- Bucket-based organization
- Row Level Security integration
- Image transformations
- Resumable uploads
- CDN delivery

## Bucket Management

### Creating Buckets
```sql
-- Via SQL (recommended for version control)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,  -- 10MB limit
  array['application/pdf', 'application/msword', 'text/plain']
);
```

### Via Client
```typescript
// Create bucket (requires service role)
const { data, error } = await supabase.storage.createBucket('avatars', {
  public: true,
  fileSizeLimit: 1024 * 1024 * 2, // 2MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
})

// List buckets
const { data: buckets } = await supabase.storage.listBuckets()

// Delete bucket
const { error } = await supabase.storage.deleteBucket('old-bucket')
```

## Storage Policies

### Public Bucket Policies
```sql
-- Anyone can view files in public bucket
create policy "Public avatars are viewable by everyone"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload to their folder
create policy "Users can upload their avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own avatar
create policy "Users can update their avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatar
create policy "Users can delete their avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Private Bucket Policies
```sql
-- Users can only access their own files
create policy "Users can access own documents"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'documents'
    and owner_id = auth.uid()
  )
  with check (
    bucket_id = 'documents'
    and owner_id = auth.uid()
  );
```

### Organization-Based Storage
```sql
-- Org members can access org files
create policy "Org members can access files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'org-files'
    and exists (
      select 1 from public.organization_members
      where organization_id = (storage.foldername(name))[1]::uuid
      and user_id = auth.uid()
    )
  );
```

## File Operations

### Upload Files
```typescript
// Simple upload
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true, // Overwrite if exists
    contentType: 'image/png'
  })

// Upload from base64
const base64Data = 'data:image/png;base64,iVBORw0KGgo...'
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('path/file.png', decode(base64Data), {
    contentType: 'image/png'
  })

// Resumable upload (large files)
const { data, error } = await supabase.storage
  .from('videos')
  .uploadToSignedUrl(path, token, file, {
    cacheControl: '3600'
  })
```

### Upload with Progress
```typescript
// Using XMLHttpRequest for progress
async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
) {
  const { data: { session } } = await supabase.auth.getSession()

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress((e.loaded / e.total) * 100)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(xhr.statusText))
      }
    })

    xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token}`)
    xhr.send(file)
  })
}
```

### Download Files
```typescript
// Download file
const { data, error } = await supabase.storage
  .from('documents')
  .download('report.pdf')

// data is a Blob
const url = URL.createObjectURL(data)

// Download as array buffer
const { data } = await supabase.storage
  .from('documents')
  .download('report.pdf')
const arrayBuffer = await data.arrayBuffer()
```

### Get URLs
```typescript
// Public URL (for public buckets)
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl('user123/avatar.png')

// Signed URL (for private buckets)
const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl('private/report.pdf', 3600) // 1 hour expiry

// Signed URLs for multiple files
const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrls(['file1.pdf', 'file2.pdf'], 3600)

// Signed upload URL
const { data, error } = await supabase.storage
  .from('uploads')
  .createSignedUploadUrl('path/to/file.pdf')
```

### List Files
```typescript
// List files in folder
const { data, error } = await supabase.storage
  .from('documents')
  .list('folder', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  })

// List with search
const { data, error } = await supabase.storage
  .from('documents')
  .list('folder', {
    search: 'report'
  })
```

### Move and Copy
```typescript
// Move file
const { error } = await supabase.storage
  .from('documents')
  .move('old/path/file.pdf', 'new/path/file.pdf')

// Copy file
const { error } = await supabase.storage
  .from('documents')
  .copy('source/file.pdf', 'destination/file.pdf')
```

### Delete Files
```typescript
// Delete single file
const { error } = await supabase.storage
  .from('documents')
  .remove(['path/to/file.pdf'])

// Delete multiple files
const { error } = await supabase.storage
  .from('documents')
  .remove(['file1.pdf', 'file2.pdf', 'file3.pdf'])

// Delete folder (all contents)
const { data: files } = await supabase.storage
  .from('documents')
  .list('folder-to-delete')

const filePaths = files?.map(f => `folder-to-delete/${f.name}`) || []
await supabase.storage.from('documents').remove(filePaths)
```

## Image Transformations

### Transform on Request
```typescript
// Get transformed public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl('user123/avatar.png', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover'
    }
  })

// Transform options
const options = {
  width: 800,           // Target width
  height: 600,          // Target height
  resize: 'cover',      // cover, contain, fill
  format: 'webp',       // origin, webp
  quality: 80           // 1-100
}
```

### Signed URL with Transform
```typescript
const { data, error } = await supabase.storage
  .from('photos')
  .createSignedUrl('photo.jpg', 3600, {
    transform: {
      width: 400,
      height: 300,
      resize: 'contain'
    }
  })
```

### Common Transformations
```typescript
// Thumbnail
const thumbnail = supabase.storage
  .from('photos')
  .getPublicUrl('photo.jpg', {
    transform: { width: 150, height: 150, resize: 'cover' }
  })

// Profile picture (square)
const profile = supabase.storage
  .from('avatars')
  .getPublicUrl('avatar.jpg', {
    transform: { width: 200, height: 200, resize: 'cover', format: 'webp' }
  })

// Banner image
const banner = supabase.storage
  .from('banners')
  .getPublicUrl('banner.jpg', {
    transform: { width: 1200, height: 400, resize: 'cover' }
  })
```

## React Integration

### File Upload Component
```typescript
function FileUpload({ bucket, path, onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)

    const fileExt = file.name.split('.').pop()
    const filePath = `${path}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    setUploading(false)

    if (error) {
      console.error('Upload error:', error)
    } else {
      onUpload(data.path)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <progress value={progress} max="100" />}
    </div>
  )
}
```

### Avatar Component
```typescript
function Avatar({ userId, size = 100 }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${userId}/avatar.png`, {
        transform: {
          width: size,
          height: size,
          resize: 'cover'
        }
      })
    setAvatarUrl(publicUrl)
  }, [userId, size])

  return (
    <img
      src={avatarUrl || '/default-avatar.png'}
      alt="Avatar"
      width={size}
      height={size}
      onError={(e) => {
        e.currentTarget.src = '/default-avatar.png'
      }}
    />
  )
}
```

## Best Practices

### File Organization
```
bucket/
├── {user_id}/           # User-specific files
│   ├── avatar.png
│   └── documents/
├── {org_id}/            # Organization files
│   └── shared/
└── public/              # Publicly accessible
```

### Security
1. Always set appropriate bucket visibility (public/private)
2. Implement RLS policies for all buckets
3. Use signed URLs for sensitive files
4. Validate file types before upload
5. Set file size limits on buckets
6. Sanitize filenames to prevent path traversal

### Performance
1. Use image transformations for responsive images
2. Set appropriate cache control headers
3. Use CDN for frequently accessed files
4. Implement lazy loading for images
5. Consider using signed URLs with caching

### File Validation
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large' }
  }

  return { valid: true }
}
```

### Cleanup Orphaned Files
```sql
-- Find files not referenced in database
select o.name
from storage.objects o
left join public.profiles p on o.name like p.id::text || '/%'
where o.bucket_id = 'avatars'
and p.id is null;
```
