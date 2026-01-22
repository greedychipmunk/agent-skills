// storage-helpers.ts
// File upload/download utilities for Supabase Storage
// Place in: src/lib/storage-helpers.ts

import { supabase } from './supabase-client'
import type { Database } from '@/types/database.types'

// Note: React imports for hooks - remove if using in non-React environments
// For non-React environments (Node.js, Edge Functions), use the non-hook functions only
import { useState } from 'react'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface UploadOptions {
  cacheControl?: string
  contentType?: string
  upsert?: boolean
}

export interface UploadResult {
  path: string
  fullPath: string
  publicUrl?: string
}

// =============================================================================
// UPLOAD FUNCTIONS
// =============================================================================

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    cacheControl = '3600',
    upsert = false,
  } = options

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl,
      upsert,
    })

  if (error) throw error

  return {
    path: data.path,
    fullPath: data.fullPath,
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  bucket: string,
  files: Array<{ path: string; file: File | Blob }>,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploads = files.map(({ path, file }) =>
    uploadFile(bucket, path, file, options)
  )

  return Promise.all(uploads)
}

/**
 * Upload file with progress tracking
 * Note: For large files (>6MB), this simulates progress but still uploads the full file at once.
 * True chunked upload would require Edge Function or server-side implementation.
 */
export async function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File | Blob,
  onProgress: (progress: number) => void,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Simulate progress for better UX with smooth increments
  let progress = 0
  const progressInterval = setInterval(() => {
    progress = Math.min(90, progress + 5)
    onProgress(progress)
  }, 100)

  try {
    const result = await uploadFile(bucket, path, file, options)
    clearInterval(progressInterval)
    onProgress(100)
    return result
  } catch (error) {
    clearInterval(progressInterval)
    throw error
  }
}

/**
 * Upload image with client-side compression
 */
export async function uploadImage(
  bucket: string,
  path: string,
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<UploadResult> {
  // Compress image before upload
  const compressedFile = await compressImage(file, maxWidth, maxHeight, quality)
  
  return uploadFile(bucket, path, compressedFile, {
    contentType: file.type,
  })
}

// =============================================================================
// DOWNLOAD FUNCTIONS
// =============================================================================

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)

  if (error) throw error
  return data
}

/**
 * Download and convert to data URL
 */
export async function downloadFileAsDataUrl(bucket: string, path: string): Promise<string> {
  const blob = await downloadFile(bucket, path)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// =============================================================================
// URL FUNCTIONS
// =============================================================================

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Create a signed URL for private files
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // seconds
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

/**
 * Create signed URLs for multiple files
 */
export async function createSignedUrls(
  bucket: string,
  paths: string[],
  expiresIn: number = 3600
): Promise<string[]> {
  const urls = await Promise.all(
    paths.map(path => createSignedUrl(bucket, path, expiresIn))
  )
  return urls
}

// =============================================================================
// FILE MANAGEMENT
// =============================================================================

/**
 * List files in a bucket
 */
export async function listFiles(
  bucket: string,
  path: string = '',
  options: {
    limit?: number
    offset?: number
    sortBy?: { column: string; order: 'asc' | 'desc' }
  } = {}
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, options)

  if (error) throw error
  return data
}

/**
 * Delete a file
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
}

/**
 * Delete multiple files
 */
export async function deleteFiles(bucket: string, paths: string[]): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) throw error
}

/**
 * Move/rename a file
 */
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .move(fromPath, toPath)

  if (error) throw error
}

/**
 * Copy a file
 */
export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .copy(fromPath, toPath)

  if (error) throw error
}

// =============================================================================
// BUCKET MANAGEMENT
// =============================================================================

/**
 * Create a new bucket
 */
export async function createBucket(
  id: string,
  options: {
    public?: boolean
    fileSizeLimit?: number
    allowedMimeTypes?: string[]
  } = {}
): Promise<void> {
  const { error } = await supabase.storage.createBucket(id, {
    public: options.public ?? false,
    fileSizeLimit: options.fileSizeLimit,
    allowedMimeTypes: options.allowedMimeTypes,
  })

  if (error) throw error
}

/**
 * List all buckets
 */
export async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) throw error
  return data
}

/**
 * Delete a bucket
 */
export async function deleteBucket(id: string): Promise<void> {
  const { error } = await supabase.storage.deleteBucket(id)
  if (error) throw error
}

// =============================================================================
// IMAGE TRANSFORMATION
// =============================================================================

/**
 * Get transformed image URL (if Supabase transformation is enabled)
 */
export function getTransformedImageUrl(
  bucket: string,
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'origin' | 'webp'
  } = {}
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path, {
      transform: {
        width: options.width,
        height: options.height,
        quality: options.quality,
        format: options.format,
      },
    })

  return data.publicUrl
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique file path with timestamp
 */
export function generateFilePath(
  userId: string,
  fileName: string,
  folder?: string
): string {
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = folder
    ? `${folder}/${userId}/${timestamp}_${sanitizedName}`
    : `${userId}/${timestamp}_${sanitizedName}`
  
  return path
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -2)
      return file.type.startsWith(prefix)
    }
    return file.type === type
  })
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Compress image file
 */
async function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: file.type }))
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = reject
    }

    reader.onerror = reject
  })
}

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * Hook for file upload with progress
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const upload = async (
    bucket: string,
    path: string,
    file: File | Blob,
    options?: UploadOptions
  ) => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)

      const result = await uploadFileWithProgress(
        bucket,
        path,
        file,
        setProgress,
        options
      )

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, progress, error }
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
// Upload a file
import { uploadFile, generateFilePath } from '@/lib/storage-helpers'

const file = event.target.files[0]
const path = generateFilePath(userId, file.name, 'avatars')

try {
  const result = await uploadFile('avatars', path, file)
  console.log('Uploaded:', result.path)
} catch (error) {
  console.error('Upload failed:', error)
}

// Get public URL
import { getPublicUrl } from '@/lib/storage-helpers'

const avatarUrl = getPublicUrl('avatars', 'user123/avatar.jpg')

// Use in React component
import { useFileUpload } from '@/lib/storage-helpers'

function UploadComponent() {
  const { upload, uploading, progress } = useFileUpload()

  const handleUpload = async (file: File) => {
    const path = `uploads/${Date.now()}_${file.name}`
    await upload('public', path, file)
  }

  return (
    <div>
      {uploading && <progress value={progress} max={100} />}
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
    </div>
  )
}
*/
