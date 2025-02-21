import db from './db.js';

export default async function (fastify, options) {
  // rotas produto
  fastify.get('/produtos', async (request, reply) => {
    const [rows] = await db.query('SELECT * FROM produtos');
    return rows;
  });

  fastify.get('/produtos/:id', async (request, reply) => {
    const { id } = request.params;
    const [rows] = await db.query('SELECT * FROM produtos WHERE id_produto = ?', [id]);
    return rows[0] || { message: 'Produto não encontrado' };
  });

  fastify.post('/produtos', async (request, reply) => {
    const { nome, preco } = request.body;
    const [result] = await db.query(
      'INSERT INTO produtos (nome, preco) VALUES (?, ?)',
      [nome, preco]
    );
    return { id: result.insertId, nome, preco };
  });

  fastify.put('/produtos/:id', async (request, reply) => {
    const { id } = request.params;
    const { nome, preco } = request.body;
    await db.query('UPDATE produtos SET nome = ?, preco = ? WHERE id_produto = ?', [
      nome,
      preco,
      id,
    ]);
    return { id, nome, preco };
  });

  fastify.delete('/produtos/:id', async (request, reply) => {
    const { id } = request.params;
    await db.query('DELETE FROM produtos WHERE id_produto = ?', [id]);
    return { message: 'Produto deletado' };
  });

  // rota clientes
  fastify.get('/clientes', async (request, reply) => {
    const [rows] = await db.query('SELECT * FROM clientes');
    return rows;
  });

  fastify.get('/clientes/:id', async (request, reply) => {
    const { id } = request.params;
    const [rows] = await db.query('SELECT * FROM clientes WHERE id_cliente = ?', [id]);
    return rows[0] || { message: 'Cliente não encontrado' };
  });

  fastify.post('/clientes', async (request, reply) => {
    const { nome, email } = request.body;
    const [result] = await db.query(
      'INSERT INTO clientes (nome, email) VALUES (?, ?)',
      [nome, email]
    );
    return { id: result.insertId, nome, email };
  });

  fastify.put('/clientes/:id', async (request, reply) => {
    const { id } = request.params;
    const { nome, email } = request.body;
    await db.query('UPDATE clientes SET nome = ?, email = ? WHERE id_cliente = ?', [
      nome,
      email,
      id,
    ]);
    return { id, nome, email };
  });

  fastify.delete('/clientes/:id', async (request, reply) => {
    const { id } = request.params;
    await db.query('DELETE FROM clientes WHERE id_cliente = ?', [id]);
    return { message: 'Cliente deletado' };
  });

    // listar pedidos com o nome cliente
    fastify.get('/pedidos', async (request, reply) => {
      const [rows] = await db.query(`
        SELECT p.id_pedido, p.data, p.id_cliente, c.nome AS cliente_nome
        FROM pedidos p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      `);
     
      return rows;
    });

  // buscar pedido ID com cliente
  fastify.get('/pedidos/:id', async (request, reply) => {
    const { id } = request.params;
    const [rows] = await db.query(`
      SELECT p.id_pedido, p.data, c.nome AS cliente
      FROM pedidos p
      JOIN clientes c ON p.id_cliente = c.id_cliente
      WHERE p.id_pedido = ?
    `, [id]);

    return rows.length ? rows[0] : { message: 'Pedido não encontrado' };
  });

  // criar pedido
  fastify.post('/pedidos', async (request, reply) => {
    const { id_cliente, itens } = request.body;
  
    if (!id_cliente || !Array.isArray(itens) || itens.length === 0) {
      return reply.status(400).send({ error: "Dados inválidos." });
    }
  
    console.log("📥 Dados recebidos no backend:", JSON.stringify(request.body, null, 2));
  
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
  
      // insere pedido
      const [pedidoResult] = await conn.query(
        'INSERT INTO pedidos (id_cliente, data) VALUES (?, NOW())',
        [id_cliente]
      );
  
      const id_pedido = pedidoResult.insertId;
  
      // insere os itens do pedido
      for (const item of itens) {
        const qtde = Number(item.qtde) > 0 ? Number(item.qtde) : 1; 

  
        await conn.query(
          'INSERT INTO pedido_itens (id_pedido, id_produto, qtde, preco) VALUES (?, ?, ?, ?)',
          [id_pedido, item.id_produto, qtde, item.preco]
        );
      }
  
      await conn.commit();
      return reply.send({ id_pedido });
    } catch (error) {
      await conn.rollback();
      console.error("❌ Erro ao inserir pedido:", error);
      return reply.status(500).send({ error: "Erro ao inserir pedido." });
    } finally {
      conn.release();
    }
  });
  // atualiza pedido
  fastify.put('/pedidos/:id', async (request, reply) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
  
    const id_pedido = request.params.id;
    const { id_cliente, data, itens } = request.body;
  
    try {  
      // atualiza dados do pedido
      await connection.query(`
        UPDATE pedidos SET id_cliente = ?, data = ? WHERE id_pedido = ?
      `, [id_cliente, data, id_pedido]);

  
      // remove itens antigos do pedido
      await connection.query(`
        DELETE FROM pedido_itens WHERE id_pedido = ?
      `, [id_pedido]);

  
      // insere novos itens do pedido
      for (const item of itens) {

        await connection.query(`
          INSERT INTO pedido_itens (id_pedido, id_produto, qtde, preco) 
          VALUES (?, ?, ?, ?)
        `, [id_pedido, item.id_produto, item.qtde, item.preco]);
      }
  
  
      await connection.commit();
      return reply.status(200).send({ message: "Pedido atualizado com sucesso!" });
  
    } catch (error) {
      await connection.rollback();
      console.error("🚨 Erro ao atualizar pedido:", error);
      return reply.status(500).send({ error: error.message });
    } finally {
      connection.release();
    }
  });
  

  // excluir um pedido e itens
  fastify.delete('/pedidos/:id', async (request, reply) => {
    const { id } = request.params;

    await db.query('DELETE FROM pedido_itens WHERE id_pedido = ?', [id]);
    const [result] = await db.query('DELETE FROM pedidos WHERE id_pedido = ?', [id]);

    return result.affectedRows
      ? { message: 'Pedido deletado com sucesso' }
      : { message: 'Pedido não encontrado' };
  });

  // listar itens de pedido com detalhes do produto
  fastify.get('/pedidos/:id_pedido/itens', async (request, reply) => {
    const { id_pedido } = request.params;
  
    const [rows] = await db.query(`
      SELECT pi.id_pedido_item, pi.id_produto, pi.qtde, pi.preco, 
             pr.id_produto, pr.nome AS produto
      FROM pedido_itens pi
      JOIN produtos pr ON pi.id_produto = pr.id_produto
      WHERE pi.id_pedido = ?
    `, [id_pedido]);
  
    return rows;
  });

  // adicionar item ao pedido
  fastify.post('/pedidos/:id_pedido/itens', async (request, reply) => {
    const { id_pedido } = request.params;
    const { id_produto, qtde, preco } = request.body;

    const [result] = await db.query(
      'INSERT INTO pedido_itens (id_pedido, id_produto, qtde, preco) VALUES (?, ?, ?, ?)',
      [id_pedido, id_produto, qtde, preco]
    );

    return { id_pedido_item: result.insertId, id_pedido, id_produto, qtde, preco };
  });

  // atualizar item do pedido
  fastify.put('/pedidos/:id_pedido/itens/:id_item', async (request, reply) => {
    const { id_pedido, id_item } = request.params;
    const { id_produto, qtde, preco } = request.body;

    const [result] = await db.query(
      'UPDATE pedido_itens SET id_produto = ?, qtde = ?, preco = ? WHERE id_pedido_item = ? AND id_pedido = ?',
      [id_produto, qtde, preco, id_item, id_pedido]
    );

    return result.affectedRows
      ? { message: 'Item atualizado', id_item, id_pedido, id_produto, qtde, preco }
      : { message: 'Item não encontrado' };
  });

  // remover item do pedido
  fastify.delete('/pedidos/:id_pedido/itens/:id_item', async (request, reply) => {
    const { id_pedido, id_item } = request.params;

    const [result] = await db.query(
      'DELETE FROM pedido_itens WHERE id_pedido_item = ? AND id_pedido = ?',
      [id_item, id_pedido]
    );

    return result.affectedRows
      ? { message: 'Item de pedido removido' }
      : { message: 'Item não encontrado' };
  });

}