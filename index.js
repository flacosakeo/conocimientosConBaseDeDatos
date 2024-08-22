const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configura la conexión con la base de datos
/*const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Cambia esto con tu usuario
  password: '', // Cambia esto con tu contraseña
  database: 'progresos' // Cambia esto con el nombre de tu base de datos
});*/
const connection = mysql.createConnection({
    host : process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
// Conecta a la base de datos y crea las tablas si no existen
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Conectado a base de datos.');

  // Crear la tabla "usuarios" si no existe
  const createConocimientosTable = `
    CREATE TABLE IF NOT EXISTS conocimientos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(13) NOT NULL)`;
  connection.query(createConocimientosTable, (err) => {
    if (err) {
      console.error('Error creating usuarios table:', err);
      return;
    }
    console.log('Tabla "conocimientos" creada o ya existe.');
  });

  // Crear la tabla "conocimientos" si no existe
  const createPorcentajesTable = `
    CREATE TABLE IF NOT EXISTS porcentajes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conocimiento_id INT,
      porcentaje INT(3) NOT NULL,
      FOREIGN KEY (conocimiento_id) REFERENCES conocimientos(id) ON DELETE CASCADE
    )
  `;
  connection.query(createPorcentajesTable, (err) => {
    if (err) {
      console.error('Error creating conocimientos table:', err);
      return;
    }
    console.log('Tabla "porcentajes" creada o ya existe.');
  });
});

// Middleware para manejar datos del formulario
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configura Express para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

// Ruta para manejar la solicitud POST del formulario
app.post('/submit-form', (req, res) => {
  const { nombre, porcentaje } = req.body;
  // Consulta para verificar si el conocimiento ya existe
  const checkConocimientoQuery = `SELECT id FROM conocimientos WHERE nombre = ?`;
  connection.query(checkConocimientoQuery, [nombre], (err, results) => {
    if (err) {
      console.error('Error checking knowledge:', err);
      res.status(500).send('Error checking knowledge in the database');
      return;
    }

    if (results.length > 0) {
      // Si el conocimiento ya existe, enviar un mensaje de error
      res.status(400).send('El conocimiento ya existe');
    } else {
      // Inserta los datos en la tabla usuarios y luego en conocimientos
      const insertUsuarioQuery = `INSERT INTO conocimientos (nombre) VALUES (?)`;
      connection.query(insertUsuarioQuery, [nombre], (err, result) => {
        if (err) {
          console.error('Error inserting user:', err);
          res.status(500).send('Error inserting user into the database');
          return;
        }

        const conocimientoId = result.insertId; // Obtén el ID del usuario recién insertado

        // Inserta el conocimiento relacionado con el usuario
        const insertConocimientoQuery = `INSERT INTO porcentajes (conocimiento_id, porcentaje) VALUES (?, ?)`;
        connection.query(insertConocimientoQuery, [conocimientoId, porcentaje], (err) => {
          if (err) {
            console.error('Error inserting knowledge:', err);
            res.status(500).send('Error inserting knowledge into the database');
            return;
          }
          
          //res.send('Conocimiento y porcentaje guardados correctamente');
          res.json({ id: conocimientoId, nombre, porcentaje });
        });
      });
    }
  });
});

// Ruta para obtener y mostrar los datos de conocimientos y porcentajes
app.get('/mostrar-datos', (req, res) => {
  const query = `
    SELECT c.id, c.nombre, p.porcentaje 
    FROM conocimientos c 
    JOIN porcentajes p 
    ON c.id = p.conocimiento_id
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving data:', err);
      res.status(500).send('Error retrieving data from the database');
      return;
    }

    // Guardar los resultados en un array
    const dataArray = results.map(row => {
      return {
        id : row.id,
        conocimiento: row.nombre,
        porcentaje: row.porcentaje
      };
    });

      res.json(dataArray);
  });
    
});



/*************************************************************************************** */
// Ruta para eliminar un conocimiento por su nombre o ID
app.delete('/eliminar-conocimiento', (req, res) => {
  const { id } = req.body;

  if (!id) {
      return res.status(400).send('El ID del conocimiento es requerido');
  }

  // Consulta SQL para eliminar el conocimiento y el porcentaje asociado
  const deleteQuery = `
      DELETE c, p 
      FROM conocimientos c 
      JOIN porcentajes p 
      ON c.id = p.conocimiento_id 
      WHERE c.id = ?
  `;

  connection.query(deleteQuery, [id], (err, results) => {
      if (err) {
          console.error('Error deleting knowledge:', err);
          return res.status(500).send('Error al eliminar el conocimiento de la base de datos');
      }

      if (results.affectedRows === 0) {
          return res.status(404).send('Conocimiento no encontrado');
      }

      res.send('Conocimiento eliminado exitosamente');
  });
});

/*************************************************************************************** */
app.put('/modificar-conocimiento', (req, res) => {
  const { id, nombre, porcentaje } = req.body;

  if (!id) {
      return res.status(400).send('El ID del conocimiento es requerido');
  }

  // Consulta SQL para actualizar el conocimiento y su porcentaje
  const updateQuery = `
      UPDATE conocimientos c
      JOIN porcentajes p ON c.id = p.conocimiento_id
      SET c.nombre = ?, p.porcentaje = ?
      WHERE c.id = ?
  `;

  connection.query(updateQuery, [nombre, porcentaje, id], (err, results) => {
      if (err) {
          console.error('Error updating knowledge:', err);
          return res.status(500).send('Error al modificar el conocimiento en la base de datos');
      }

      if (results.affectedRows === 0) {
          return res.status(404).send('Conocimiento no encontrado');
      }

      res.send('Conocimiento modificado exitosamente');
  });
});

/*************************************************************************************** */
// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
