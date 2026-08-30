// Seed data script - Gera dados fictícios para Fev e Mar 2026
// Execute no console do navegador com o app aberto

(function seedData() {
    // Helper: gerar ID
    function gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Helper: número aleatório entre min e max
    function rand(min, max) {
        return Math.round((Math.random() * (max - min) + min) * 100) / 100;
    }

    // Helper: inteiro aleatório
    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Perfil do motorista
    const user = {
        nome: "Felipe",
        carro: "Onix 1.0 2022",
        mediaGasolina: 12.5,
        custosFixos: [
            { id: gerarId(), descricao: "Seguro Auto", valorMensal: 280, categoria: "seguro", ativo: true },
            { id: gerarId(), descricao: "Financiamento", valorMensal: 850, categoria: "financiamento", ativo: true },
            { id: gerarId(), descricao: "Manutenção Preventiva", valorMensal: 150, categoria: "manutencao", ativo: true },
            { id: gerarId(), descricao: "IPVA (parcela)", valorMensal: 120, categoria: "ipva", ativo: true },
        ],
        totalCustosFixos: 1400,
    };

    // Configs dos meses
    const monthConfigs = {
        "2026-02": {
            ano: 2026,
            mes: 2,
            diasPlanejados: 22,
            diasFolga: ["2026-02-01", "2026-02-08", "2026-02-15", "2026-02-16", "2026-02-17", "2026-02-22"],
            metaMensal: 8000,
            metaDiaria: 8000 / 22, // ~363.64
            custoFixoDiario: 0,
        },
        "2026-03": {
            ano: 2026,
            mes: 3,
            diasPlanejados: 24,
            diasFolga: ["2026-03-01", "2026-03-07", "2026-03-08", "2026-03-15", "2026-03-22", "2026-03-29"],
            metaMensal: 9000,
            metaDiaria: 9000 / 24, // 375
            custoFixoDiario: 0,
        },
    };

    // Gerar registros de Fevereiro 2026
    const records = [];
    const precoGasolina = 5.89;
    const mediaKmLitro = 12.5;

    // Fev 2026 - dias de folga: 1, 8, 15, 16, 17 (carnaval), 22 (dom)
    const folgasFev = new Set([1, 8, 15, 16, 17, 22]);
    // Mar 2026 - dias de folga: 1, 7, 8, 15, 22, 29 (domingos)
    const folgasMar = new Set([1, 7, 8, 15, 22, 29]);

    // Calcular meta dinâmica acumulativa
    function calcMetaDinamica(metaMensal, diasPlanejados, brutoAcumulado, diasTrabalhados) {
        const falta = metaMensal - brutoAcumulado;
        const diasRestantes = diasPlanejados - diasTrabalhados;
        if (diasRestantes <= 0) return falta > 0 ? falta : 0;
        return Math.max(0, falta / diasRestantes);
    }

    // ----- FEVEREIRO 2026 -----
    let brutoAcumFev = 0;
    let diasTrabFev = 0;
    const totalDiasFev = 28;

    for (let dia = 1; dia <= totalDiasFev; dia++) {
        const dataStr = `2026-02-${String(dia).padStart(2, '0')}`;

        if (folgasFev.has(dia)) {
            // Registrar folga
            records.push({
                id: gerarId(),
                data: dataStr,
                faturamentoBruto: 0,
                kmRodado: 0,
                horasTrabalhadas: 0,
                numCorridas: 0,
                custoCombustivel: 0,
                custoAlimentacao: 0,
                custoOutros: 0,
                custoTotal: 0,
                lucroLiquido: 0,
                ehFolga: true,
            });
            continue;
        }

        // Dia de trabalho - valores realistas variados
        const diaDoSemana = new Date(2026, 1, dia).getDay();
        const ehSexta = diaDoSemana === 5;
        const ehSabado = diaDoSemana === 6;

        let bruto, horas, km, corridas;

        if (ehSexta || ehSabado) {
            // Fins de semana/sexta rendem mais
            bruto = rand(350, 550);
            horas = rand(9, 13);
            km = rand(180, 300);
            corridas = randInt(22, 40);
        } else {
            // Dias normais
            bruto = rand(250, 450);
            horas = rand(7, 11);
            km = rand(120, 250);
            corridas = randInt(15, 32);
        }

        // Alguns dias muito bons ou ruins para variar
        if (Math.random() < 0.15) {
            bruto = rand(500, 680); // Dia excelente
            corridas = randInt(30, 45);
        } else if (Math.random() < 0.1) {
            bruto = rand(150, 250); // Dia ruim
            corridas = randInt(8, 15);
        }

        const custoCombustivel = (km / mediaKmLitro) * precoGasolina;
        const custoTotal = custoCombustivel;
        const lucroLiquido = bruto - custoTotal;

        diasTrabFev++;
        const metaDinamica = calcMetaDinamica(8000, 22, brutoAcumFev, diasTrabFev - 1);
        brutoAcumFev += bruto;

        records.push({
            id: gerarId(),
            data: dataStr,
            faturamentoBruto: Math.round(bruto * 100) / 100,
            kmRodado: Math.round(km * 100) / 100,
            horasTrabalhadas: Math.round(horas * 100) / 100,
            numCorridas: corridas,
            custoCombustivel: Math.round(custoCombustivel * 100) / 100,
            custoAlimentacao: 0,
            custoOutros: 0,
            custoTotal: Math.round(custoTotal * 100) / 100,
            lucroLiquido: Math.round(lucroLiquido * 100) / 100,
            ehFolga: false,
            metaDiaDinamica: Math.round(metaDinamica * 100) / 100,
        });
    }

    // ----- MARÇO 2026 (até dia 8, dia atual) -----
    let brutoAcumMar = 0;
    let diasTrabMar = 0;
    const ultimoDiaMar = 8; // hoje é dia 8

    for (let dia = 1; dia <= ultimoDiaMar; dia++) {
        const dataStr = `2026-03-${String(dia).padStart(2, '0')}`;

        if (folgasMar.has(dia)) {
            records.push({
                id: gerarId(),
                data: dataStr,
                faturamentoBruto: 0,
                kmRodado: 0,
                horasTrabalhadas: 0,
                numCorridas: 0,
                custoCombustivel: 0,
                custoAlimentacao: 0,
                custoOutros: 0,
                custoTotal: 0,
                lucroLiquido: 0,
                ehFolga: true,
            });
            continue;
        }

        const diaDoSemana = new Date(2026, 2, dia).getDay();
        const ehSexta = diaDoSemana === 5;
        const ehSabado = diaDoSemana === 6;

        let bruto, horas, km, corridas;

        if (ehSexta || ehSabado) {
            bruto = rand(380, 580);
            horas = rand(9, 13);
            km = rand(190, 310);
            corridas = randInt(25, 42);
        } else {
            bruto = rand(280, 480);
            horas = rand(7, 12);
            km = rand(130, 260);
            corridas = randInt(16, 35);
        }

        // Variação aleatória
        if (Math.random() < 0.2) {
            bruto = rand(480, 700);
            corridas = randInt(28, 48);
        }

        const custoCombustivel = (km / mediaKmLitro) * precoGasolina;
        const custoTotal = custoCombustivel;
        const lucroLiquido = bruto - custoTotal;

        diasTrabMar++;
        const metaDinamica = calcMetaDinamica(9000, 24, brutoAcumMar, diasTrabMar - 1);
        brutoAcumMar += bruto;

        records.push({
            id: gerarId(),
            data: dataStr,
            faturamentoBruto: Math.round(bruto * 100) / 100,
            kmRodado: Math.round(km * 100) / 100,
            horasTrabalhadas: Math.round(horas * 100) / 100,
            numCorridas: corridas,
            custoCombustivel: Math.round(custoCombustivel * 100) / 100,
            custoAlimentacao: 0,
            custoOutros: 0,
            custoTotal: Math.round(custoTotal * 100) / 100,
            lucroLiquido: Math.round(lucroLiquido * 100) / 100,
            ehFolga: false,
            metaDiaDinamica: Math.round(metaDinamica * 100) / 100,
        });
    }

    // Salvar tudo no localStorage
    localStorage.setItem('motorista_pro_user', JSON.stringify(user));
    localStorage.setItem('motorista_pro_records', JSON.stringify(records));
    localStorage.setItem('motorista_pro_month_configs', JSON.stringify(monthConfigs));

    console.log('✅ Dados gerados com sucesso!');
    console.log(`   Fev 2026: ${diasTrabFev} dias trabalhados, Bruto total: R$ ${brutoAcumFev.toFixed(2)}`);
    console.log(`   Mar 2026: ${diasTrabMar} dias trabalhados, Bruto total: R$ ${brutoAcumMar.toFixed(2)}`);
    console.log(`   Total de registros: ${records.length}`);
    console.log('🔄 Recarregue a página para ver os dados!');
})();
