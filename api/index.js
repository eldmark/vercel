require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const PDFService = require('../services/pdfService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS DE USERS
// ============================================

// Crear o actualizar usuario
app.post('/api/users', async (req, res) => {
  try {
    const { id, name, email, photo_url, is_guest } = req.body;
    
    // Primero intentar obtener el usuario
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    let result;
    if (existingUser) {
      // Actualizar usuario existente
      const { data, error } = await supabase
        .from('users')
        .update({
          name,
          email,
          photo_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      result = data;
    } else {
      // Crear nuevo usuario
      const { data, error } = await supabase
        .from('users')
        .insert([{ id, name, email, photo_url, is_guest: is_guest || false }])
        .select();
      
      if (error) throw error;
      result = data;
    }
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener usuario por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener usuario por email
app.get('/api/users/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS DE BOOKS
// ============================================

// Crear libro
app.post('/api/books', async (req, res) => {
  try {
    const { user_id, name, description, image_uri } = req.body;
    
    const { data, error } = await supabase
      .from('books')
      .insert([{ user_id, name, description, image_uri }])
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creando libro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener libros de un usuario
app.get('/api/books/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo libros:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener libro por UUID
app.get('/api/books/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('uuid', uuid)
      .eq('is_deleted', false)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Libro no encontrado' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo libro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar libro
app.put('/api/books/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { name, description, image_uri } = req.body;
    
    const { data, error } = await supabase
      .from('books')
      .update({
        name,
        description,
        image_uri,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', uuid)
      .eq('is_deleted', false)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error actualizando libro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar libro (soft delete)
app.delete('/api/books/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const { data, error } = await supabase
      .from('books')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', uuid)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    res.json({ message: 'Libro eliminado correctamente', book: data[0] });
  } catch (error) {
    console.error('Error eliminando libro:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS DE FORMULAS
// ============================================

// Crear fórmula
app.post('/api/formulas', async (req, res) => {
  try {
    const { book_id, user_id, name, formula_text, description, image_uri } = req.body;
    
    const { data, error } = await supabase
      .from('formulas')
      .insert([{ book_id, user_id, name, formula_text, description, image_uri }])
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creando fórmula:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener fórmulas de un libro
app.get('/api/formulas/book/:book_id', async (req, res) => {
  try {
    const { book_id } = req.params;
    const { data, error } = await supabase
      .from('formulas')
      .select('*, books(name)')
      .eq('book_id', book_id)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo fórmulas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener fórmulas de un libro por UUID
app.get('/api/formulas/book-uuid/:book_uuid', async (req, res) => {
  try {
    const { book_uuid } = req.params;
    
    // Primero obtener el ID del libro por su UUID
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('uuid', book_uuid)
      .eq('is_deleted', false)
      .single();
    
    if (bookError || !book) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    const { data, error } = await supabase
      .from('formulas')
      .select('*, books(name)')
      .eq('book_id', book.id)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo fórmulas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener fórmula por UUID
app.get('/api/formulas/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { data, error } = await supabase
      .from('formulas')
      .select('*, books(name, uuid)')
      .eq('uuid', uuid)
      .eq('is_deleted', false)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Fórmula no encontrada' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo fórmula:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las fórmulas de un usuario
app.get('/api/formulas/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { data, error } = await supabase
      .from('formulas')
      .select('*, books(name, uuid)')
      .eq('user_id', user_id)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo fórmulas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar fórmula
app.put('/api/formulas/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { name, formula_text, description, image_uri } = req.body;
    
    const { data, error } = await supabase
      .from('formulas')
      .update({
        name,
        formula_text,
        description,
        image_uri,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', uuid)
      .eq('is_deleted', false)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error actualizando fórmula:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar fórmula (soft delete)
app.delete('/api/formulas/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const { data, error } = await supabase
      .from('formulas')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', uuid)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }
    
    res.json({ message: 'Fórmula eliminada correctamente', formula: data[0] });
  } catch (error) {
    console.error('Error eliminando fórmula:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS DE PDF
// ============================================

// Generar PDF de una fórmula específica
app.get('/api/pdf/formula/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Obtener la fórmula con información del libro
    const { data: formula, error } = await supabase
      .from('formulas')
      .select('*, books(name, uuid)')
      .eq('uuid', uuid)
      .eq('is_deleted', false)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Fórmula no encontrada' });
      }
      throw error;
    }
    
    // Generar PDF
    const pdfBuffer = await PDFService.generateFormulaPDF(formula, formula.books.name);
    
    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="formula-${formula.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF de fórmula:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generar PDF con todas las fórmulas de un libro
app.get('/api/pdf/book/:book_uuid', async (req, res) => {
  try {
    const { book_uuid } = req.params;
    
    // Obtener el libro
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('uuid', book_uuid)
      .eq('is_deleted', false)
      .single();
    
    if (bookError || !book) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    // Obtener todas las fórmulas del libro
    const { data: formulas, error: formulasError } = await supabase
      .from('formulas')
      .select('*')
      .eq('book_id', book.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    
    if (formulasError || !formulas || formulas.length === 0) {
      return res.status(404).json({ error: 'No se encontraron fórmulas en este libro' });
    }
    
    // Generar PDF
    const pdfBuffer = await PDFService.generateBookFormulasPDF(book.name, formulas);
    
    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="libro-${book.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF de libro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generar PDF con fórmulas personalizadas (enviar array de UUIDs)
app.post('/api/pdf/custom', async (req, res) => {
  try {
    const { formula_uuids, title } = req.body;
    
    if (!formula_uuids || !Array.isArray(formula_uuids) || formula_uuids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de formula_uuids' });
    }
    
    // Obtener las fórmulas
    const { data: formulas, error } = await supabase
      .from('formulas')
      .select('*')
      .in('uuid', formula_uuids)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    
    if (error || !formulas || formulas.length === 0) {
      return res.status(404).json({ error: 'No se encontraron fórmulas' });
    }
    
    const pdfTitle = title || 'Colección Personalizada de Fórmulas';
    
    // Generar PDF
    const pdfBuffer = await PDFService.generateBookFormulasPDF(pdfTitle, formulas);
    
    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="formulas-personalizadas.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF personalizado:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS DE SALUD Y ESTADÍSTICAS
// ============================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (error) throw error;
    
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Estadísticas del usuario
app.get('/api/stats/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const booksResult = await pool.query(
      'SELECT COUNT(*) as total FROM books WHERE user_id = $1 AND is_deleted = false',
      [user_id]
    );
    
    const formulasResult = await pool.query(
      'SELECT COUNT(*) as total FROM formulas WHERE user_id = $1 AND is_deleted = false',
      [user_id]
    );
    
    res.json({
      user_id,
      total_books: parseInt(booksResult.rows[0].total),
      total_formulas: parseInt(formulasResult.rows[0].total)
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Fórmulas',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      books: '/api/books',
      formulas: '/api/formulas',
      pdf: '/api/pdf',
      health: '/api/health'
    }
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}

// Exportar para Vercel
module.exports = app;