# 🚗 Motorista Pro

![License](https://img.shields.io/badge/licença-MIT-green)
![Platform](https://img.shields.io/badge/plataforma-Android-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

**Controle seus ganhos e lucros como motorista de aplicativo.** Saiba se você está lucrando ou perdendo dinheiro a cada dia trabalhado.

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Build para Android](#build-para-android)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## 📖 Sobre o Projeto

O **Motorista Pro** é um aplicativo mobile (Android) desenvolvido para motoristas de aplicativo que desejam ter controle real sobre seus ganhos e despesas. Diferente de simplesmente olhar o faturamento bruto, o app calcula o **lucro líquido** considerando combustível — mostrando o quanto você realmente está ganhando.

---

## ✨ Funcionalidades

- **📊 Dashboard inteligente** — Visão geral do mês com ganho bruto, lucro líquido, meta diária dinâmica e indicadores coloridos de desempenho.
- **📝 Registro diário** — Registre faturamento, km rodados, horas trabalhadas, número de corridas e custos do dia.
- **📅 Configuração mensal** — Defina meta mensal, dias planejados de trabalho e dias de folga no calendário.
- **📈 Histórico e análise** — Visualize gráficos de evolução, compare períodos e analise tendências de ganhos e custos.
- **⚙️ Configurações** — Gerencie seu perfil, dados do veículo, média de consumo (km/l) e custos fixos mensais.
- **🎯 Meta dinâmica** — A meta diária se recalcula automaticamente com base nos dias restantes e na meta mensal pendente.
- **🔄 Onboarding** — Configuração guiada para novos usuários.

---

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|-----------|
| **Framework** | [React 19](https://react.dev/) |
| **Build Tool** | [Vite 7](https://vite.dev/) |
| **Linguagem** | [TypeScript 5.9](https://www.typescriptlang.org/) |
| **Estilização** | [Tailwind CSS 3](https://tailwindcss.com/) |
| **Componentes UI** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Gráficos** | [Recharts](https://recharts.org/) |
| **Formulários** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Mobile** | [Capacitor](https://capacitorjs.com/) (Android) |
| **Testes E2E** | [Cypress 15](https://www.cypress.io/) |
| **Ícones** | [Lucide React](https://lucide.dev/) |

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) >= 20.x
- [npm](https://www.npmjs.com/) >= 9.x
- [Android Studio](https://developer.android.com/studio) (apenas para build mobile)

Verifique as versões instaladas:

```bash
node --version   # >= 20.0.0
npm --version    # >= 9.0.0
```

---

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/felopitos/motorista-pro.git

# Acesse a pasta do projeto
cd motorista-pro/app

# Instale as dependências
npm install
```

---

## 💻 Uso

### Servidor de desenvolvimento

```bash
npm run dev
```

O app estará disponível em `http://localhost:5173` (acessível na rede local via `--host 0.0.0.0`).

### Build de produção

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`.

### Preview da build

```bash
npm run preview
```

---

## 📁 Estrutura do Projeto

```
app/
├── android/                # Projeto nativo Android (Capacitor)
├── cypress/                # Testes end-to-end
│   ├── e2e/                # Suítes de teste
│   │   ├── 01-onboarding.cy.ts
│   │   ├── 02-month-config.cy.ts
│   │   ├── 03-dashboard.cy.ts
│   │   ├── 04-register.cy.ts
│   │   ├── 05-history.cy.ts
│   │   └── 06-settings.cy.ts
│   └── support/            # Comandos customizados
├── public/                 # Arquivos estáticos
├── src/
│   ├── components/         # Componentes reutilizáveis (40+ shadcn/ui)
│   ├── contexts/           # Context API (estado global)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários e helpers
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard.tsx   # Tela principal com métricas
│   │   ├── History.tsx     # Histórico e análise
│   │   ├── MonthConfig.tsx # Configuração do mês
│   │   ├── Onboarding.tsx  # Configuração inicial
│   │   ├── Register.tsx    # Registro diário
│   │   └── Settings.tsx    # Configurações do app
│   ├── types/              # Definições de tipos TypeScript
│   ├── App.tsx             # Componente raiz
│   ├── index.css           # Estilos globais
│   └── main.tsx            # Ponto de entrada
├── capacitor.config.ts     # Configuração do Capacitor
├── tailwind.config.js      # Configuração do Tailwind CSS
├── vite.config.ts          # Configuração do Vite
└── package.json
```

---

## 🧪 Testes

O projeto utiliza **Cypress** para testes end-to-end, cobrindo todos os fluxos principais:

| Suíte | Cobertura |
|-------|-----------|
| `01-onboarding` | Fluxo de cadastro inicial |
| `02-month-config` | Configuração mensal e metas |
| `03-dashboard` | Dashboard e métricas |
| `04-register` | Registro diário de ganhos |
| `05-history` | Histórico e análise |
| `06-settings` | Configurações e perfil |

### Executar testes

```bash
# Interface interativa do Cypress
npm run cypress:open

# Executar todos os testes no terminal
npm run cypress:run
```

> **Nota:** O servidor de desenvolvimento (`npm run dev`) deve estar rodando antes de executar os testes.

---

## 📱 Build para Android

O projeto utiliza o **Capacitor** para gerar o APK nativo Android.

```bash
# Build da versão web
npm run build

# Sincronizar com o projeto Android
npx cap sync android

# Abrir no Android Studio
npx cap open android
```

No Android Studio, execute `Build > Build Bundle(s) / APK(s) > Build APK(s)` para gerar o APK.

**App ID:** `com.motoristapro.app`

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um **fork** do projeto
2. Crie sua branch de feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um **Pull Request**

### Padrão de commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

| Prefixo | Uso |
|---------|-----|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Documentação |
| `style:` | Formatação (sem alteração de código) |
| `refactor:` | Refatoração |
| `test:` | Adição/correção de testes |
| `chore:` | Tarefas de manutenção |

---

<p align="center">
  Feito com 💚 para motoristas de aplicativo
</p>
