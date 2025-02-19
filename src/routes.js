import db from './db.js';

export default async function (fastify, options) {
  // rotas para Produtos
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

  // rotas para Clientes
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

    // listar todos os pedidos com o nome do cliente
    fastify.get('/pedidos', async (request, reply) => {
      const [rows] = await db.query(`
        SELECT p.id_pedido, p.data, c.nome AS cliente
        FROM pedidos p
        JOIN clientes c ON p.id_cliente = c.id_cliente
      `);
      return rows;
    });
  
    // buscar um pedido pelo ID com detalhes do cliente
    fastify.get('/pedidos/:id', async (request, reply) => {
      const { id } = request.params;
      
      const [pedido] = await db.query(`
          SELECT p.id_pedido, p.data, c.nome AS cliente
          FROM pedidos p
          JOIN clientes c ON p.id_cliente = c.id_cliente
          WHERE p.id_pedido = ?
      `, [id]);
    
      if (pedido.length === 0) {
          return reply.status(404).send({ message: 'Pedido não encontrado' });
      }
    
      // buscar itens do pedido
      const [itens] = await db.query(`
          SELECT pi.id_pedido_item, pi.qtde, pi.preco, pr.nome AS produto
          FROM pedido_itens pi
          JOIN produtos pr ON pi.id_produto = pr.id_produto
          WHERE pi.id_pedido = ?
      `, [id]);
    
      return { ...pedido[0], itens };
    });
    // criar um pedido
    fastify.post('/pedidos', async (request, reply) => {
      const { id_cliente, itens } = request.body;
  
      const [pedido] = await db.query(
        'INSERT INTO pedidos (id_cliente) VALUES (?)',
        [id_cliente]
      );
  
      if (itens && itens.length) {
        for (const item of itens) {
          await db.query(
            'INSERT INTO pedido_itens (id_pedido, id_produto, qtde, preco) VALUES (?, ?, ?, ?)',
            [pedido.insertId, item.id_produto, item.qtde, item.preco]
          );
        }
      }
  
      return { message: 'Pedido criado com sucesso!', id_pedido: pedido.insertId };
    });
  
    // atualizar um pedido
    fastify.put('/pedidos/:id', async (request, reply) => {
      const { id } = request.params;
      const { id_cliente } = request.body;
  
      const [result] = await db.query('UPDATE pedidos SET id_cliente = ? WHERE id_pedido = ?', [id_cliente, id]);
  
      return result.affectedRows
        ? { message: 'Pedido atualizado', id, id_cliente }
        : { message: 'Pedido não encontrado' };
    });
  
    // excluir um pedido e seus itens
    fastify.delete('/pedidos/:id', async (request, reply) => {
      const { id } = request.params;
  
      await db.query('DELETE FROM pedido_itens WHERE id_pedido = ?', [id]);
      const [result] = await db.query('DELETE FROM pedidos WHERE id_pedido = ?', [id]);
  
      return result.affectedRows
        ? { message: 'Pedido deletado com sucesso' }
        : { message: 'Pedido não encontrado' };
    });
  
   // listar todos os pedidos com o nome do cliente
fastify.get('/pedidos', async (request, reply) => {
  const [rows] = await db.query(`
      SELECT p.id_pedido, p.data, c.nome AS cliente
      FROM pedidos p
      JOIN clientes c ON p.id_cliente = c.id_cliente
  `);
  return rows;
});

// buscar um pedido pelo ID com detalhes do cliente e itens
fastify.get('/pedidos/:id', async (request, reply) => {
  const { id } = request.params;
  
  const [pedido] = await db.query(`
      SELECT p.id_pedido, p.data, c.nome AS cliente
      FROM pedidos p
      JOIN clientes c ON p.id_cliente = c.id_cliente
      WHERE p.id_pedido = ?
  `, [id]);

  if (pedido.length === 0) {
      return reply.status(404).send({ message: 'Pedido não encontrado' });
  }

  // buscar itens do pedido
  const [itens] = await db.query(`
      SELECT pi.id_pedido_item, pi.qtde, pi.preco, pr.nome AS produto
      FROM pedido_itens pi
      JOIN produtos pr ON pi.id_produto = pr.id_produto
      WHERE pi.id_pedido = ?
  `, [id]);

  return { ...pedido[0], itens };
});

// criar um pedido com itens
fastify.post('/pedidos', async (request, reply) => {
  const { id_cliente, itens } = request.body;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return reply.status(400).send({ error: 'Itens do pedido são obrigatórios' });
  }

  try {
      // criar o pedido
      const [pedido] = await db.query(
          'INSERT INTO pedidos (id_cliente) VALUES (?)',
          [id_cliente]
      );
      const id_pedido = pedido.insertId;

      // inserir os itens do pedido
      for (const item of itens) {
          await db.query(
              'INSERT INTO pedido_itens (id_pedido, id_produto, qtde, preco) VALUES (?, ?, ?, ?)',
              [id_pedido, item.id_produto, item.qtde, item.preco]
          );
      }

      return reply.send({ message: 'Pedido criado com sucesso!', id_pedido, itens });
  } catch (error) {
      console.error('Erro ao criar pedido:', error);
      return reply.status(500).send({ error: 'Erro interno ao criar pedido' });
  }
});
// atualizar um pedido
fastify.put('/pedidos/:id', async (request, reply) => {
  const { id } = request.params;
  const { id_cliente } = request.body;

  const [result] = await db.query('UPDATE pedidos SET id_cliente = ? WHERE id_pedido = ?', [id_cliente, id]);

  return result.affectedRows
      ? { message: 'Pedido atualizado', id, id_cliente }
      : { message: 'Pedido não encontrado' };
});

// excluir um pedido e seus itens
fastify.delete('/pedidos/:id', async (request, reply) => {
  const { id } = request.params;

  await db.query('DELETE FROM pedido_itens WHERE id_pedido = ?', [id]);
  const [result] = await db.query('DELETE FROM pedidos WHERE id_pedido = ?', [id]);

  return result.affectedRows
      ? { message: 'Pedido deletado com sucesso' }
      : { message: 'Pedido não encontrado' };
});

// listar os itens de um pedido com detalhes do produto
fastify.get('/pedidos/:id_pedido/itens', async (request, reply) => {
  const { id_pedido } = request.params;

  const [rows] = await db.query(`
      SELECT pi.id_pedido_item, pi.qtde, pi.preco, pr.nome AS produto
      FROM pedido_itens pi
      JOIN produtos pr ON pi.id_produto = pr.id_produto
      WHERE pi.id_pedido = ?
  `, [id_pedido]);

  return rows;
});

// aicionar item ao pedido
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