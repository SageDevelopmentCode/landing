import 'react-native-url-polyfill/auto'
import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

// SecureStore has a ~2KB value limit. Supabase session tokens exceed that,
// so we chunk large values across multiple keys.
const CHUNK_SIZE = 1800

const LargeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const chunkCount = await SecureStore.getItemAsync(`${key}.chunks`)
    if (!chunkCount) {
      return SecureStore.getItemAsync(key)
    }
    const count = parseInt(chunkCount, 10)
    const parts: string[] = []
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}.chunk_${i}`)
      if (chunk === null) return null
      parts.push(chunk)
    }
    return parts.join('')
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value)
      return
    }
    const chunks: string[] = []
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE))
    }
    await SecureStore.setItemAsync(`${key}.chunks`, String(chunks.length))
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}.chunk_${i}`, chunks[i])
    }
  },

  async removeItem(key: string): Promise<void> {
    const chunkCount = await SecureStore.getItemAsync(`${key}.chunks`)
    if (!chunkCount) {
      await SecureStore.deleteItemAsync(key)
      return
    }
    const count = parseInt(chunkCount, 10)
    await SecureStore.deleteItemAsync(`${key}.chunks`)
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}.chunk_${i}`)
    }
  },
}

const WebStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(key, value)
  },
  async removeItem(key: string): Promise<void> {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(key)
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? WebStorage : LargeSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
