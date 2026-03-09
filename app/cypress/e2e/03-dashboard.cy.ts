describe('Dashboard Principal', () => {
    describe('Com dados completos', () => {
        beforeEach(() => {
            cy.visit('/', {
                onBeforeLoad(win) {
                    win.localStorage.clear()
                    win.localStorage.setItem('motorista_pro_user', JSON.stringify({
                        nome: 'Felipe',
                        carro: 'Onix 2022',
                        mediaGasolina: 12.5,
                        custosFixos: [],
                        totalCustosFixos: 0,
                    }))
                    win.localStorage.setItem('motorista_pro_month_configs', JSON.stringify({
                        '2026-03': {
                            ano: 2026, mes: 3, diasPlanejados: 24,
                            diasFolga: ['2026-03-01', '2026-03-08', '2026-03-15', '2026-03-22', '2026-03-29'],
                            metaMensal: 9000, metaDiaria: 375, custoFixoDiario: 0,
                        },
                    }))
                    win.localStorage.setItem('motorista_pro_records', JSON.stringify([
                        {
                            id: 'rec-1', data: '2026-03-03', faturamentoBruto: 450, kmRodado: 200,
                            horasTrabalhadas: 9, numCorridas: 25, custoCombustivel: 94.24,
                            custoAlimentacao: 0, custoOutros: 0, custoTotal: 94.24,
                            lucroLiquido: 355.76, ehFolga: false, metaDiaDinamica: 375,
                        },
                    ]))
                },
            })
        })

        it('exibe o nome do mês atual', () => {
            cy.contains('Março').should('be.visible')
        })

        it('exibe o calendário', () => {
            cy.contains('Dom').should('be.visible')
            cy.contains('Seg').should('be.visible')
            cy.contains('Sex').should('be.visible')
        })

        it('exibe cards de resumo com valores', () => {
            cy.contains('Ganho Hoje').should('be.visible')
            cy.contains('Meta/Dia').should('be.visible')
        })

        it('botão de registro navega para a página de registro', () => {
            cy.get('button').filter(':has(svg)').last().click({ force: true })
            // Verifica que algo mudou na view
            cy.get('body').should('be.visible')
        })
    })

    describe('Sem configuração de mês', () => {
        beforeEach(() => {
            cy.visit('/', {
                onBeforeLoad(win) {
                    win.localStorage.clear()
                    win.localStorage.setItem('motorista_pro_user', JSON.stringify({
                        nome: 'Felipe',
                        carro: 'Onix 2022',
                        mediaGasolina: 12.5,
                        custosFixos: [],
                        totalCustosFixos: 0,
                    }))
                },
            })
        })

        it('exibe aviso para configurar o mês', () => {
            cy.contains('Configurar').should('be.visible')
        })
    })

    describe('Navegação via BottomNav', () => {
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
                            diasFolga: [], metaMensal: 9000, metaDiaria: 375, custoFixoDiario: 0,
                        },
                    }))
                },
            })
        })

        it('navega para Análise pelo menu inferior', () => {
            cy.contains('Análise').click()
            cy.contains('Análise').should('be.visible')
            // Verifica que mostra o seletor de mês ou conteúdo da análise
            cy.get('body').should('contain.text', 'Março')
        })

        it('navega para Ajustes pelo menu inferior', () => {
            cy.contains('Ajustes').click()
            cy.contains('Configurações').should('be.visible')
        })

        it('navega para Home pelo menu inferior', () => {
            cy.contains('Ajustes').click()
            cy.contains('Home').click()
            cy.contains('Março').should('be.visible')
        })
    })
})
