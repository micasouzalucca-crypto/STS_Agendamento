document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('agendamentoForm');
    const messageBox = document.getElementById('messageBox');
    const submitButton = document.getElementById('submitButton');

    // PEGA A URL DO FORMSPREE DIRETAMENTE DO ATRIBUTO 'action' DO FORMULÁRIO
    const formspreeEndpoint = form.getAttribute('action');
    
    // *******************************************************************
    // NOVO: URL DE REDIRECIONAMENTO APÓS SUCESSO. SUBSTITUA ESTE VALOR!
    const REDIRECT_URL = 'https://micasouzalucca-crypto.github.io/STS_Agendamento/'; 
    // Exemplo: 'https://www.lifeclin.com.br/contato' ou 'https://wa.me/5599999999999'
    // *******************************************************************

    // -------------------------------------------------------------------
    // APLICAÇÃO DAS MÁSCARAS DE ENTRADA (IMask.js)
    // -------------------------------------------------------------------

    // 1. Máscara de Telefone (Fixo ou Celular - Brasil)
    const telefoneInput = document.getElementById('telefone');
    const phoneMask = {
        mask: [
            { mask: '(00) 0000-0000' }, // Telefone fixo
            { mask: '(00) 00000-0000' } // Celular (com 9º dígito)
        ]
    };
    const imaskTelefone = IMask(telefoneInput, phoneMask);

    // 2. Máscara de CNPJ/CPF (Documento Brasileiro)
    const docInput = document.getElementById('cnpjCpf');
    const docMask = {
        mask: [
            {
                mask: '000.000.000-00', // CPF (11 dígitos)
                max: 11
            },
            {
                mask: '00.000.000/0000-00', // CNPJ (14 dígitos)
                max: 14
            }
        ]
    };
    const imaskCnpjCpf = IMask(docInput, docMask);

    // -------------------------------------------------------------------
    // LÓGICA DE ENVIO (Formspree)
    // -------------------------------------------------------------------

    // Função para exibir mensagem de status
    function displayMessage(message, type) {
        messageBox.classList.remove('hidden', 'success', 'error');
        messageBox.classList.add(type);
        messageBox.textContent = message;
    }

    // Função para tratar o envio (Formspree)
    async function enviarParaFormspree(formData) {
        try {
            const response = await fetch(formspreeEndpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: formData 
            });

            if (response.ok) {
                // Se o envio foi OK, retorna sucesso
                return { success: true, message: 'Solicitação enviada com sucesso! Redirecionando...' };
            } else {
                const data = await response.json();
                let errorMessage = data.error || 'Ocorreu um erro no servidor de agendamento.';
                return { success: false, message: `Falha no envio: ${errorMessage}` };
            }

        } catch (error) {
            console.error('Erro de rede ou Formspree:', error);
            return { success: false, message: 'Erro de conexão. Verifique sua rede e tente novamente.' };
        }
    }

    // Evento de submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpa mensagens anteriores
        messageBox.classList.add('hidden');
        
        // Validação de campos (o 'required' do HTML já ajuda)
        if (!form.checkValidity()) {
            displayMessage('Por favor, preencha todos os campos obrigatórios corretamente.', 'error');
            return;
        }

        // Validação adicional: Verifica se o CNPJ/CPF e Telefone foram preenchidos
        const docValue = imaskCnpjCpf.unmaskedValue;
        if (docValue.length < 11 || (docValue.length > 11 && docValue.length < 14)) {
             displayMessage('Por favor, preencha o CNPJ/CPF por completo.', 'error');
             return;
        }

        const phoneValue = imaskTelefone.unmaskedValue;
        if (phoneValue.length < 10) {
             displayMessage('Por favor, preencha o Telefone com o DDD e o número completo.', 'error');
             return;
        }


        // Verifica se a URL do Formspree foi atualizada (segurança)
        if (formspreeEndpoint === 'YOUR_FORMSPREE_ENDPOINT') {
            displayMessage('ERRO DE CONFIGURAÇÃO: Por favor, substitua "YOUR_FORMSPREE_ENDPOINT" pela sua URL real do Formspree no index.html.', 'error');
            return;
        }
        
        // Desabilita o botão e mostra status de carregamento
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando... Aguarde...';
        displayMessage('Processando solicitação e enviando e-mail...', 'success');

        const formData = new FormData(form);
        const resultadoEnvio = await enviarParaFormspree(formData);

        // Processa o resultado
        if (resultadoEnvio.success) {
            displayMessage(resultadoEnvio.message, 'success');
            
            // ***************************************************
            // NOVO: REDIRECIONAMENTO APÓS 3 SEGUNDOS
            // ***************************************************
            setTimeout(() => {
                if (REDIRECT_URL === 'SUA_NOVA_URL') {
                    // Se o usuário esqueceu de trocar a URL de sucesso, apenas limpamos o form
                    console.warn('Alerta: Substitua "SUA_NOVA_URL" no script.js para que o redirecionamento funcione.');
                    form.reset(); 
                    imaskTelefone.updateValue('');
                    imaskCnpjCpf.updateValue('');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Enviar Solicitação de Pré-Agendamento';
                    displayMessage('Solicitação enviada! Por favor, entre em contato via telefone para a confirmação final.', 'success');
                } else {
                    // Se a URL foi fornecida, redireciona o usuário
                    window.location.href = REDIRECT_URL;
                }
            }, 3000); // Espera 3 segundos para o usuário ler a mensagem de sucesso

        } else {
            // Caso de falha, exibe o erro e reabilita o botão imediatamente
            displayMessage(resultadoEnvio.message, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Solicitação de Pré-Agendamento';
        }
    });
});