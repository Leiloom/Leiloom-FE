# Documentação Técnica - Front-End Radar Leilão

## 🚀 Tecnologias Utilizadas

- **Next.js** (v15.3.1): Framework React para renderização híbrida (SSR + SSG)
- **React** (v19): Biblioteca principal para construção de interfaces
- **Tailwind CSS** (v4.1.4): Framework de estilização com classes utilitárias
- **TypeScript**: Tipagem estática para maior robustez e previsibilidade
- **Heroicons**: Biblioteca de ícones SVG compatível com Tailwind e React

---

## 🌐 Estrutura de Pastas

```bash
src/
├── app/                      # (caso esteja usando App Router futuramente)
├── components/
│   ├── landing/
│   │   └── Hero.tsx          # Seção inicial da landing page
│   ├── shared/
│   │   └── Navbar.tsx        # Componente de navegação responsiva
├── layouts/
│   └── MainLayout.tsx        # Wrapper com Navbar e Main
├── pages/
│   └── index.tsx             # Página inicial (landing)
├── styles/
│   └── globals.css           # Estilos globais com diretivas Tailwind
```

--- 

## 🏘️ Layouts e Componentes

### 1. **Navbar.tsx**
- Componente responsivo
- Comportamento tipo XP Investimentos
- Contém:
  - Logo + nome do sistema (Radar Leilão)
  - Menu Desktop com links principais
  - Dropdown em "Leilões" (hover com submenu)
  - Botões de "Acesse sua conta" e "Criar conta"
  - Menu Mobile (hamburguer + drawer lateral)

### 2. **Hero.tsx**
- Seção inicial com gradiente de fundo
- Título centralizado com responsividade

### 3. **MainLayout.tsx**
- Componente de layout padrão
- Envolve todas as páginas com o Navbar no topo

---

## 📄 Configuração Tailwind

### `tailwind.config.js`
```js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### `postcss.config.js`
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### `globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

---

## 🪥 Padrões e Boas Práticas

- Componentização modular (ex: `/components/landing`, `/components/shared`)
- Nomeclatura clara e semântica
- Uso do `MainLayout` para padronização de estrutura entre telas
- Classes utilitárias do Tailwind organizadas para legibilidade
- Sem CSS personalizado até o momento
- Mobile-first responsivo via `md:`

---

## 🔧 Próximos Passos

- [ ] Criar seções da landing page (benefícios, planos, FAQ...)
- [ ] Refatorar os componentes em forma de seções reutilizáveis
- [ ] Adicionar animações com `framer-motion` (opcional)
- [ ] Implementar autenticação
- [ ] Integração com API (NestJS)

---

## ✨ Observação Final
Este projeto segue as melhores práticas de estruturação com Next.js e Tailwind CSS. A referência visual usada é o site da XP, adaptada ao contexto do sistema **Radar Leilão**.

---

Atualizado em: 21/04/2025
Responsável: Matheus Souza

 
/radar-leilao-fe
├── public/
├── src/
│   ├── components/      # Componentes reutilizáveis (botões, inputs, headers, etc.)
│   ├── layouts/         # Estrutura de layout (header, footer, etc.)
│   ├── pages/           # Páginas (Next cuida do roteamento aqui)
│   ├── styles/          # CSS/SCSS/Modules ou Tailwind config
│   ├── lib/             # Funções auxiliares, serviços externos, utils
│   ├── types/           # Tipagens globais
│   ├── hooks/           # Custom React Hooks
│   └── services/        # API clients (ex: Axios)
├── .gitignore
├── README.md
├── global.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
commit dia 16-03-2026
