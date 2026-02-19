import {
  getProductos, getClientes, crearPedido, getPedidos,
  crearCliente, actualizarCliente, borrarCliente,
  crearProducto, actualizarProducto, borrarProducto,
  actualizarPedido, reemplazarPedido, borrarPedido
} from './api.js';

import {
  renderProductos, renderPaginacion, renderCarrito, renderClientes,
  setMsg, renderPedidos, renderClientesAdmin, renderProductosAdmin,
  renderPedidosAdmin, buildPedidoEditUI
} from './ui.js';

const $ = s => document.querySelector(s);

/* ----- Elementos ----- */
const tbodyProd = $('#tabla-productos tbody');
const pag = $('#paginacion');
const tbodyCart = $('#tabla-carrito tbody');
const totalEl = $('#total');
const selectCliente = $('#cliente');
const msg = $('#msg');
const listaPedidos = $('#lista-pedidos');
const inputSearch = $('#search');
const btnSearch = $('#btn-search');
const btnConfirmar = $('#btn-confirmar');

const tClientes = $('#tabla-clientes tbody');
const fCli = $('#cliente-form');
const inCliId = $('#cliente-id');
const inCliNom = $('#cliente-nombre');
const inCliMail = $('#cliente-email');
const btnCliCancel = $('#cliente-cancelar');
const msgClientes = $('#msg-clientes');

const tProdAdmin = $('#tabla-admin-productos tbody');
const fProd = $('#producto-form');
const inProdId = $('#producto-id');
const inProdNom = $('#producto-nombre');
const inProdPrecio = $('#producto-precio');
const inProdStock = $('#producto-stock');
const inProdEstado = $('#producto-estado');
const btnProdCancel = $('#producto-cancelar');
const msgProductos = $('#msg-productos');

const tPedidosAdmin = $('#tabla-admin-pedidos tbody');
const msgPedidos = $('#msg-pedidos');

/* Modal Bootstrap */
const modalEl = $('#modalPedido');
let pedidoModal; // instancia Bootstrap
let modalState = null; // estado temporal del pedido en edición

/* ----- Estado ----- */
let state = {
  page: 1,
  pageSize: 10,
  q: '',
  productos: [],
  totalProductos: 0,
  clientes: [],
  pedidos: [],
  carrito: []
};

/* ----- Carrito ----- */
function upsertCarrito(prod, delta = 1) {
  const i = state.carrito.findIndex(x => x.productoId === prod.id || x.productoId === prod);
  const prodObj = state.productos.find(p => p.id === (prod.id ?? prod)) || { id: prod, nombre: 'Prod', precio: 0, stock: 9999 };
  if (i === -1 && delta > 0) {
    state.carrito.push({ productoId: prodObj.id, nombre: prodObj.nombre, precio: Number(prodObj.precio), cantidad: 1, subtotal: Number(prodObj.precio) });
  } else if (i >= 0) {
    const item = state.carrito[i];
    const nueva = item.cantidad + delta;
    if (nueva <= 0) state.carrito.splice(i, 1);
    else {
      const stock = prodObj.stock ?? 9999;
      item.cantidad = Math.min(nueva, stock);
      item.subtotal = +(item.precio * item.cantidad).toFixed(2);
    }
  }
  renderCarrito(tbodyCart, totalEl, state.carrito,
    id => upsertCarrito(id, +1),
    id => upsertCarrito(id, -1),
    id => { const j = state.carrito.findIndex(x => x.productoId === id); if (j >= 0) state.carrito.splice(j, 1); renderCarrito(tbodyCart, totalEl, state.carrito, id=>upsertCarrito(id,+1), id=>upsertCarrito(id,-1), id=>{}); }
  );
}

/* ----- Cargas ----- */
async function cargarProductos() {
  const { data, pagination } = await getProductos({ q: state.q, page: state.page, pageSize: state.pageSize });
  state.productos = data; state.totalProductos = pagination.total;
  renderProductos(tbodyProd, data, (p) => upsertCarrito(p, +1));
  renderPaginacion(pag, pagination.page, pagination.pageSize, pagination.total, async (newPage) => { state.page = newPage; await cargarProductos(); });
  renderProductosAdmin(tProdAdmin, data, onProdEdit, onProdDelete);
}
async function cargarClientes() {
  state.clientes = await getClientes();
  renderClientes(selectCliente, state.clientes);
  renderClientesAdmin(tClientes, state.clientes, onCliEdit, onCliDelete);
}
async function cargarPedidos() {
  state.pedidos = await getPedidos({ includeItems: true });
  renderPedidos(listaPedidos, state.pedidos);
  renderPedidosAdmin(tPedidosAdmin, state.pedidos, onPedidoEstado, onPedidoDelete, onPedidoEditarDetalle);
}

/* ----- Home ----- */
btnSearch.addEventListener('click', async () => {
  state.q = inputSearch.value.trim(); state.page = 1; await cargarProductos();
});
//Llama a crearPedido con el cliente seleccionado y los ítems del carrito.
btnConfirmar.addEventListener('click', async () => {
  try {
    setMsg(msg, '');
    const clienteId = Number(selectCliente.value);
    if (!clienteId) return setMsg(msg, 'Seleccioná un cliente', false);
    if (state.carrito.length === 0) return setMsg(msg, 'Agregá productos al carrito', false);
    const items = state.carrito.map(x => ({ productoId: x.productoId, cantidad: x.cantidad }));
    const creado = await crearPedido({ clienteId, items });
    setMsg(msg, `Pedido #${creado.id} creado por $${Number(creado.total).toFixed(2)}`, true);
    state.carrito = []; renderCarrito(tbodyCart, totalEl, state.carrito, ()=>{}, ()=>{}, ()=>{});
    await cargarProductos(); await cargarPedidos();
  } catch (e) { setMsg(msg, e.message, false); }
});

/* ====== Admin: Clientes ====== */
function limpiarFormCliente(){ inCliId.value=''; inCliNom.value=''; inCliMail.value=''; setMsg(msgClientes,''); }
function onCliEdit(id){ const c=state.clientes.find(x=>x.id===id); if(!c)return; inCliId.value=c.id; inCliNom.value=c.nombre; inCliMail.value=c.email; }
async function onCliDelete(id){ if(!confirm('¿Eliminar cliente?'))return; try{ await borrarCliente(id); setMsg(msgClientes,'Cliente eliminado',true); await cargarClientes(); }catch(e){ setMsg(msgClientes,e.message,false); } }
fCli.addEventListener('submit', async (e)=>{ e.preventDefault(); try{
  const payload={ nombre: inCliNom.value.trim(), email: inCliMail.value.trim() };
  if(!payload.nombre||!payload.email) return setMsg(msgClientes,'Completá nombre y email',false);
  if(inCliId.value){ await actualizarCliente(Number(inCliId.value),payload); setMsg(msgClientes,'Cliente actualizado',true); }
  else { await crearCliente(payload); setMsg(msgClientes,'Cliente creado',true); }
  limpiarFormCliente(); await cargarClientes();
}catch(err){ setMsg(msgClientes,err.message,false); }});
btnCliCancel.addEventListener('click', limpiarFormCliente);

/* ====== Admin: Productos ====== */
function limpiarFormProducto(){ inProdId.value=''; inProdNom.value=''; inProdPrecio.value=''; inProdStock.value=''; inProdEstado.value='DISPONIBLE'; setMsg(msgProductos,''); }
function onProdEdit(id){ const p=state.productos.find(x=>x.id===id); if(!p)return; inProdId.value=p.id; inProdNom.value=p.nombre; inProdPrecio.value=Number(p.precio); inProdStock.value=p.stock; inProdEstado.value=p.estado??'DISPONIBLE'; }
async function onProdDelete(id){ if(!confirm('¿Eliminar producto?'))return; try{ await borrarProducto(id); setMsg(msgProductos,'Producto eliminado',true); await cargarProductos(); }catch(e){ setMsg(msgProductos,e.message,false); } }
fProd.addEventListener('submit', async (e)=>{ e.preventDefault(); try{
  const payload={ nombre: inProdNom.value.trim(), precio:Number(inProdPrecio.value), stock:Number(inProdStock.value), estado: inProdEstado.value };
  if(!payload.nombre||isNaN(payload.precio)||isNaN(payload.stock)) return setMsg(msgProductos,'Completá nombre, precio y stock válidos',false);
  if(inProdId.value){ await actualizarProducto(Number(inProdId.value),payload); setMsg(msgProductos,'Producto actualizado',true); }
  else { await crearProducto(payload); setMsg(msgProductos,'Producto creado',true); }
  limpiarFormProducto(); await cargarProductos();
}catch(err){ setMsg(msgProductos,err.message,false); }});
btnProdCancel.addEventListener('click', limpiarFormProducto);

/* ====== Admin: Pedidos ====== */
async function onPedidoEstado(id, estado){ try{ await actualizarPedido(id,{estado}); setMsg(msgPedidos,`Pedido #${id} actualizado a ${estado}`,true); await cargarPedidos(); }catch(e){ setMsg(msgPedidos,e.message,false); } }
async function onPedidoDelete(id){ if(!confirm('¿Eliminar pedido?'))return; try{ await borrarPedido(id); setMsg(msgPedidos,'Pedido eliminado',true); await cargarPedidos(); }catch(e){ setMsg(msgPedidos,e.message,false); } }

// Abrir modal y preparar estado temporal
function onPedidoEditarDetalle(id){
  const pedido = state.pedidos.find(p=>p.id===id); if(!pedido) return;
  // clonar estado de edición
  modalState = {
    id: pedido.id,
    clienteId: pedido.clienteId,
    items: (pedido.items||[]).map(i=>({ productoId: i.productoId, nombre: i.producto?.nombre, precio: Number(i.precioUnitario), cantidad: i.cantidad }))
  };

  const calcTotal = ()=> modalState.items.reduce((a,i)=>a + i.precio*i.cantidad,0);

  const ui = buildPedidoEditUI({
    modal: modalEl,
    clientes: state.clientes,
    productos: state.productos,
    pedido: { ...pedido, clienteId: modalState.clienteId, items: modalState.items.map(i=>({ productoId:i.productoId, cantidad:i.cantidad, precioUnitario:i.precio, subtotal:+(i.precio*i.cantidad).toFixed(2), producto:{ nombre:i.nombre } })) },
    onAddItem: null, // lo seteo debajo
    onChangeQty: (pid, qty) => {
      const it = modalState.items.find(x=>x.productoId===pid); if(!it) return;
      it.cantidad = Math.max(1, Number(qty)||1);
      onPedidoRepaintTable();
    },
    onRemoveItem: (pid) => {
      const i = modalState.items.findIndex(x=>x.productoId===pid);
      if(i>=0) modalState.items.splice(i,1);
      onPedidoRepaintTable();
    },
    calcTotal
  });

  // Agregar item
  modalEl.querySelector('#pedido-edit-add').onclick = () => {
    const pid = ui.getProductoAAgregar();
    const qty = Math.max(1, ui.getCantidadAAgregar() || 1);
    const p = state.productos.find(x=>x.id===pid);
    if(!p) return;
    const ex = modalState.items.find(x=>x.productoId===pid);
    if(ex) ex.cantidad += qty;
    else modalState.items.push({ productoId: pid, nombre: p.nombre, precio: Number(p.precio), cantidad: qty });
    onPedidoRepaintTable();
  };

  // Guardar
  modalEl.querySelector('#pedido-edit-guardar').onclick = async () => {
    try {
      const clienteId = Number(modalEl.querySelector('#pedido-edit-cliente').value);
      const items = modalState.items.map(i=>({ productoId: i.productoId, cantidad: i.cantidad }));
      if (items.length === 0) return setMsg(modalEl.querySelector('#pedido-edit-msg'),'Debe haber al menos un ítem', false);
      const payload = { items, clienteId };
      await reemplazarPedido(modalState.id, payload);
      bootstrap.Modal.getInstance(modalEl).hide();
      setMsg(msgPedidos,'Pedido actualizado', true);
      await cargarProductos(); // stock puede cambiar
      await cargarPedidos();
    } catch (e) {
      setMsg(modalEl.querySelector('#pedido-edit-msg'), e.message, false);
    }
  };

  function onPedidoRepaintTable(){
    const tbody = modalEl.querySelector('#pedido-edit-tabla tbody');
    tbody.innerHTML='';
    for(const it of modalState.items){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.nombre}</td>
        <td><input type="number" class="form-control form-control-sm" data-id="${it.productoId}" value="${it.cantidad}" min="1"></td>
        <td class="text-end">$${it.precio.toFixed(2)}</td>
        <td class="text-end">$${(it.precio*it.cantidad).toFixed(2)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-id="${it.productoId}">x</button></td>
      `;
      tr.querySelector('input').addEventListener('change',(e)=>{ const id=Number(e.target.dataset.id); const q=Math.max(1,Number(e.target.value)||1); const itf=modalState.items.find(x=>x.productoId===id); if(itf){ itf.cantidad=q; onPedidoRepaintTable(); }});
      tr.querySelector('button').addEventListener('click',()=>{ const i=modalState.items.findIndex(x=>x.productoId===it.productoId); if(i>=0){ modalState.items.splice(i,1); onPedidoRepaintTable(); }});
      tbody.appendChild(tr);
    }
    modalEl.querySelector('#pedido-edit-total').textContent = modalState.items.reduce((a,i)=>a+i.precio*i.cantidad,0).toFixed(2);
  }

  // Mostrar modal
  if (!pedidoModal) pedidoModal = new bootstrap.Modal(modalEl);
  pedidoModal.show();
}

/* ----- Init ----- */
(async function init(){ try{
  await Promise.all([cargarProductos(), cargarClientes(), cargarPedidos()]);
}catch(e){ setMsg(msg,e.message,false); }})();
