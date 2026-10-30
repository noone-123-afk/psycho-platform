const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// دالة لتوليد ملف PDF وتنسيقه
async function createPDFBooklet(bookData, userName, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(outputPath);
        
        doc.pipe(stream);

        // هنا سنضيف خط عربي (يجب تنزيل ملف خط مثل Cairo أو Arial.ttf لاحقاً)
        // doc.font('path/to/arabic/font.ttf');

        // صفحة الغلاف
        doc.fontSize(28).text(bookData.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text(`تم إعداده خصيصاً لـ: ${userName || 'المستخدم'}`, { align: 'center' });
        doc.moveDown(5);
        doc.fontSize(12).text("منصة التحليل النفسي والاجتماعي", { align: 'center' });
        
        doc.addPage();

        // دوال مساعدة لطباعة الفصول
        const printChapter = (title, content) => {
            doc.fontSize(20).text(title, { underline: true });
            doc.moveDown();
            doc.fontSize(14).text(content, { align: 'right', width: 450 }); // align: right للغة العربية
            doc.addPage();
        };

        printChapter("الفصل الأول: مرآة الذات", bookData.chapter1_mirror);
        printChapter("الفصل الثاني: التشخيص والتحليل", bookData.chapter2_diagnosis);
        printChapter("الفصل الثالث: همسات من التاريخ", bookData.chapter3_history);
        printChapter("الفصل الرابع: استراحة الروح (أدب وطرائف)", bookData.chapter4_literature);
        printChapter("الفصل الخامس: خارطة الطريق للتعافي", bookData.chapter5_roadmap);

        // إنهاء الـ PDF
        doc.end();

        stream.on('finish', () => {
            resolve(outputPath);
        });
        stream.on('error', reject);
    });
}

module.exports = { createPDFBooklet };
