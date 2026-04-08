import api from './client';

// Auth
export const login = (credentials) =>
  api.post('/auth/token/', credentials);

// Salão
export const getServicos = (params) => api.get('/salao/servicos/', { params });
export const createServico = (data) => api.post('/salao/servicos/', data);
export const updateServico = (id, data) => api.patch(`/salao/servicos/${id}/`, data);
export const deleteServico = (id) => api.delete(`/salao/servicos/${id}/`);

export const getProfissionais = (params) => api.get('/salao/profissionais/', { params });
export const createProfissional = (data) => api.post('/salao/profissionais/', data);
export const updateProfissional = (id, data) => api.patch(`/salao/profissionais/${id}/`, data);
export const deleteProfissional = (id) => api.delete(`/salao/profissionais/${id}/`);
export const getHorariosDisponiveis = (profissionalId, data, duracao) =>
  api.get(`/salao/profissionais/${profissionalId}/horarios_disponiveis/`, {
    params: { data, duracao_minutos: duracao },
  });

export const getConfiguracao = () => api.get('/salao/configuracao/atual/');
export const updateConfiguracao = (id, data) => api.patch(`/salao/configuracao/${id}/`, data);

// Agendamentos
export const getAgendamentos = (params) => api.get('/agenda/agendamentos/', { params });
export const getAgendamentosHoje = () => api.get('/agenda/agendamentos/hoje/');
export const getAgendamentosPorData = (data, profissional) =>
  api.get('/agenda/agendamentos/por_data/', { params: { data, profissional } });
export const createAgendamento = (data) => api.post('/agenda/agendamentos/', data);
export const updateAgendamento = (id, data) => api.patch(`/agenda/agendamentos/${id}/`, data);
export const confirmarAgendamento = (id) => api.post(`/agenda/agendamentos/${id}/confirmar/`);
export const cancelarAgendamento = (id, motivo) => api.post(`/agenda/agendamentos/${id}/cancelar/`, { motivo });
export const concluirAgendamento = (id) => api.post(`/agenda/agendamentos/${id}/concluir/`);
export const getDashboard = () => api.get('/agenda/agendamentos/dashboard/');

export const getBloqueios = (params) => api.get('/agenda/bloqueios/', { params });
export const createBloqueio = (data) => api.post('/agenda/bloqueios/', data);
export const deleteBloqueio = (id) => api.delete(`/agenda/bloqueios/${id}/`);

// Clientes
export const getClientes = (params) => api.get('/clientes/', { params });
export const getCliente = (id) => api.get(`/clientes/${id}/`);
export const createCliente = (data) => api.post('/clientes/', data);
export const updateCliente = (id, data) => api.patch(`/clientes/${id}/`, data);
export const getHistoricoCliente = (id) => api.get(`/clientes/${id}/historico/`);

// WhatsApp
export const getConversas = (params) => api.get('/whatsapp/conversas/', { params });
export const getConversa = (id) => api.get(`/whatsapp/conversas/${id}/`);
