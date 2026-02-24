const API_BASE = 'https://expenses-uk/backend';

// Вспомогательная функция для обработки ответа
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }
  return response.json();
}

// GET запрос
export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  return handleResponse(response);
}

// POST запрос
export async function apiPost(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(response);
}

// PUT запрос
export async function apiPut(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(response);
}

// DELETE запрос
export async function apiDelete(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE'
  });
  return handleResponse(response);
}
