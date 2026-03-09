describe('Análise / Histórico', () => {
    const records = [
        {
            id: 'rec-1', data: '2026-03-02', faturamentoBruto: 450, kmRodado: 200,
            horasTrabalhadas: 9, numCorridas: 25, custoCombustivel: 94.24,
            custoAlimentacao: 0, custoOutros: 0, custoTotal: 94.24,
            lucroLiquido: 355.76, ehFolga: false, metaDiaDinamica: 375,
        },
        {
            id: 'rec-2', data: '2026-03-03', faturamentoBruto: 300, kmRodado: 150,
            horasTrabalhadas: 7, numCorridas: 18, custoCombustivel: 70.68,
            custoAlimentacao: 0, custoOutros: 0, custoTotal: 70.68,
            lucroLiquido: 229.32, ehFolga: false, metaDiaDinamica: 370,
        },
        {
            id: 'rec-3', data: '2026-03-04', faturamentoBruto: 520, kmRodado: 250,
            horasTrabalhadas: 11, numCorridas: 32, custoCombustivel: 117.8,
            custoAlimentacao: 0, custoOutros: 0, custoTotal: 117.8,
            lucroLiquido: 402.2, ehFolga: false, metaDiaDinamica: 372,
        },
        {
            id: 'rec-4', data: '2026-03-05', faturamentoBruto: 200, kmRodado: 100,
            horasTrabalhadas: 5, numCorridas: 12, custoCombustivel: 47.12,
            custoAlimentacao: 0, custoOutros: 0, custoTotal: 47.12,
            lucroLiquido: 152.88, ehFolga: false, metaDiaDinamica: 380,
        },
    ]

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                win.localStorage.clear()
                win.localStorage.setItem('motorista_pro_user', JSON.stringify({
                    nome: 'Felipe', carro: 'Onix 2022', mediaGasolina: 12.5,
                    custosFixos: [], totalCustosFixos: 0,
                }))
                win.localStorage.setItem('motorista_pro_month_configs', JSON.stringify({
                    '2026-03': {
                        ano: 2026, mes: 3, diasPlanejados: 24,
                        diasFolga: ['2026-03-01', '2026-03-08'],
                        metaMensal: 9000, metaDiaria: 375, custoFixoDiario: 0,
                    },
                }))
                win.localStorage.setItem('motorista_pro_records', JSON.stringify(records))
            },
        })
        // Navega para Análise pelo BottomNav
        cy.contains('Análise').click()
    })

    it('exibe o título "Análise" e o mês atual', () => {
        cy.contains('h1', 'Análise').should('be.visible')
        cy.contains('Março 2026').should('be.visible')
    })

    it('exibe cards de Faturamento e Lucro Líquido', () => {
        cy.contains('Faturamento').should('be.visible')
        cy.contains('Lucro Líquido').should('be.visible')
    })

    it('exibe mini stats (Horas, KM, Corridas, Dias)', () => {
        cy.contains('Horas').should('be.visible')
        cy.contains('KM').should('be.visible')
        cy.contains('Corridas').should('be.visible')
    })

    it('exibe abas Gráficos e Dias', () => {
        cy.contains('Gráficos').should('be.visible')
        // Usar seletor mais específico para a aba "Dias" (dentro da TabsList)
        cy.get('[role="tablist"]').contains('Dias').should('be.visible')
    })

    describe('Aba Gráficos', () => {
        it('exibe gráfico de Faturamento por Dia', () => {
            cy.contains('Faturamento por Dia').should('be.visible')
        })

        it('exibe indicadores de eficiência', () => {
            cy.contains('Indicadores de Eficiência').should('be.visible')
            cy.contains('Bruto por KM').should('be.visible')
            cy.contains('Líquido por KM').should('be.visible')
            cy.contains('Bruto por Hora').should('be.visible')
            cy.contains('Média por Corrida').should('be.visible')
        })
    })

    describe('Aba Dias', () => {
        beforeEach(() => {
            // Clica na aba "Dias" usando o role=tab para evitar clicar no mini-stat
            cy.get('[role="tablist"]').contains('Dias').click()
        })

        it('exibe lista de dias trabalhados', () => {
            cy.contains('05/03').should('be.visible')
            cy.contains('04/03').should('be.visible')
            cy.contains('03/03').should('be.visible')
            cy.contains('02/03').should('be.visible')
        })

        it('exibe faturamento bruto de cada dia', () => {
            cy.contains('R$ 520,00').should('be.visible')
            cy.contains('R$ 450,00').should('be.visible')
            cy.contains('R$ 300,00').should('be.visible')
            cy.contains('R$ 200,00').should('be.visible')
        })

        it('exibe lucro líquido de cada dia', () => {
            cy.contains('Líq.').should('exist')
        })

        it('exibe informações do dia (horas, km, corridas)', () => {
            cy.contains('9h').should('be.visible')
            cy.contains('200km').should('be.visible')
            cy.contains('25 corridas').should('be.visible')
        })

        it('exibe barra de progresso com percentual', () => {
            cy.get('[class*="rounded-full"]').should('have.length.greaterThan', 0)
        })

        it('exibe "Meta do dia" para cada registro', () => {
            cy.contains('Meta do dia').should('exist')
        })

        it('cores corretas: verde para meta atingida', () => {
            // Dia 04/03 faturou R$520 vs meta R$375 → verde
            cy.get('[class*="bg-emerald-500"]').should('exist')
        })

        it('cores corretas: vermelho para abaixo da meta', () => {
            // Dia 05/03 faturou R$200 vs meta R$375 → vermelho (< 80%)
            cy.get('[class*="bg-red-500"]').should('exist')
        })
    })

    describe('Navegação entre meses', () => {
        it('navega para o mês anterior', () => {
            // O seletor de mês tem botões ChevronLeft/ChevronRight
            // Usamos o texto do mês para direcionar o clique no botão correto
            cy.contains('Março 2026').parent().find('button').first().click()
            cy.contains('Fevereiro 2026').should('be.visible')
        })

        it('navega para o mês seguinte', () => {
            // Vai para fevereiro
            cy.contains('Março 2026').parent().find('button').first().click()
            cy.contains('Fevereiro 2026').should('be.visible')
            // Volta para março
            cy.contains('Fevereiro 2026').parent().find('button').last().click()
            cy.contains('Março 2026').should('be.visible')
        })

        it('exibe mensagem quando mês não tem registros', () => {
            // Vai para um mês sem dados
            cy.contains('Março 2026').parent().find('button').first().click()
            cy.contains('Nenhum registro neste mês').should('be.visible')
        })
    })
})
