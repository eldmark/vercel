// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middleware
app.use(express.json());

// Inicializar cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);
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
    
    res.status(500).json({ error: 'Not implemented' });
  } catch (error) {
    console.error('Error generando PDF del libro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para generar PDF de una fórmula
app.get('/api/formulas/:uuid/pdf', async (req, res) => {
  try {
    const { uuid } = req.params;

    // Consultar la fórmula con información relacionada
    const { data: formula, error } = await supabase
      .from('formulas')
      .select(`
        *,
        books (
          name,
          description
        ),
        users (
          name,
          email
        )
      `)
      .eq('uuid', uuid)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error('Error al consultar Supabase:', error);
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    if (!formula) {
      return res.status(404).json({ error: 'Fórmula no encontrada' });
    }

    // Crear documento PDF
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=formula-${uuid}.pdf`
    );

    // Pipe del PDF a la respuesta
    doc.pipe(res);

    // Título del documento
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Formulario de Fórmula', { align: 'center' })
       .moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y)
       .lineTo(562, doc.y)
       .stroke()
       .moveDown();

    // Información de la fórmula
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('Información de la Fórmula', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12).font('Helvetica');

    // Nombre
    doc.font('Helvetica-Bold').text('Nombre: ', { continued: true })
       .font('Helvetica').text(formula.name)
       .moveDown(0.3);

    // UUID
    doc.font('Helvetica-Bold').text('ID Único: ', { continued: true })
       .font('Helvetica').text(formula.uuid)
       .moveDown(0.3);

    // Fórmula
    doc.font('Helvetica-Bold').text('Fórmula: ', { continued: true })
       .font('Courier').text(formula.formula_text)
       .moveDown(0.3);

    // Descripción
    if (formula.description) {
      doc.font('Helvetica-Bold').text('Descripción: ')
         .font('Helvetica').text(formula.description, {
           width: 500,
           align: 'justify'
         })
         .moveDown(0.3);
    }

    doc.moveDown();

    // Información del libro
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Libro', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12);

    doc.font('Helvetica-Bold').text('Nombre del libro: ', { continued: true })
       .font('Helvetica').text(formula.books.name)
       .moveDown(0.3);

    if (formula.books.description) {
      doc.font('Helvetica-Bold').text('Descripción: ')
         .font('Helvetica').text(formula.books.description, {
           width: 500,
           align: 'justify'
         })
         .moveDown(0.3);
    }

    doc.moveDown();

    // Información del usuario
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Usuario', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12);

    doc.font('Helvetica-Bold').text('Nombre: ', { continued: true })
       .font('Helvetica').text(formula.users.name)
       .moveDown(0.3);

    doc.font('Helvetica-Bold').text('Email: ', { continued: true })
       .font('Helvetica').text(formula.users.email)
       .moveDown();

    // Fechas
    doc.moveDown();
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Fechas', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12);

    const createdDate = new Date(parseInt(formula.created_at));
    const updatedDate = new Date(parseInt(formula.updated_at));

    doc.font('Helvetica-Bold').text('Creado: ', { continued: true })
       .font('Helvetica').text(createdDate.toLocaleString('es-ES'))
       .moveDown(0.3);

    doc.font('Helvetica-Bold').text('Actualizado: ', { continued: true })
       .font('Helvetica').text(updatedDate.toLocaleString('es-ES'));

    // Footer
    doc.fontSize(10)
       .font('Helvetica')
       .text(
         `Generado el ${new Date().toLocaleString('es-ES')}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );

    // Finalizar el documento
    doc.end();

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Listar todas las fórmulas (útil para pruebas)
app.get('/api/formulas', async (req, res) => {
  try {
    const { data: formulas, error } = await supabase
      .from('formulas')
      .select('uuid, name, description, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error al consultar Supabase:', error);
      return res.status(500).json({ error: 'Error al obtener fórmulas' });
    }

    res.json({ formulas });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener fórmulas' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📄 Endpoint PDF: http://localhost:${PORT}/api/formulas/:uuid/pdf`);
});