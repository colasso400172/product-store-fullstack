//capa de comunicación con tu API REST en Express (backend). Define funciones que se encargan de hacer peticiones HTTP a los endpoints de productos, clientes y pedidos.

const BASE_URL = 'http://localhost:3000/api';


//apiFetch es una función reutilizable para llamar a cualquier endpoint.
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    let msg = 'Error de red';
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
} //Esta función sirve para "extraer" una lista desde una respuesta.
function unwrapList(resp) { if (Array.isArray(resp)) return resp; if (resp?.data) return resp.data; return []; }

/* Productos */
export async function getProductos({ q = '', page = 1, pageSize = 10 } = {}) {
  const qs = new URLSearchParams(); if (q) qs.set('q', q); qs.set('page', page); qs.set('pageSize', pageSize);
  return apiFetch(`/productos?${qs.toString()}`);
}
export const crearProducto = (payload)=>apiFetch('/productos',{method:'POST',body:JSON.stringify(payload)});
export const actualizarProducto = (id,payload)=>apiFetch(`/productos/${id}`,{method:'PUT',body:JSON.stringify(payload)});
export const borrarProducto = (id)=>fetch(`${BASE_URL}/productos/${id}`,{method:'DELETE'}).then(async r=>{if(!r.ok)throw new Error((await r.json()).error||'Error');});

/* Clientes */
//Usa unwrapList por si el backend responde con { data: [...] }.
export async function getClientes(){ return unwrapList(await apiFetch('/clientes')); }
export const crearCliente = (p)=>apiFetch('/clientes',{method:'POST',body:JSON.stringify(p)});
export const actualizarCliente = (id,p)=>apiFetch(`/clientes/${id}`,{method:'PUT',body:JSON.stringify(p)});
export const borrarCliente = (id)=>fetch(`${BASE_URL}/clientes/${id}`,{method:'DELETE'}).then(async r=>{if(!r.ok)throw new Error((await r.json()).error||'Error');});

/* Pedidos */
export const crearPedido = (p)=>apiFetch('/pedidos',{method:'POST',body:JSON.stringify(p)});
export async function getPedidos({ includeItems = true } = {}) {
  const qs = includeItems ? '?include=items' : '';
  return unwrapList(await apiFetch(`/pedidos${qs}`));
}
// PATCH: estado/cliente
export const actualizarPedido = (id,p)=>apiFetch(`/pedidos/${id}`,{method:'PATCH',body:JSON.stringify(p)});
// PUT: reemplaza detalle (ítems) y opcionalmente cliente
export const reemplazarPedido = (id,p)=>apiFetch(`/pedidos/${id}`,{method:'PUT',body:JSON.stringify(p)});
export const borrarPedido = (id)=>fetch(`${BASE_URL}/pedidos/${id}`,{method:'DELETE'}).then(async r=>{if(!r.ok)throw new Error((await r.json()).error||'Error');});


//Proporciona funciones que encapsulan las llamadas a tu API.
//Centraliza el manejo de errores y headers.
//Permite que el frontend consuma la API de forma limpia y consistente.