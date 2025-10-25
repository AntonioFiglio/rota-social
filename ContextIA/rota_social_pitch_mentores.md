# RotaSocial — Pitch para Mentores

## Elevator pitch
RotaSocial conecta escola, família e rede de proteção. Usamos dados escolares digitais para detectar risco de evasão. Geramos recomendações acionáveis e encaminhamentos dignos. Mantemos controle de dados nas mãos das famílias.

## Princípios fundamentais
- Ser intencional sobre riscos aos humanos. Avaliar riscos sempre. Usar cenários e hedging.  
- Abrir a caixa fechada. Decisões explicáveis e contestáveis.  
- Reclamar direitos de dados das pessoas. A informação pertence ao cidadão.  
- Confrontar vieses. Incluir warm data e diversificar fontes.  
- Responsabilizar os atores. Contratos, DPO e comitê de revisão.  
- Favorecer sistemas fracamente acoplados. Evitar centralização de poder.  
- Abraçar o atrito criativo. Espaço para debate entre governo, sociedade e engenharia.

## Problema
Milhões de famílias têm direito a benefícios. Muitas não acessam o que lhes cabe. Informação espalhada. Linguagem burocrática. Processo intimidador. Nas escolas, sinais de risco passam despercebidos.

## Oportunidade
Dados escolares digitais podem sinalizar problemas cedo. Uma ponte simples reduz barreiras. Encaminhamentos rápidos evitam evasão. Serviços municipais podem atuar com mais precisão.

## Solução RotaSocial (resumo)
- Ingestão segura de dados escolares.  
- Motor de regras explicável que identifica faltas e padrões.  
- Módulo de causas com checklist e notas qualitativas.  
- Painel para coordenador com justificativas claras.  
- Fluxo de consentimento e log auditável.  
- Mock de encaminhamento ao CRAS e serviços municipais.

## Serviços públicos priorizados na POC
- CRAS.  
- Serviço social municipal.  
- Psicologia escolar ou teletriagem.  
- Merenda e auxílio alimentação.  
- Transporte escolar.  
- Fornecimento de uniforme ou material.  
- Verificação de elegibilidade para CadÚnico.

## Escopo da POC em 32 horas
- Ingestão simulada e pseudonimização.  
- Motor de regras explicável.  
- Painel simples para coordenador.  
- Fluxo de consentimento para família.  
- Encaminhamento mock para CRAS e psicologia.  
- Teste com 3 cenários sintéticos e demonstração end-to-end.

## Privacidade e segurança
- Minimização de dados. Coleta do estritamente necessário.  
- Pseudonimização por padrão. Mapas de identidade protegidos.  
- Criptografia em trânsito e em repouso.  
- Consentimento explícito e reversível.  
- Logs de acesso auditáveis e limitados.

## Explicabilidade e mitigação de vieses
- Regras legíveis em linguagem simples.  
- Linha do tempo da decisão com dados usados.  
- Human-in-the-loop para decisões sensíveis.  
- Medição de disparidade por grupos demográficos.  
- Registro de mudanças em modelos e datasets.

## Governança e responsabilização
- Contrato com SLA e cláusula LGPD.  
- Data Protection Officer municipal como ponto de contato.  
- Comitê local com pais, escola e governo.  
- Relatórios públicos de impacto e incidentes.

## Métricas de sucesso
- Precisão em casos de teste >= 80%.  
- Encaminhamento confirmado por caso teste.  
- Tempo médio entre alerta e ação < 72 horas.  
- Redução de faltas em 30 dias para casos acompanhados.

## Riscos críticos e mitigação rápida
- Vazamento de dados: criptografia, pseudonimização, acesso mínimo.  
- Encaminhamento indevido: confirmação humana antes do envio.  
- Reforço de vieses: medir disparidades e incluir warm data.  
- Uso comercial indevido: contrato, licença e auditoria externa.

## Demonstração planejada (5 minutos)
1. Apresentar cenário sintético: transporte, alimentação, conduta.  
2. Mostrar painel do coordenador e regra disparada.  
3. Exibir explicação simples e linha do tempo.  
4. Executar fluxo de consentimento com família.  
5. Simular encaminhamento ao CRAS e confirmação humana.

## O que pedimos aos mentores
- Feedback rápido sobre riscos e governança.  
- Sugestões para priorizar serviços municipais.  
- Indicação de contatos no município ou CRAS.  
- Ajuda para validar os critérios de aceitação.

## Action items
- [ ] Validar os 3 cenários sintéticos com especialistas em educação.  
- [ ] Montar repositório e pipeline Docker.  
- [ ] Implementar API de ingestão com pseudonimização.  
- [ ] Implementar motor de regras explicável.  
- [ ] Criar painel simples para coordenador.  
- [ ] Implementar fluxo de consentimento e logs auditáveis.  
- [ ] Preparar roteiro de demo de 5 minutos.  
- [ ] Anexar cláusula LGPD mínima no repositório.

---

RotaSocial é uma solução prática. Respeita privacidade, transparência e responsabilização. Promove ações locais rápidas. Estamos prontos para demonstrar em 32 horas.
