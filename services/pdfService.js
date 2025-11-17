const PDFDocument = require('pdfkit');

class PDFService {
  /**
   * Genera un PDF para una fórmula individual
   */
  static generateFormulaPDF(formula, bookName) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header con logo/título
        doc.fontSize(24)
           .fillColor('#2c3e50')
           .text('📚 Fórmula', { align: 'center' });
        
        doc.moveDown(0.5);
        
        // Línea divisoria
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#3498db')
           .lineWidth(2)
           .stroke();
        
        doc.moveDown(1);

        // Información del libro
        if (bookName) {
          doc.fontSize(12)
             .fillColor('#7f8c8d')
             .text(`Libro: ${bookName}`, { align: 'left' });
          doc.moveDown(0.5);
        }

        // Título de la fórmula
        doc.fontSize(20)
           .fillColor('#2c3e50')
           .text(formula.name, { align: 'left' });
        
        doc.moveDown(1);

        // Caja con la fórmula
        const formulaBoxY = doc.y;
        doc.roundedRect(50, formulaBoxY, 495, 80, 10)
           .fillAndStroke('#e8f4f8', '#3498db');
        
        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text(formula.formula_text, 70, formulaBoxY + 30, {
             width: 455,
             align: 'center'
           });
        
        doc.moveDown(5);

        // Descripción
        if (formula.description) {
          doc.fontSize(14)
             .fillColor('#34495e')
             .text('Descripción:', { underline: true });
          
          doc.moveDown(0.5);
          
          doc.fontSize(12)
             .fillColor('#555')
             .text(formula.description, {
               align: 'justify',
               width: 495
             });
        }

        doc.moveDown(2);

        // Footer con metadata
        const footerY = 750;
        doc.fontSize(8)
           .fillColor('#95a5a6')
           .text(`Generado el: ${new Date().toLocaleDateString('es-ES', { 
             year: 'numeric', 
             month: 'long', 
             day: 'numeric',
             hour: '2-digit',
             minute: '2-digit'
           })}`, 50, footerY, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera un PDF con múltiples fórmulas de un libro
   */
  static generateBookFormulasPDF(bookName, formulas) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Portada
        doc.fontSize(28)
           .fillColor('#2c3e50')
           .text('📚 Colección de Fórmulas', { align: 'center' });
        
        doc.moveDown(1);
        
        doc.fontSize(20)
           .fillColor('#3498db')
           .text(bookName, { align: 'center' });
        
        doc.moveDown(0.5);
        
        doc.fontSize(12)
           .fillColor('#7f8c8d')
           .text(`Total de fórmulas: ${formulas.length}`, { align: 'center' });
        
        doc.moveDown(3);
        
        // Línea divisoria
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#3498db')
           .lineWidth(2)
           .stroke();

        // Índice
        doc.addPage();
        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('Índice', { underline: true });
        
        doc.moveDown(1);
        
        formulas.forEach((formula, index) => {
          doc.fontSize(12)
             .fillColor('#555')
             .text(`${index + 1}. ${formula.name}`, { indent: 20 });
          doc.moveDown(0.3);
        });

        // Fórmulas
        formulas.forEach((formula, index) => {
          doc.addPage();
          
          // Número de fórmula
          doc.fontSize(10)
             .fillColor('#95a5a6')
             .text(`Fórmula ${index + 1} de ${formulas.length}`, { align: 'right' });
          
          doc.moveDown(0.5);
          
          // Título
          doc.fontSize(20)
             .fillColor('#2c3e50')
             .text(formula.name, { align: 'left' });
          
          doc.moveDown(1);

          // Caja con la fórmula
          const formulaBoxY = doc.y;
          doc.roundedRect(50, formulaBoxY, 495, 80, 10)
             .fillAndStroke('#e8f4f8', '#3498db');
          
          doc.fontSize(18)
             .fillColor('#2c3e50')
             .text(formula.formula_text, 70, formulaBoxY + 30, {
               width: 455,
               align: 'center'
             });
          
          doc.moveDown(5);

          // Descripción
          if (formula.description) {
            doc.fontSize(14)
               .fillColor('#34495e')
               .text('Descripción:', { underline: true });
            
            doc.moveDown(0.5);
            
            doc.fontSize(12)
               .fillColor('#555')
               .text(formula.description, {
                 align: 'justify',
                 width: 495
               });
          }

          // Footer de página
          doc.fontSize(8)
             .fillColor('#95a5a6')
             .text(`Página ${index + 2}`, 50, 750, { align: 'center' });
        });

        // Última página - metadata
        doc.addPage();
        doc.fontSize(12)
           .fillColor('#7f8c8d')
           .text('Documento generado automáticamente', { align: 'center' });
        
        doc.moveDown(0.5);
        
        doc.fontSize(10)
           .text(`Fecha: ${new Date().toLocaleDateString('es-ES', { 
             year: 'numeric', 
             month: 'long', 
             day: 'numeric',
             hour: '2-digit',
             minute: '2-digit'
           })}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFService;