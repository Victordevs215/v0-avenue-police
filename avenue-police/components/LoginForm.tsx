"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, UserPlus, LogIn, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import Image from "next/image"

export default function LoginForm() {
  const { login, registrar } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState<{ tipo: "sucesso" | "erro" | null; mensagem: string }>({
    tipo: null,
    mensagem: "",
  })

  // Estados do login
  const [loginData, setLoginData] = useState({
    passaporte: "",
    senha: "",
  })

  // Estados do registro
  const [registerData, setRegisterData] = useState({
    nome: "",
    passaporte: "",
    senha: "",
    tipo: "" as "policial" | "comando" | "advogado" | "dev",
  })

  const formatarNome = (valor: string) => {
    return valor.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
  }

  const formatarPassaporte = (valor: string) => {
    // Aceitar de 1 a 12 dígitos
    const numeros = valor.replace(/\D/g, "")
    return numeros.slice(0, 12)
  }

  const validarPassaporte = (passaporte: string) => {
    // Validar se tem entre 1 e 12 dígitos
    return passaporte.length >= 1 && passaporte.length <= 12 && /^\d+$/.test(passaporte)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!loginData.passaporte || !loginData.senha) {
      setNotification({ tipo: "erro", mensagem: "Preencha todos os campos" })
      setIsLoading(false)
      return
    }

    if (!validarPassaporte(loginData.passaporte)) {
      setNotification({ tipo: "erro", mensagem: "Passaporte deve ter entre 1 e 12 dígitos" })
      setIsLoading(false)
      return
    }

    const sucesso = await login(loginData.passaporte, loginData.senha)

    if (sucesso) {
      setNotification({ tipo: "sucesso", mensagem: "Login realizado com sucesso!" })
    } else {
      setNotification({ tipo: "erro", mensagem: "Passaporte ou senha incorretos" })
    }

    setIsLoading(false)
    setTimeout(() => setNotification({ tipo: null, mensagem: "" }), 3000)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!registerData.nome || !registerData.passaporte || !registerData.senha || !registerData.tipo) {
      setNotification({ tipo: "erro", mensagem: "Preencha todos os campos" })
      setIsLoading(false)
      return
    }

    if (registerData.nome.length < 3) {
      setNotification({ tipo: "erro", mensagem: "Nome deve ter pelo menos 3 caracteres" })
      setIsLoading(false)
      return
    }

    if (!validarPassaporte(registerData.passaporte)) {
      setNotification({ tipo: "erro", mensagem: "Passaporte deve ter entre 1 e 12 dígitos" })
      setIsLoading(false)
      return
    }

    if (registerData.senha.length < 6) {
      setNotification({ tipo: "erro", mensagem: "A senha deve ter pelo menos 6 caracteres" })
      setIsLoading(false)
      return
    }

    const sucesso = await registrar(registerData)

    if (sucesso) {
      setNotification({ tipo: "sucesso", mensagem: "Registro realizado com sucesso! Faça login." })
      setRegisterData({ nome: "", passaporte: "", senha: "", tipo: "" as any })
    } else {
      setNotification({ tipo: "erro", mensagem: "Passaporte já cadastrado" })
    }

    setIsLoading(false)
    setTimeout(() => setNotification({ tipo: null, mensagem: "" }), 3000)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Image src="/avenue-logo.gif" alt="Avenue Logo" width={80} height={40} className="object-contain" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">Governo Federal - Avenue City</h1>
              <p className="text-[#26C6DA] text-sm">Sistema da Avenue</p>
            </div>
          </div>
        </div>

        {/* Notificação */}
        {notification.tipo && (
          <div
            className={`p-4 rounded-lg border ${
              notification.tipo === "sucesso"
                ? "bg-green-900/90 border-green-700 text-green-100"
                : "bg-red-900/90 border-red-700 text-red-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${notification.tipo === "sucesso" ? "bg-green-400" : "bg-red-400"}`}
              ></div>
              <span className="text-sm font-medium">{notification.mensagem}</span>
            </div>
          </div>
        )}

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-white">
              <Shield className="h-5 w-5 text-[#26C6DA]" />
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-[#26C6DA]">Entre com suas credenciais ou registre-se</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-black">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-black"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Registro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-passaporte" className="text-white">
                      Passaporte (1-12 dígitos)
                    </Label>
                    <Input
                      id="login-passaporte"
                      type="text"
                      value={loginData.passaporte}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          passaporte: formatarPassaporte(e.target.value),
                        }))
                      }
                      placeholder="Digite seu passaporte"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-senha" className="text-white">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-senha"
                        type={showPassword ? "text" : "password"}
                        value={loginData.senha}
                        onChange={(e) => setLoginData((prev) => ({ ...prev, senha: e.target.value }))}
                        placeholder="Digite sua senha"
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-nome" className="text-white">
                      Nome Completo
                    </Label>
                    <Input
                      id="register-nome"
                      type="text"
                      value={registerData.nome}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          nome: formatarNome(e.target.value),
                        }))
                      }
                      placeholder="Digite seu nome completo"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-passaporte" className="text-white">
                      Passaporte (1-12 dígitos)
                    </Label>
                    <Input
                      id="register-passaporte"
                      type="text"
                      value={registerData.passaporte}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          passaporte: formatarPassaporte(e.target.value),
                        }))
                      }
                      placeholder="Digite seu passaporte"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-tipo" className="text-white">
                      Tipo de Acesso
                    </Label>
                    <Select
                      value={registerData.tipo}
                      onValueChange={(value: any) => setRegisterData((prev) => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione o tipo de acesso" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="policial" className="text-white hover:bg-gray-700">
                          👮 Policial
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                    ℹ️ Contas de Comando, Advogado e Desenvolvedor são criadas apenas pelo administrador do sistema
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-senha" className="text-white">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-senha"
                        type={showPassword ? "text" : "password"}
                        value={registerData.senha}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, senha: e.target.value }))}
                        placeholder="Digite uma senha (mín. 6 caracteres)"
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registrando..." : "Registrar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-gray-400 text-sm">
          <p>Sistema de Gestão Penal - Avenue City</p>
          <p>Acesso restrito a oficiais autorizados</p>
          <p className="text-xs mt-2 text-[#26C6DA]">🌐 Dados sincronizados globalmente</p>
        </div>
      </div>
    </div>
  )
}
