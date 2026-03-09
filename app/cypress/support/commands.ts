// ========================================
// Comandos Customizados do Cypress
// ========================================

const STORAGE_KEYS = {
    USER: 'motorista_pro_user',
    RECORDS: 'motorista_pro_records',
    MONTH_CONFIGS: 'motorista_pro_month_configs',
}

// Perfil padrão para testes
const defaultUser = {
    nome: 'Teste Motorista',
    carro: 'Onix 1.0 2022',
    mediaGasolina: 12.5,
    custosFixos: [
        { id: 'fix1', descricao: 'Seguro Auto', valorMensal: 280, categoria: 'seguro', ativo: true },
        { id: 'fix2', descricao: 'Financiamento', valorMensal: 850, categoria: 'financiamento', ativo: true },
    ],
    totalCustosFixos: 1130,
}

// Config de mês padrão (março 2026)
const defaultMonthConfig = {
    '2026-03': {
        ano: 2026,
        mes: 3,
        diasPlanejados: 24,
        diasFolga: ['2026-03-01', '2026-03-08', '2026-03-15', '2026-03-22', '2026-03-29'],
        metaMensal: 9000,
        metaDiaria: 375,
        custoFixoDiario: 0,
    },
}

// Registros de exemplo
function generateRecords() {
    const records: any[] = []
    const diasTrabalho = [2, 3, 4, 5, 6, 9, 10]

    let brutoAcumulado = 0
    let diasTrab = 0

    diasTrabalho.forEach((dia) => {
        const bruto = 300 + Math.round(Math.random() * 200)
        const km = 150 + Math.round(Math.random() * 100)
        const horas = 7 + Math.round(Math.random() * 4)
        const corridas = 15 + Math.round(Math.random() * 15)
        const custoCombustivel = (km / 12.5) * 5.89
        const lucroLiquido = bruto - custoCombustivel

        diasTrab++
        const falta = 9000 - brutoAcumulado
        const diasRestantes = 24 - (diasTrab - 1)
        const metaDinamica = diasRestantes > 0 ? Math.max(0, falta / diasRestantes) : 0
        brutoAcumulado += bruto

        records.push({
            id: `rec-${dia}`,
            data: `2026-03-${String(dia).padStart(2, '0')}`,
            faturamentoBruto: bruto,
            kmRodado: km,
            horasTrabalhadas: horas,
            numCorridas: corridas,
            custoCombustivel: Math.round(custoCombustivel * 100) / 100,
            custoAlimentacao: 0,
            custoOutros: 0,
            custoTotal: Math.round(custoCombustivel * 100) / 100,
            lucroLiquido: Math.round(lucroLiquido * 100) / 100,
            ehFolga: false,
            metaDiaDinamica: Math.round(metaDinamica * 100) / 100,
        })
    })

    return records
}

Cypress.Commands.add('clearAppData', () => {
    cy.window().then((win) => {
        win.localStorage.removeItem(STORAGE_KEYS.USER)
        win.localStorage.removeItem(STORAGE_KEYS.RECORDS)
        win.localStorage.removeItem(STORAGE_KEYS.MONTH_CONFIGS)
    })
})

Cypress.Commands.add('seedUser', (user?: any) => {
    cy.window().then((win) => {
        win.localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user || defaultUser))
    })
})

Cypress.Commands.add('seedMonthConfig', (config?: any) => {
    cy.window().then((win) => {
        win.localStorage.setItem(STORAGE_KEYS.MONTH_CONFIGS, JSON.stringify(config || defaultMonthConfig))
    })
})

Cypress.Commands.add('seedRecords', (records?: any[]) => {
    cy.window().then((win) => {
        win.localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records || generateRecords()))
    })
})

Cypress.Commands.add('seedFullApp', () => {
    cy.window().then((win) => {
        win.localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser))
        win.localStorage.setItem(STORAGE_KEYS.MONTH_CONFIGS, JSON.stringify(defaultMonthConfig))
        win.localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(generateRecords()))
    })
})

// Declaração de tipos para TypeScript
declare global {
    namespace Cypress {
        interface Chainable {
            clearAppData(): Chainable<void>
            seedUser(user?: any): Chainable<void>
            seedMonthConfig(config?: any): Chainable<void>
            seedRecords(records?: any[]): Chainable<void>
            seedFullApp(): Chainable<void>
        }
    }
}

export { }
