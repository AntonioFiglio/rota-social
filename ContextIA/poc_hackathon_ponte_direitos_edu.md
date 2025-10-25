# POC: Ponte entre famílias e direitos sociais (32h)

## Objetivo

Criar um protótipo funcional que traduza dados escolares em recomendações dignas. O foco é identificar causas de faltas e encaminhar para serviços públicos. Provar fluxo de ponta a ponta em 32 horas.

## Princípios inegociáveis

1. Ser intencional sobre riscos aos humanos. Avaliar riscos continuamente. Usar cenários de hedging.  
2. Abrir a caixa fechada. Explicabilidade e transparência.  
3. Reclamar direitos de dados. Dados pertencem ao cidadão. Acesso mínimo por padrão.  
4. Confrontar vieses. Incluir warm data. Diversificar fontes.  
5. Responsabilizar atores. Contratos, comitê e DPO.  
6. Favorecer sistemas fracamente acoplados. Evitar monopólios de dados.  
7. Abraçar atrito criativo. Espaços para debate entre governo, sociedade e engenharia.

## Resumo da POC (entrega mínima)

- Ingestão simulada de dados escolares.  
- Motor de regras explicável.  
- Módulo simples de causas plausíveis.  
- Painel para a escola com alertas e justificativas.  
- Fluxo de consentimento e log auditável.  
- Mock de encaminhamento para serviços.

## Serviços públicos a priorizar na POC

- CRAS.  
- Serviço social da prefeitura.  
- Psicologia escolar ou municipal.  
- Programa de merenda e auxílio alimentação.  
- Transporte escolar.  
- Fornecimento de uniforme e material.  
- Bolsa família / CadÚnico.  
- Educação especial e reforço.  
- Saúde básica no posto.  
- Assistência jurídica básica.

## Funcionalidades prioritárias para MVP

- Ingestão com pseudonimização.  
- Regras explicáveis para faltas e advertências.  
- Checklist de causas com evidências.  
- Prioritização por gravidade.  
- Painel simples para coordenador.  
- Fluxo de consentimento claro e reversível.  
- Encaminhamento com confirmação humana.  
- Logs de auditoria e mascaramento.

## Opções de arquitetura para POC

1. Monolito Docker. SQLite criptografado. Backend Node ou Python. Front React. Fácil e rápido.  
2. Microserviços locais. Separar ingestão, regras e encaminhamento. Mostra desacoplamento.  
3. Serverless simulado. Pequenas funções para regras. Facilita escala.  
4. Edge-first escolar. Dados na escola. Enviar sinais agregados ao servidor.

## Padrões de privacidade e consentimento

- Minimização de dados. Coletar só o necessário.  
- Consentimento explícito e granular. Registrar cada uso.  
- Pseudonimização por padrão. Mapas de identidade separados.  
- Criptografia em trânsito e em repouso.  
- Logs de acesso auditáveis e com expiração.  
- Direito fácil de revogar e apagar dados.

## Explicabilidade e validação

- Regras legíveis em linguagem simples.  
- Linha do tempo que mostra os dados usados.  
- Score e incerteza visíveis para cada alerta.  
- Canal de contestação que gera revisão humana.  
- Conjunto de testes com casos de borda.

## Redução e auditoria de vieses

- Revisão demográfica inicial do dataset.  
- Warm data: notas qualitativas de família e professor.  
- Medir disparidade por renda, raça e gênero.  
- Human-in-the-loop para decisões sensíveis.  
- Registro de alterações de modelo e dataset.

## Responsabilização

- Contrato com SLA e cláusula LGPD.  
- Data Protection Officer municipal.  
- Comitê local de revisão com pais e escola.  
- Relatórios públicos de impacto e incidentes.

## Métricas de impacto e segurança

- Precisão em casos de teste.  
- Taxa de encaminhamentos concluídos.  
- Tempo médio de ação após alerta.  
- Redução de faltas em 30 dias para casos acompanhados.  
- Número e resolução de contestações.  
- Incidentes de privacidade por 1.000 usuários.

## Scripts curtos de comunicação

- Pais: "Detectamos aumento das faltas do seu filho. Podemos ajudar a entender o motivo e pedir apoio ao CRAS. Você autoriza?"  
- Escola: "Aluno com presença baixa. Causas prováveis: transporte, alimentação, uniforme, saúde ou apoio pedagógico. Sugerir reunião com família e encaminhamento."  
- CRAS: "Encaminhamos família X por risco de evasão. Ação sugerida: visita domiciliar e checagem de benefícios. Contato: escola Y, telefone Z."

## Plano detalhado 32 horas

- Hora 0-2: Kickoff. Divisão de tarefas. Definir 3 cenários sintéticos.  
- Hora 2-6: Backend mínimo. API de ingestão e DB local criptografado.  
- Hora 6-10: Motor de regras explicável. Regras conservadoras.  
- Hora 10-14: Módulo de causas com checklist e campos qualitativos.  
- Hora 14-18: Painel web para coordenador com alertas e justificativas.  
- Hora 18-22: Fluxo de consentimento e logs auditáveis.  
- Hora 22-26: Mock de encaminhamento para CRAS e serviços.  
- Hora 26-30: Testes com 3 cenários. Ajustes e mitigação de riscos.  
- Hora 30-32: Preparar demo e roteiro de apresentação.

## Cenários de teste sugeridos

1. Caso transporte: aluno com faltas crescentes. Motivo provável transporte. Encaminhamento ao serviço de transporte e CRAS.  
2. Caso alimentação: faltas e perda de peso. Motivo provável insegurança alimentar. Encaminhar merenda e CRAS.  
3. Caso conduta: várias advertências e suspensões. Motivo provável conflito ou risco familiar. Encaminhar psicologia e serviço social.

## Action items (checklist)

- [ ] Definir equipe e papéis: backend, frontend, regras, UX, teste.  
- [ ] Criar 3 cenários sintéticos com dados mínimos.  
- [ ] Montar repositório Git e pipeline Docker.  
- [ ] Implementar API de ingestão com pseudonimização.  
- [ ] Implementar motor de regras explicável.  
- [ ] Criar módulo de causas com checklist e campo livre.  
- [ ] Implementar painel simples para coordenador.  
- [ ] Implementar fluxo de consentimento e log auditável.  
- [ ] Criar mock de encaminhamento para CRAS e serviços.  
- [ ] Escrever 3 scripts de demonstração e roteiro de 5 minutos.  
- [ ] Testar os 3 cenários e registrar resultados.  
- [ ] Executar verificação básica de vieses por grupo demográfico.  
- [ ] Revisar e anexar cláusula de privacidade LGPD no repositório.  
- [ ] Preparar slides ou demo visual para apresentação.

## Observações finais

- Mantenha decisões humanas em todas as recomendações.  
- Priorize segurança e privacidade sobre escala.  
- Documente tudo para auditoria futura.


