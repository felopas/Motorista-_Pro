describe('Configurações', () => {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                win.localStorage.clear()
                win.localStorage.setItem('motorista_pro_user', JSON.stringify({
                    nome: 'Felipe',
                    carro: 'Onix 2022',
                    mediaGasolina: 12.5,
                    custosFixos: [
                        { id: 'fix1', descricao: 'Seguro Auto', valorMensal: 280, categoria: 'seguro', ativo: true },
                    ],
                    totalCustosFixos: 280,
                }))
                win.localStorage.setItem('motorista_pro_month_configs', JSON.stringify({
                    '2026-03': {
                        ano: 2026, mes: 3, diasPlanejados: 24,
                        diasFolga: [], metaMensal: 9000, metaDiaria: 375, custoFixoDiario: 0,
                    },
                }))
                win.localStorage.setItem('motorista_pro_records', JSON.stringify([
                    {
                        id: 'rec-1', data: '2026-03-03', faturamentoBruto: 450, kmRodado: 200,
                        horasTrabalhadas: 9, numCorridas: 25, custoCombustivel: 94.24,
                        custoAlimentacao: 0, custoOutros: 0, custoTotal: 94.24,
                        lucroLiquido: 355.76, ehFolga: false,
                    },
                ]))
            },
        })
        // Navega para Ajustes
        cy.contains('Ajustes').click()
    })

    it('exibe título "Configurações"', () => {
        cy.contains('Configurações').should('be.visible')
    })

    it('exibe card de perfil com dados preenchidos', () => {
        cy.contains('Perfil').should('be.visible')
        cy.get('input').first().should('have.value', 'Felipe')
    })

    it('exibe campo de nome com valor do usuário', () => {
        cy.get('input').eq(0).should('have.value', 'Felipe')
    })

    it('exibe campo de carro com valor do usuário', () => {
        cy.get('input').eq(1).should('have.value', 'Onix 2022')
    })

    it('exibe campo de média com valor do usuário', () => {
        cy.get('input').eq(2).should('have.value', '12.5')
    })

    it('permite editar e salvar nome', () => {
        cy.get('input').eq(0).clear().type('João Modificado')
        cy.contains('button', 'Salvar Alterações').click()

        cy.contains('Salvo!').should('be.visible')

        // Verifica localStorage
        cy.window().then((win) => {
            const user = JSON.parse(win.localStorage.getItem('motorista_pro_user') || '{}')
            expect(user.nome).to.eq('João Modificado')
        })
    })

    it('permite editar e salvar carro', () => {
        cy.get('input').eq(1).clear().type('HB20 2023')
        cy.contains('button', 'Salvar Alterações').click()

        cy.contains('Salvo!').should('be.visible')

        cy.window().then((win) => {
            const user = JSON.parse(win.localStorage.getItem('motorista_pro_user') || '{}')
            expect(user.carro).to.eq('HB20 2023')
        })
    })

    it('permite editar e salvar média de combustível', () => {
        cy.get('input').eq(2).clear().type('14.2')
        cy.contains('button', 'Salvar Alterações').click()

        cy.contains('Salvo!').should('be.visible')

        cy.window().then((win) => {
            const user = JSON.parse(win.localStorage.getItem('motorista_pro_user') || '{}')
            expect(user.mediaGasolina).to.eq(14.2)
        })
    })

    it('exibe botão de exportar backup', () => {
        cy.contains('Exportar Backup').should('be.visible')
    })

    it('exibe zona de perigo com botão de apagar dados', () => {
        cy.contains('Zona de Perigo').should('be.visible')
        cy.contains('Apagar Todos os Dados').should('be.visible')
    })

    it('pede confirmação antes de apagar dados', () => {
        cy.contains('Apagar Todos os Dados').click()
        cy.contains('Tem certeza?').should('be.visible')
        cy.contains('Esta ação não pode ser desfeita').should('be.visible')
        cy.contains('button', 'Confirmar').should('be.visible')
        cy.contains('button', 'Cancelar').should('be.visible')
    })

    it('cancela exclusão quando clica "Cancelar"', () => {
        cy.contains('Apagar Todos os Dados').click()
        cy.contains('button', 'Cancelar').click()
        // Deve voltar ao estado normal
        cy.contains('Apagar Todos os Dados').should('be.visible')
    })

    it('apaga todos os dados ao confirmar', () => {
        cy.contains('Apagar Todos os Dados').click()
        cy.contains('button', 'Confirmar').click()

        // Verifica que localStorage foi limpo
        cy.window().then((win) => {
            expect(win.localStorage.getItem('motorista_pro_records')).to.be.null
            expect(win.localStorage.getItem('motorista_pro_month_configs')).to.be.null
        })
    })

    it('botão voltar navega para dashboard', () => {
        // Clica no botão de voltar (ArrowLeft)
        cy.get('button').first().click()
        // Deve estar no dashboard
        cy.contains('Março').should('be.visible')
    })
})
