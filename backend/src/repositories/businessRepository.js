async function insert(client, name) {
  const result = await client.query(
    `INSERT INTO businesses (name)
     VALUES ($1)
     RETURNING id`,
    [name],
  );
  return result.rows[0].id;
}

module.exports = { insert };
