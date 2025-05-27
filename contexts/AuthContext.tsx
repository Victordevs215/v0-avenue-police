'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import bcrypt from 'bcryptjs'
import { usuarioService } from '../lib/supabase'
import { db } from '@/lib/database'
import type { Usuario } from '@/types/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuthContextType {
  usuario: Usuario | null
  login: (passaporte: string, senha: string) => Promise<boolean>
  registrar: (dados: Omit<Usuario, 'id' | 'criadoEm' | 'ativo'>) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  updateUsuario: (updates: Partial<Usuario>) => Promise<void>
  syncStatus: 'online' | 'offline' | 'syncing'
  isConnected: boolean
  apagarConta: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('syncing')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    initializeAuth()
    setupRealtimeListeners()
  }, [])

  const checkConnection = async () => {
    try {
      const connected = await db.checkConnection()
      setIsConnected(connected)
      setSyncStatus(connected ? 'online' : 'offline')
      return connected
    } catch (error) {
      console.error('Erro ao verificar conexão:', error)
      setIsConnected(false)
      setSyncStatus('offline')
      return false
    }
  }

  const setupRealtimeListeners = () => {
    if (typeof window === 'undefined') return

    const canal = supabase
      .channel('public:usuarios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'usuarios' },
        (payload) => {
          window.dispatchEvent(new CustomEvent('avenue_usuarios_changed', { detail: payload }))
        }
      )
      .subscribe()

    const handleUsuarioChange = (event: any) => {
      console.log('🔄 Usuário alterado em tempo real:', event.detail)
      setSyncStatus('syncing')

      const usuarioAtual = JSON.parse(sessionStorage.getItem('usuario_logado') || '{}')

      if (usuarioAtual && event.detail.new && event.detail.new.id === usuarioAtual.id) {
        const updatedUser: Usuario = {
          id: event.detail.new.id,
          nome: event.detail.new.nome,
          passaporte: event.detail.new.passaporte,
          senha: event.detail.new.senha,
          tipo: event.detail.new.tipo,
          fotoPerfil: event.detail.new.foto_perfil,
          idade: event.detail.new.idade,
          patente: event.detail.new.patente,
          criadoEm: event.detail.new.criado_em,
          ativo: event.detail.new.ativo,
        }

        setUsuario(updatedUser)
        sessionStorage.setItem('usuario_logado', JSON.stringify(updatedUser))
      }

      setTimeout(() => setSyncStatus('online'), 1000)
    }

    window.addEventListener('avenue_usuarios_changed', handleUsuarioChange)

    return () => {
      window.removeEventListener('avenue_usuarios_changed', handleUsuarioChange)
      supabase.removeChannel(canal)
    }
  }

  const initializeAuth = async () => {
    try {
      console.log('🚀 Inicializando autenticação...')
      setSyncStatus('syncing')

      const connected = await checkConnection()
      if (!connected) {
        console.error('❌ Sem conexão com banco de dados')
        setSyncStatus('offline')
        return
      }

      const usuarioLogado = sessionStorage.getItem('usuario_logado')
      if (usuarioLogado) {
        try {
          const userData = JSON.parse(usuarioLogado)
          setUsuario(userData)
          setIsAuthenticated(true)
          console.log('✅ Sessão restaurada:', userData.nome)
        } catch {
          sessionStorage.removeItem('usuario_logado')
        }
      }

      await db.initializeDefaultData()
      setSyncStatus('online')
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error)
      setSyncStatus('offline')
    }
  }

  const login = async (passaporte: string, senha: string): Promise<boolean> => {
    try {
      console.log('🔐 Tentando login para:', passaporte)
      setSyncStatus('syncing')

      const data = await usuarioService.findByPassaporte(passaporte)
      if (!data || !data.ativo) {
        setSyncStatus('online')
        return false
      }

      const senhaCorreta = bcrypt.compareSync(senha, data.senha)
      if (!senhaCorreta) {
        setSyncStatus('online')
        return false
      }

      const usuarioLogado: Usuario = {
        id: data.id,
        nome: data.nome,
        passaporte: data.passaporte,
        tipo: data.tipo,
        criadoEm: data.criado_em,
        ativo: data.ativo,
        idade: data.idade,
        patente: data.patente,
        fotoPerfil: data.foto_perfil,
        senha: data.senha,
      }

      setUsuario(usuarioLogado)
      setIsAuthenticated(true)
      sessionStorage.setItem('usuario_logado', JSON.stringify(usuarioLogado))
      setSyncStatus('online')
      return true
    } catch (error) {
      console.error('Erro no login:', error)
      setSyncStatus('offline')
      return false
    }
  }

  const registrar = async (dados: Omit<Usuario, 'id' | 'criadoEm' | 'ativo'>): Promise<boolean> => {
    try {
      console.log('📝 Registrando usuário:', dados.nome)
      setSyncStatus('syncing')

      const existente = await usuarioService.findByPassaporte(dados.passaporte)
      if (existente) {
        setSyncStatus('online')
        return false
      }

      const senhaHash = bcrypt.hashSync(dados.senha, 10)

      await usuarioService.create({
        nome: dados.nome,
        passaporte: dados.passaporte,
        senha: senhaHash,
        tipo: dados.tipo,
        idade: dados.idade,
        patente: dados.patente,
        foto_perfil: dados.fotoPerfil,
        ativo: true,
      })

      setSyncStatus('online')
      return true
    } catch (error) {
      console.error('Erro no registro:', error)
      setSyncStatus('offline')
      return false
    }
  }

  const updateUsuario = async (updates: Partial<Usuario>): Promise<void> => {
    if (!usuario) return

    try {
      console.log('🔄 Atualizando usuário...')
      setSyncStatus('syncing')

      const updated = await db.updateUsuario(usuario.id, updates)
      setUsuario(updated)
      sessionStorage.setItem('usuario_logado', JSON.stringify(updated))
      setSyncStatus('online')
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      setSyncStatus('offline')
      throw error
    }
  }

  const logout = () => {
    console.log('👋 Fazendo logout...')
    setUsuario(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem('usuario_logado')
  }

  const apagarConta = async (): Promise<boolean> => {
    if (!usuario) return false

    try {
      await usuarioService.delete(usuario.id)
      logout()
      return true
    } catch (error) {
      console.error('Erro ao apagar conta:', error)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        registrar,
        logout,
        isAuthenticated,
        updateUsuario,
        syncStatus,
        isConnected,
        apagarConta,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
