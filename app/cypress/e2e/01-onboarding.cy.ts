describe('Onboarding - Primeiro Uso', () => {
    beforeEach(() => {
        // Limpa dados para simular primeiro acesso
        cy.visit('/', {
            onBeforeLoad(win) {
                win.localStorage.clear()
            },
        })
    })

    it('exibe tela de boas-vindas para usuário novo', () => {
        cy.contains('Bem-vindo ao Motorista Pro').should('be.visible')
        cy.contains('Configure seu perfil para começar').should('be.visible')
    })

    it('exibe campos de nome, carro e média', () => {
        cy.get('#nome').should('be.visible')
        cy.get('#carro').should('be.visible')
        cy.get('#media').should('be.visible')
    })

    it('botão "Começar a Usar" desabilitado sem nome e carro', () => {
        cy.contains('button', 'Começar a Usar').should('be.disabled')
    })

    it('botão habilitado ao preencher nome e carro', () => {
        cy.get('#nome').type('João Silva')
        cy.get('#carro').type('Onix 2022')
        cy.contains('button', 'Começar a Usar').should('not.be.disabled')
    })

    it('completa onboarding e redireciona para config do mês', () => {
        cy.get('#nome').type('João Silva')
        cy.get('#carro').type('Onix 2022')
        cy.get('#media').clear().type('12.5')
        cy.contains('button', 'Começar a Usar').click()

        // Redireciona para configuração do mês (pode mostrar "Pronto!" brevemente antes)
        cy.contains('Configurar Mês', { timeout: 5000 }).should('be.visible')
    })

    it('salva dados do usuário no localStorage', () => {
        cy.get('#nome').type('João Silva')
        cy.get('#carro').type('Onix 2022')
        cy.get('#media').clear().type('13')
        cy.contains('button', 'Começar a Usar').click()

        // Verifica localStorage após sucesso
        cy.window().then((win) => {
            const user = JSON.parse(win.localStorage.getItem('motorista_pro_user') || '{}')
            expect(user.nome).to.eq('João Silva')
            expect(user.carro).to.eq('Onix 2022')
            expect(user.mediaGasolina).to.eq(13)
        })
    })
})
