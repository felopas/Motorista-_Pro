describe('Registro de Turno', () => {
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
                        diasFolga: ['2026-03-01', '2026-03-08', '2026-03-15', '2026-03-22', '2026-03-29'],
                        metaMensal: 9000, metaDiaria: 375, custoFixoDiario: 0,
                    },
                }))
            },
        })
        // Navega para registro
        cy.contains('Registrar').click()
    })

    it('exibe a etapa 1: Faturamento', () => {
        cy.contains('Quanto você faturou?').should('be.visible')
        cy.contains('Faturamento Bruto').should('be.visible')
        cy.contains('Passo 1 de 3').should('be.visible')
    })

    it('não permite avançar sem faturamento', () => {
        cy.contains('button', 'Avançar').should('be.disabled')
    })

    it('permite avançar com faturamento preenchido', () => {
        cy.get('input[type="number"]').first().type('450')
        cy.contains('button', 'Avançar').should('not.be.disabled')
    })

    it('mostra a meta dinâmica do dia na etapa 1', () => {
        cy.get('input[type="number"]').first().type('450')
        cy.contains('Meta Dinâmica do Dia').should('be.visible')
    })

    it('avança para etapa 2: Dados da Jornada', () => {
        cy.get('input[type="number"]').first().type('450')
        cy.contains('button', 'Avançar').click()

        cy.contains('Dados da Jornada').should('be.visible')
        cy.contains('Passo 2 de 3').should('be.visible')
        cy.contains('Quilômetros rodados').should('be.visible')
        cy.contains('Horas trabalhadas').should('be.visible')
    })

    it('não permite avançar na etapa 2 sem km e horas', () => {
        cy.get('input[type="number"]').first().type('450')
        cy.contains('button', 'Avançar').click()

        cy.contains('button', 'Avançar').should('be.disabled')
    })

    it('mostra preview do bruto vs meta na etapa 2', () => {
        cy.get('input[type="number"]').first().type('450')
        cy.contains('button', 'Avançar').click()

        cy.contains('Faturamento Bruto').should('be.visible')
        cy.contains('R$ 450,00').should('be.visible')
    })

    it('calcula custo de combustível na etapa 2', () => {
        cy.get('input[type="number"]').first().type('450')
        cy.contains('button', 'Avançar').click()

        // Preenche km e horas
        cy.get('input[placeholder="Ex: 210"]').type('200')
        cy.get('input[placeholder="Ex: 8"]').type('9')

        cy.contains('Custo combustível').should('be.visible')
    })

    it('avança para etapa 3: Resumo final', () => {
        // Etapa 1
        cy.get('input[type="number"]').first().type('450')
        cy.contains('button', 'Avançar').click()

        // Etapa 2
        cy.get('input[placeholder="Ex: 210"]').type('200')
        cy.get('input[placeholder="Ex: 8"]').type('9')
        cy.get('input[placeholder="Ex: 15"]').type('25')
        cy.contains('button', 'Avançar').click()

        // Etapa 3
        cy.contains('Resumo do Dia').should('be.visible')
        cy.contains('Passo 3 de 3').should('be.visible')
        cy.contains('Faturamento Bruto').should('be.visible')
        cy.contains('Lucro Líquido').should('be.visible')
        cy.contains('Combustível').should('be.visible')
    })

    it('botão Voltar retorna à etapa anterior', () => {
        cy.get('input[type="number"]').first().type('450')
        cy.contains('button', 'Avançar').click()

        cy.contains('button', 'Voltar').click()
        cy.contains('Quanto você faturou?').should('be.visible')
    })

    it('fluxo completo: registra e salva com sucesso', () => {
        // Etapa 1
        cy.get('input[type="number"]').first().type('450')
        cy.contains('button', 'Avançar').click()

        // Etapa 2
        cy.get('input[placeholder="Ex: 210"]').type('200')
        cy.get('input[placeholder="Ex: 8"]').type('9')
        cy.get('input[placeholder="Ex: 15"]').type('25')
        cy.contains('button', 'Avançar').click()

        // Etapa 3 — Finalizar
        cy.contains('button', 'Finalizar').click()

        // Tela de sucesso
        cy.contains('Registrado!').should('be.visible')
        cy.contains('Seu dia foi salvo com sucesso').should('be.visible')

        // Verifica que salvou no localStorage
        cy.window().then((win) => {
            const records = JSON.parse(win.localStorage.getItem('motorista_pro_records') || '[]')
            expect(records.length).to.be.greaterThan(0)
            const lastRecord = records[records.length - 1]
            expect(lastRecord.faturamentoBruto).to.eq(450)
            expect(lastRecord.kmRodado).to.eq(200)
            expect(lastRecord.horasTrabalhadas).to.eq(9)
            expect(lastRecord.numCorridas).to.eq(25)
            expect(lastRecord.ehFolga).to.eq(false)
            expect(lastRecord.metaDiaDinamica).to.be.a('number')
        })
    })

    it('botão Cancelar retorna ao dashboard', () => {
        cy.contains('button', 'Cancelar').click()
        // Deve estar no dashboard
        cy.contains('Março').should('be.visible')
    })
})
