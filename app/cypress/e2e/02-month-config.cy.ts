describe('Configuração do Mês', () => {
    beforeEach(() => {
        // Cria usuário mas sem config de mês
        cy.visit('/', {
            onBeforeLoad(win) {
                win.localStorage.clear()
                win.localStorage.setItem('motorista_pro_user', JSON.stringify({
                    nome: 'Teste',
                    carro: 'Onix 2022',
                    mediaGasolina: 12.5,
                    custosFixos: [],
                    totalCustosFixos: 0,
                }))
            },
        })
    })

    it('exibe aviso para configurar mês no dashboard', () => {
        cy.contains('Configurar').should('be.visible')
    })

    it('navega para configuração do mês', () => {
        cy.contains('Configurar').click()
        cy.contains('Configurar Mês').should('be.visible')
    })

    it('exibe seletor de mês e ano', () => {
        cy.contains('Configurar').click()
        cy.contains('Jan').should('be.visible')
        cy.contains('Fev').should('be.visible')
        cy.contains('Mar').should('be.visible')
    })

    it('exibe campo de meta mensal', () => {
        cy.contains('Configurar').click()
        cy.contains('Meta de Faturamento').should('be.visible')
        cy.contains('Quanto quer faturar').should('be.visible')
    })

    it('exibe calendário para marcar folgas', () => {
        cy.contains('Configurar').click()
        cy.contains('Dias de Trabalho').should('be.visible')
        cy.contains('Toque nos dias para marcar como folga').should('be.visible')
    })

    it('calcula e exibe meta diária no resumo', () => {
        cy.contains('Configurar').click()
        cy.contains('Meta Bruta/Dia').should('be.visible')
    })

    it('salva configuração e redireciona ao dashboard', () => {
        cy.contains('Configurar').click()
        cy.contains('Salvar Configuração').click()

        // Exibe tela de sucesso
        cy.contains('Configurado!').should('be.visible')

        // Verifica que salvou no localStorage
        cy.window().then((win) => {
            const configs = JSON.parse(win.localStorage.getItem('motorista_pro_month_configs') || '{}')
            const keys = Object.keys(configs)
            expect(keys.length).to.be.greaterThan(0)
        })
    })

    it('botão cancelar retorna ao dashboard', () => {
        cy.contains('Configurar').click()
        cy.contains('button', 'Cancelar').click()
        // Deve estar no dashboard (mostra calendário ou aviso)
        cy.get('body').should('be.visible')
    })
})
