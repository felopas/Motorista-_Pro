# 🚗 Motorista Pro — Roadmap de Evolução

Análise do estado atual do app e ideias organizadas em 3 eixos: **novas funcionalidades**, **confiança do usuário** e **monetização futura**.

---

## 📊 Estado Atual do App

O Motorista Pro já possui uma base sólida:
- ✅ Dashboard com métricas e meta dinâmica
- ✅ Registro diário (faturamento, km, horas, corridas, custos)
- ✅ Configuração mensal com meta e dias de folga
- ✅ Histórico com gráficos (Recharts)
- ✅ Onboarding guiado
- ✅ Exportação de backup JSON
- ✅ Armazenamento local (localStorage)

---

## 🚀 Eixo 1 — Novas Funcionalidades

### 🔥 Prioridade Alta (impacto direto no dia a dia)

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 1 | **Múltiplos apps** | Permitir que o motorista registre ganhos separados por plataforma (Uber, 99, iFood, InDriver) e veja relatórios por app |
| 2 | **Preço do combustível** | Campo para o preço atual do litro, calculando custo de combustível automaticamente com base no km/l do veículo |
| 3 | **Relatório semanal/mensal em PDF** | Gerar um resumo visual (PDF) que o motorista pode compartilhar ou guardar |
| 4 | **Notificações/lembretes** | Lembrete diário para registrar o dia (via Capacitor Local Notifications) |
| 5 | **Importação de backup** | Complementar a exportação já existente com importação de JSON |
| 6 | **Modo claro/escuro** | Toggle de tema (atualmente só dark) |

### ⚡ Prioridade Média (diferencial competitivo)

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 7 | **Custos do veículo detalhados** | Registrar manutenções (troca de óleo, pneu, revisão) com data e valor, incluindo no cálculo de lucro |
| 8 | **Comparativo entre meses** | Gráfico lado a lado comparando meses ou períodos selecionados |
| 9 | **Calculadora de corrida** | "Vale a pena aceitar essa corrida?" — calcula lucro com base na distância estimada e valor ofertado |
| 10 | **Mapa de calor por dia da semana** | Mostrar quais dias da semana rendem mais, ajudando o motorista a planejar a agenda |
| 11 | **Widget na tela inicial** | Widget Android mostrando ganho do dia e meta restante (Capacitor Plugin) |
| 12 | **Ganhos por hora** | Métrica de R$/hora para ajudar o motorista a identificar horários mais lucrativos |

### 💡 Prioridade Baixa (futuro / nice-to-have)

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| 13 | **Integração com Google Sheets** | Sincronizar dados com planilha para quem já usa |
| 14 | **Suporte para entregadores** | Adaptação do app para motoboys (Rappi, iFood, Loggi) |
| 15 | **Multi-veículo** | Para quem trabalha com mais de um carro ou alterna carro/moto |
| 16 | **Modo offline avançado** | Service Worker para funcionar 100% offline com sync posterior |

---

## 🛡️ Eixo 2 — Confiança do Usuário

### 🔒 Segurança e Privacidade

| # | Melhoria | Impacto |
|---|----------|---------|
| 1 | **Backup automático na nuvem** | Evita perda de dados ao trocar de celular. Pode usar Firebase/Supabase gratuito no início |
| 2 | **Autenticação simples** | Login com Google/Email para vincular dados ao usuário (pré-requisito para nuvem) |
| 3 | **PIN/Biometria** | Bloqueio do app com PIN ou digital para proteger dados financeiros |
| 4 | **Política de privacidade** | Página dentro do app explicando que dados ficam no dispositivo (transparência) |

### 🎨 Experiência e Credibilidade

| # | Melhoria | Impacto |
|---|----------|---------|
| 5 | **Splash screen profissional** | Primeira impressão forte ao abrir o app |
| 6 | **Ícone e branding** | Ícone bonito + cores consistentes na loja e no app |
| 7 | **Avaliações na Play Store** | Popup gentil pedindo avaliação após 7 dias de uso (In-App Review API) |
| 8 | **Onboarding visual** | Telas com ilustrações mostrando o valor do app antes de pedir dados |
| 9 | **Feedback visual de ações** | Toasts/animações ao salvar, deletar, atingir meta (reforço positivo) |
| 10 | **"Sobre" com versão** | Tela de créditos, versão do app, link para suporte |
| 11 | **Changelog no app** | "O que há de novo" ao atualizar, mostrando evolução ativa |
| 12 | **Dicas contextuais** | Tooltips e textos explicativos para novos usuários (ex: "o que é meta dinâmica?") |

### 📈 Transparência nos Cálculos

| # | Melhoria | Impacto |
|---|----------|---------|
| 13 | **Detalhamento do lucro** | Mostrar a fórmula: `Faturamento - Combustível - Custos Fixos = Lucro` de forma visual |
| 14 | **Logs de alteração** | Registrar quando o usuário editou um dia, dando segurança que os dados estão corretos |

---

## 💰 Eixo 3 — Monetização Futura

### Fase 1 — Grátis com Valor (meses 1-6)
> **Objetivo:** Ganhar base de usuários e avaliações na Play Store

- App 100% gratuito, sem anúncios
- Foco em qualidade e confiança
- **Meta:** 1.000+ downloads e nota ≥ 4.5

### Fase 2 — Freemium (meses 6-12)
> **Objetivo:** Começar a gerar receita sem perder usuários

| Modelo | Gratuito | Premium (R$9,90/mês) |
|--------|----------|-----------------------|
| Registro diário | ✅ | ✅ |
| Dashboard + Meta | ✅ | ✅ |
| Histórico (último mês) | ✅ | ✅ |
| Histórico completo | ❌ | ✅ |
| Relatório em PDF | ❌ | ✅ |
| Backup na nuvem | ❌ | ✅ |
| Calculadora de corrida | ❌ | ✅ |
| Comparativo de meses | ❌ | ✅ |
| Sem anúncios | ❌ | ✅ |

### Fase 3 — Diversificação (12+ meses)
> **Objetivo:** Múltiplas fontes de receita

| Fonte | Descrição |
|-------|-----------|
| **Anúncios não-intrusivos** | Banner discreto na versão gratuita (AdMob) |
| **Assinatura anual** | Desconto de 30% vs mensal (R$83/ano ≈ R$6,90/mês) |
| **Parcerias** | Postos de gasolina, oficinas mecânicas, seguradoras — cupons dentro do app |
| **Marketplace de serviços** | Conectar motoristas a serviços automotivos com comissão |
| **Versão para frotas** | Plano empresarial para quem gerencia múltiplos motoristas (R$29,90/mês) |
| **Dados anonimizados** | Insights de mercado para empresas de mobilidade (longo prazo, com consentimento) |

---

## 🎯 Próximos Passos Recomendados

Ordem sugerida para máximo impacto com menor esforço:

```
1. 🔔 Notificações/lembretes diários (engajamento)
2. ⛽ Preço do combustível automático (precisão)
3. 🚕 Múltiplos apps (Uber, 99, etc.)
4. 📄 Política de privacidade (confiança)
5. 🌟 Splash screen + ícone profissional (branding)
6. ☁️ Backup na nuvem (retenção)
7. 📊 Relatório PDF compartilhável (viral)
8. 💎 Implementar modelo freemium (monetização)
```

---

> [!TIP]
> As funcionalidades gratuitas devem resolver o problema principal do motorista (saber se está lucrando). As premium devem oferecer **conveniência extra**, não bloquear funcionalidades essenciais. Isso gera boa vontade e avaliações positivas.
