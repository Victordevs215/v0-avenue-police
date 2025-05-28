### Estrutura de Pastas

A estrutura de pastas do seu novo projeto pode ser assim:

```
tribunal/
├── components/
│   ├── TribunalHome.tsx
│   ├── PoliceHome.tsx
│   ├── TribunalPanel.tsx
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
├── pages/
│   ├── index.tsx
│   ├── tribunal.tsx
│   └── police.tsx
├── lib/
│   ├── database.ts
│   └── supabase.ts
└── types/
    ├── auth.ts
    └── criminal-articles.ts
```

### Implementação dos Componentes

1. **`index.tsx`** - Tela inicial que permite selecionar entre a polícia e o tribunal.

```tsx
// pages/index.tsx
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Sistema Judicial</h1>
      <div className="space-x-4">
        <Button onClick={() => router.push("/police")} className="bg-blue-600 hover:bg-blue-700">
          Entrar na Polícia
        </Button>
        <Button onClick={() => router.push("/tribunal")} className="bg-green-600 hover:bg-green-700">
          Entrar no Tribunal
        </Button>
      </div>
    </div>
  );
}
```

2. **`tribunal.tsx`** - Tela especializada para o tribunal.

```tsx
// pages/tribunal.tsx
import TribunalPanel from "@/components/TribunalPanel";

export default function TribunalPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <TribunalPanel />
    </div>
  );
}
```

3. **`police.tsx`** - Tela especializada para a polícia.

```tsx
// pages/police.tsx
import PoliceHome from "@/components/PoliceHome";

export default function PolicePage() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <PoliceHome />
    </div>
  );
}
```

4. **`TribunalPanel.tsx`** - Componente para o painel do tribunal.

```tsx
// components/TribunalPanel.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TribunalPanel() {
  const [cases, setCases] = useState([]);

  const loadCases = async () => {
    // Lógica para carregar casos do tribunal
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Painel do Tribunal</h1>
      <Button onClick={loadCases} className="bg-blue-600 hover:bg-blue-700">
        Carregar Casos
      </Button>
      {/* Renderizar casos aqui */}
    </div>
  );
}
```

5. **`PoliceHome.tsx`** - Componente para o painel da polícia.

```tsx
// components/PoliceHome.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PoliceHome() {
  const [officers, setOfficers] = useState([]);

  const loadOfficers = async () => {
    // Lógica para carregar dados da polícia
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Painel da Polícia</h1>
      <Button onClick={loadOfficers} className="bg-blue-600 hover:bg-blue-700">
        Carregar Policiais
      </Button>
      {/* Renderizar dados da polícia aqui */}
    </div>
  );
}
```

### Design Moderno

Para um design moderno, você pode usar bibliotecas como Tailwind CSS (que já parece estar sendo usada no seu projeto) ou Material-UI. Certifique-se de que todos os componentes reutilizáveis, como botões e cartões, estejam estilizados de forma consistente.

### Conclusão

Com essa estrutura e implementação, você terá um novo projeto que permite aos usuários escolher entre entrar na polícia ou no tribunal, com telas especializadas para cada função. Você pode expandir a lógica de cada componente conforme necessário para atender aos requisitos do seu sistema.