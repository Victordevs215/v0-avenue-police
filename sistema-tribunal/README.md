### Estrutura de Pastas e Arquivos

```
/tribunal-system
│
├── /components
│   ├── /ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── textarea.tsx
│   ├── Home.tsx
│   └── PainelTribunal.tsx
│
├── /contexts
│   └── AuthContext.tsx
│
├── /lib
│   ├── database.ts
│   └── supabase.ts
│
├── /pages
│   ├── index.tsx
│   └── login.tsx
│
├── /styles
│   └── globals.css
│
├── /types
│   ├── auth.ts
│   └── tribunal.ts
│
├── package.json
└── tsconfig.json
```

### Conteúdo dos Arquivos

#### 1. `index.tsx` (Tela Inicial)

```tsx
// pages/index.tsx
import { useRouter } from 'next/router';
import { Button } from '../components/ui/button';

export default function Home() {
  const router = useRouter();

  const handlePoliceLogin = () => {
    router.push('/login?role=police');
  };

  const handleCourtLogin = () => {
    router.push('/login?role=court');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Sistema de Tribunal</h1>
      <p className="text-lg mb-8">Selecione uma opção para continuar:</p>
      <div className="space-y-4">
        <Button onClick={handlePoliceLogin} className="bg-blue-600 hover:bg-blue-700">
          Entrar na Polícia
        </Button>
        <Button onClick={handleCourtLogin} className="bg-green-600 hover:bg-green-700">
          Entrar no Tribunal
        </Button>
      </div>
    </div>
  );
}
```

#### 2. `login.tsx` (Tela de Login)

```tsx
// pages/login.tsx
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Login() {
  const router = useRouter();
  const { role } = router.query;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Lógica de autenticação aqui
    console.log(`Login como ${role}: ${username}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Login {role === 'police' ? 'Policial' : 'Tribunal'}</h1>
      <div className="space-y-4">
        <div>
          <Label>Nome de Usuário</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <Label>Senha</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button onClick={handleLogin} className="bg-green-600 hover:bg-green-700">
          Entrar
        </Button>
      </div>
    </div>
  );
}
```

#### 3. `PainelTribunal.tsx` (Painel do Tribunal)

```tsx
// components/PainelTribunal.tsx
import { Button } from './ui/button';

export default function PainelTribunal() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold">Painel do Tribunal</h1>
      {/* Adicione mais componentes e lógica aqui */}
      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Gerenciar Casos</Button>
    </div>
  );
}
```

#### 4. Componentes UI

Os componentes de UI (`button.tsx`, `input.tsx`, etc.) devem ser criados de forma semelhante ao que foi feito no `PainelAdmin.tsx`, utilizando classes Tailwind CSS para estilização.

### Considerações Finais

- **Autenticação**: A lógica de autenticação deve ser implementada no `handleLogin` da página de login.
- **Estilização**: Utilize Tailwind CSS para estilizar os componentes, conforme o design do `PainelAdmin.tsx`.
- **Funcionalidades**: Adicione as funcionalidades necessárias para o sistema de tribunal, como gerenciamento de casos, usuários, etc.

Essa estrutura básica deve ajudá-lo a começar o desenvolvimento do seu sistema de tribunal.