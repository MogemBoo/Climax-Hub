export async function getOrCreateGenre(client, genreName) {
  const insertGenre = await client.query(
    `INSERT INTO genre(name)
     VALUES($1)
     ON CONFLICT (name) DO NOTHING
     RETURNING genre_id`,
    [genreName]
  );

  if (insertGenre.rowCount > 0) return insertGenre.rows[0].genre_id;

  const existingGenre = await client.query(
    `SELECT genre_id FROM genre WHERE name=$1`,
    [genreName]
  );
  return existingGenre.rows[0].genre_id;
}
