import { defineConfig } from 'cypress'

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        viewportWidth: 430,
        viewportHeight: 932,
        video: false,
        screenshotOnRunFailure: true,
        defaultCommandTimeout: 8000,
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
    },
})
